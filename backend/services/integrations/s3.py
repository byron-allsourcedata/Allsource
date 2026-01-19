import asyncio
import csv
import json
import logging
import os
import re
import tempfile
import uuid
from datetime import date, datetime, timezone
from typing import Any, List, Annotated, Tuple
from uuid import UUID
from models import FiveXFiveUser, LeadUser

import boto3
import httpx
from botocore.exceptions import (
    ClientError,
    NoCredentialsError,
    PartialCredentialsError,
)
from fastapi import HTTPException, Depends

from enums import (
    IntegrationsStatus,
    SourcePlatformEnum,
    ProccessDataSyncResult,
    IntegrationLimit,
    DataSyncType,
)
from models.enrichment.enrichment_users import EnrichmentUser
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.integrations.users_domains_integrations import UserIntegration
from persistence.domains import UserDomainsPersistence
from persistence.integrations.integrations_persistence import (
    IntegrationsPersistence,
)
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.leads_persistence import LeadsPersistence
from resolver import injectable
from schemas.integrations.integrations import DataMap, IntegrationCredentials
from services.integrations.commonIntegration import *
from services.integrations.million_verifier import (
    MillionVerifierIntegrationsService,
)
from utils import (
    get_http_client,
    get_valid_email,
    get_valid_email_without_million,
    get_valid_phone,
    validate_and_format_phone,
)

logger = logging.getLogger(__name__)


@injectable
class S3IntegrationService:
    def __init__(
        self,
        domain_persistence: UserDomainsPersistence,
        integrations_persistence: IntegrationsPersistence,
        leads_persistence: LeadsPersistence,
        sync_persistence: IntegrationsUserSyncPersistence,
        client: Annotated[httpx.Client, Depends(get_http_client)],
        million_verifier_integrations: MillionVerifierIntegrationsService,
    ):
        self.domain_persistence = domain_persistence
        self.integrations_persisntece = integrations_persistence
        self.leads_persistence = leads_persistence
        self.million_verifier_integrations = million_verifier_integrations
        self.sync_persistence = sync_persistence
        self.client = client

    def get_credentials(self, domain_id: int, user_id: int):
        return self.integrations_persisntece.get_credentials_for_service(
            domain_id=domain_id,
            user_id=user_id,
            service_name=SourcePlatformEnum.S3.value,
        )

    def __handle_request(
        self,
        url: str,
        headers: dict = None,
        json: dict = None,
        data: dict = None,
        params: dict = None,
        api_key: str = None,
        method: str = "GET",
    ):
        if not headers:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "accept": "application/json",
                "content-type": "application/json",
            }
        url = f"https://api.sendlane.com/v2" + url
        response = self.client.request(
            method, url, headers=headers, json=json, data=data, params=params
        )

        if response.is_redirect:
            redirect_url = response.headers.get("Location")
            if redirect_url:
                response = self.client.request(
                    method,
                    redirect_url,
                    headers=headers,
                    json=json,
                    data=data,
                    params=params,
                )
        return response

    def __save_integrations(
        self, *, secret_id: str, secret_key, domain_id: int, user: dict
    ):
        credential = self.get_credentials(domain_id, user.get("id"))
        if credential:
            credential.access_token = json.dumps(
                {"secret_id": secret_id, "secret_key": secret_key}
            )
            credential.is_failed = False
            credential.error_message = None
            self.integrations_persisntece.db.commit()
            return credential

        common_integration = os.getenv("COMMON_INTEGRATION") == "True"
        integration_data = {
            "access_token": json.dumps(
                {"secret_id": secret_id, "secret_key": secret_key}
            ),
            "full_name": user.get("full_name"),
            "service_name": SourcePlatformEnum.S3.value,
            "limit": IntegrationLimit.S3.value,
        }

        if common_integration:
            integration_data["user_id"] = user.get("id")
        else:
            integration_data["domain_id"] = domain_id

        integartion = self.integrations_persisntece.create_integration(
            integration_data
        )

        if not integartion:
            raise HTTPException(
                status_code=409,
                detail={"status": IntegrationsStatus.CREATE_IS_FAILED.value},
            )

        return IntegrationsStatus.SUCCESS

    def edit_sync(
        self,
        leads_type: str,
        list_name: str,
        path_prefix: str,
        config_params: dict,
        data_map: List[DataMap],
        integrations_users_sync_id: int,
        domain_id: int,
        created_by: str,
        user_id: int,
    ):
        credentials = self.get_credentials(domain_id, user_id)
        sync = self.sync_persistence.edit_sync(
            {
                "integration_id": credentials.id,
                "list_name": list_name,
                "path_prefix": path_prefix,
                "leads_type": leads_type,
                "config_params": config_params,
                "data_map": data_map,
                "created_by": created_by,
            },
            integrations_users_sync_id,
        )

        return sync

    def __get_list(self, secret_id: str, secret_key: str):
        # Validate credentials are provided
        if not secret_id or not secret_key:
            raise NoCredentialsError("AWS credentials are missing or empty")
        
        # Create an isolated session with explicit credentials to prevent fallback to system credentials
        session = boto3.Session(
            aws_access_key_id=secret_id,
            aws_secret_access_key=secret_key,
        )
        s3_client = session.client("s3")
        response = s3_client.list_buckets()
        return response

    def get_list(self, domain_id: int, user_id: int):
        credential = self.get_credentials(domain_id, user_id)
        if not credential:
            return

        parsed_data = json.loads(credential.access_token)
        secret_id = parsed_data["secret_id"]
        secret_key = parsed_data["secret_key"]
        try:
            lists = self.__get_list(secret_id=secret_id, secret_key=secret_key)
        except NoCredentialsError:
            credential.is_failed = True
            credential.error_message = "Invalid API Key"
            self.integrations_persisntece.db.commit()
            raise HTTPException(
                status_code=400,
                detail={
                    "status": "CREDENTIALS_MISSING",
                    "message": "Missing AWS credentials",
                },
            )
        except PartialCredentialsError:
            credential.is_failed = True
            credential.error_message = "Invalid API Key"
            self.integrations_persisntece.db.commit()
            raise HTTPException(
                status_code=400,
                detail={
                    "status": "CREDENTIALS_INCOMPLETE",
                    "message": "Incomplete AWS credentials",
                },
            )
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            credential.is_failed = True
            credential.error_message = "Invalid API Key"
            self.integrations_persisntece.db.commit()
            raise HTTPException(
                status_code=400,
                detail={
                    "status": "CREDENTIALS_INVALID",
                    "message": f"AWS error: {error_code}",
                },
            )

        return [bucket["Name"] for bucket in lists.get("Buckets", [])]

    async def add_integration(
        self, credentials: IntegrationCredentials, domain, user: dict
    ):
        domain_id = None if domain is None else domain.id
        try:
            self.__get_list(
                secret_id=credentials.s3.secret_id,
                secret_key=credentials.s3.secret_key
            )
            self.__save_integrations(
                secret_id=credentials.s3.secret_id,
                secret_key=credentials.s3.secret_key,
                domain_id=domain_id,
                user=user,
            )
            return {"status": IntegrationsStatus.SUCCESS.value}
        except NoCredentialsError:
            return {
                "status": "CREDENTIALS_MISSING",
                "message": "Missing AWS credentials",
            }
        except PartialCredentialsError:
            return {
                "status": "CREDENTIALS_INCOMPLETE",
                "message": "Incomplete AWS credentials",
            }
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            return {
                "status": "CREDENTIALS_INVALID",
                "message": f"AWS error: {error_code}",
            }

        

    async def create_sync(
        self,
        domain_id: int,
        leads_type: str,
        list_name: str,
        config_params: dict,
        data_map: List[DataMap],
        created_by: str,
        user: dict,
    ):
        credentials = self.get_credentials(
            user_id=user.get("id"), domain_id=domain_id
        )
        sync = self.sync_persistence.create_sync(
            data={
                "integration_id": credentials.id,
                "list_name": list_name,
                "sent_contacts": -1,
                "sync_type": DataSyncType.CONTACT.value,
                "leads_type": leads_type,
                "domain_id": domain_id,
                "data_map": data_map,
                "created_by": created_by,
                "config_params": config_params,
            }
        )
        return sync

    def get_smart_credentials(self, user_id: int):
        credential = (
            self.integrations_persisntece.get_smart_credentials_for_service(
                user_id=user_id, service_name=SourcePlatformEnum.S3.value
            )
        )
        return credential

    def create_smart_audience_sync(
        self,
        smart_audience_id: UUID,
        sent_contacts: int,
        created_by: str,
        user: dict,
        list_name: str = None,
        data_map: List[DataMap] = [],
    ):
        credentials = self.get_smart_credentials(user_id=user.get("id"))
        sync = self.sync_persistence.create_sync(
            data={
                "integration_id": credentials.id,
                "sent_contacts": sent_contacts,
                "sync_type": DataSyncType.AUDIENCE.value,
                "smart_audience_id": smart_audience_id,
                "list_name": list_name,
                "data_map": data_map,
                "created_by": created_by,
            }
        )
        return sync

    async def process_data_sync_lead(
        self,
        user_integration: UserIntegration,
        integration_data_sync: IntegrationUserSync,
        user_data: List[Tuple[LeadUser, FiveXFiveUser]],
        is_email_validation_enabled: bool,
    ):
        profiles = []
        results = []
        for lead_user, five_x_five_user in user_data:
            profile = await self.__mapped_profile_lead(
                five_x_five_user,
                integration_data_sync.data_map,
                is_email_validation_enabled,
                lead_user.first_visit_id,
                lead_user.id,
            )
            if profile in (
                ProccessDataSyncResult.INCORRECT_FORMAT.value,
                ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value,
            ):
                results.append({"lead_id": lead_user.id, "status": profile})
                continue
            else:
                results.append({"lead_id": lead_user.id, "status": ProccessDataSyncResult.SUCCESS.value})
            profiles.append(profile)

        if not profiles:
            return results

        list_response = self.__send_contacts(
            access_token=user_integration.access_token,
            bucket_name=integration_data_sync.list_name,
            profiles=profiles,
            user_integration=user_integration,
            path_prefix=integration_data_sync.config_params.get("path_prefix") if integration_data_sync.config_params else None,
        )

        logger.info(f"List response: {list_response}")
        return results

    
    async def process_data_sync(
        self,
        user_integration: UserIntegration,
        integration_data_sync: IntegrationUserSync,
        enrichment_users: List[EnrichmentUser],
        target_schema: str,
        validations: dict = {},
    ):
        profiles = []
        results = []
        for enrichment_user in enrichment_users:
            profile = self.__mapped_s3_contact(
                enrichment_user,
                target_schema,
                validations,
                integration_data_sync.data_map,
            )

            if profile == ProccessDataSyncResult.INCORRECT_FORMAT.value:
                results.append(
                    {
                        "enrichment_user_asid": enrichment_user.asid,
                        "status": profile,
                    }
                )
                continue
            else:
                results.append(
                    {
                        "enrichment_user_asid": enrichment_user.asid,
                        "status": ProccessDataSyncResult.SUCCESS.value,
                    }
                )
            profiles.append(profile)

        if not profiles:
            return results

        list_response = self.__send_contacts(
            access_token=user_integration.access_token,
            bucket_name=integration_data_sync.list_name,
            profiles=profiles,
            user_integration=user_integration,
        )

        if list_response != ProccessDataSyncResult.SUCCESS.value:
            for result in results:
                if result["status"] == ProccessDataSyncResult.SUCCESS.value:
                    result["status"] = list_response

        return results

    def upload_file_to_bucket(
        self,
        secret_id: str,
        secret_key: str,
        file_path: str,
        object_key: str,
        bucket_name: str,
    ):
        # Validate credentials are provided
        if not secret_id or not secret_key:
            logger.error("AWS credentials are missing or empty for S3 upload")
            return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
        
        # Create an isolated session with explicit credentials to prevent fallback to system credentials
        session = boto3.Session(
            aws_access_key_id=secret_id,
            aws_secret_access_key=secret_key,
        )
        s3_client = session.client("s3")

        try:
            s3_client.upload_file(file_path, bucket_name, object_key)
            return ProccessDataSyncResult.SUCCESS.value
        except Exception as e:
            logger.error("Error when uploading a file:", e)
            return ProccessDataSyncResult.AUTHENTICATION_FAILED.value

    def generate_object_key(self, user_email: str, domain: str, path_prefix="data", extension="csv"):
        # Format date as MM-DD-YYYYTHH-MM (e.g., 12-05-2025T12-11)
        # Remove leading/trailing slashes from prefix if present
        path_prefix = path_prefix.strip("/") if path_prefix else "data"
        date_str = datetime.now(timezone.utc).strftime("%m-%d-%YT%H-%M")
        # Sanitize email and domain for filename (replace special chars with underscores)
        safe_email = re.sub(r"[^a-zA-Z0-9@._-]", "_", user_email)
        safe_domain = re.sub(r"[^a-zA-Z0-9._-]", "_", domain)
        return f"{path_prefix}/{safe_email}_{safe_domain}_{date_str}.{extension}"

    def __send_contacts(
        self, access_token: str, bucket_name: str, profiles: list[dict], user_integration: UserIntegration,path_prefix: str=None
    ):
        parsed_data = json.loads(access_token)
        secret_id = parsed_data["secret_id"]
        secret_key = parsed_data["secret_key"]
        
        # Get domain from domain_id
        domain = "unknown"
        if user_integration.domain_id:
            domain_name = self.domain_persistence.get_domain_name(user_integration.domain_id)
            if domain_name:
                domain = domain_name
        
        # Get user email from user_id
        user_email = "unknown@unknown.com"
        if user_integration.user_id:
            from models.users import Users
            user = self.integrations_persisntece.db.query(Users).filter(Users.id == user_integration.user_id).first()
            if user and user.email:
                user_email = user.email

        # Define canonical header order (matching __mapped_profile_lead order)
        canonical_order = [
            "First name",
            "Last name",
            "Mobile phone",
            "Personal phone",
            "Direct number",
            "Address",
            "City",
            "State",
            "Zip",
            "Personal email",
            "Personal email last seen",
            "Business email",
            "Business email last seen",
            "Personal LinkedIn url",
            "Gender",
            "Age range",
            "Marital status",
            "Children",
            "Job title",
            "Seniority level",
            "Department",
            "Company name",
            "Company domain",
            "Company phone",
            "Company description",
            "Business email (alt)",
            "Business email last seen (alt)",
            "Company last updated",
            "Company address",
            "Company city",
            "Company state",
            "Company zipcode",
            "Income range",
            "Net worth",
            "Company revenue",
            "Company employee count",
            "Primary industry",
            "Followers",
            "Company LinkedIn url",
            "Visited Date",
            "Page Visits",
            "Page visits count",
            "Time on site",
            "Page visits with parameters",
        ]

        # Collect all unique headers from profiles
        all_headers = {key for profile in profiles for key in profile}
        
        # Order headers: first canonical order (only if present), then any extras
        headers = []
        seen = set()
        
        # Add headers in canonical order
        for header in canonical_order:
            if header in all_headers:
                headers.append(header)
                seen.add(header)
        
        # Add any remaining headers that weren't in canonical order (e.g., custom fields)
        for header in all_headers:
            if header not in seen:
                headers.append(header)

        with tempfile.NamedTemporaryFile(
            mode="w", newline="", suffix=".csv", delete=False, encoding="utf-8"
        ) as temp_csv:
            writer = csv.DictWriter(temp_csv, fieldnames=headers)
            writer.writeheader()
            for row in profiles:
                writer.writerow({key: row.get(key, "") for key in headers})
            temp_file_path = temp_csv.name

        result = self.upload_file_to_bucket(
            secret_id=secret_id,
            secret_key=secret_key,
            file_path=temp_file_path,
            object_key=self.generate_object_key(user_email=user_email, domain=domain, path_prefix=path_prefix),
            bucket_name=bucket_name,
        )

        return result

    async def __mapped_profile_lead(
        self,
        lead: FiveXFiveUser,
        data_map: list,
        is_email_validation_enabled: bool,
        lead_visit_id: int,
        lead_user_id: int,
    ) -> str | dict[str | Any, str | None | Any]:
        if is_email_validation_enabled:
            first_email = await get_valid_email(
                lead, self.million_verifier_integrations
            )
        else:
            first_email = get_valid_email_without_million(lead)

        if first_email in (
            ProccessDataSyncResult.INCORRECT_FORMAT.value,
            ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value,
        ):
            return first_email

        # Get visit stats
        time_on_site, page_visits_count = await asyncio.to_thread(
            self.leads_persistence.get_visit_stats, lead.id
        )

        # Get visited date
        visited_date = None
        if lead_visit_id:
            visited_date = await asyncio.to_thread(
                self.leads_persistence.get_visited_date, lead_visit_id
            )

        # Get page visits with parameters
        page_visits_with_params = None
        page_visits = None
        try:
            page_visits_data = await asyncio.to_thread(
                self.leads_persistence.get_latest_page_time, lead_user_id
            )
            if page_visits_data:
                page_visits_list = []
                page_visits_with_params_list = []
                for visit in page_visits_data:
                    # SQLAlchemy Row objects can be accessed as attributes or dict keys
                    page = getattr(visit, "page", None) or (visit["page"] if isinstance(visit, dict) else None)
                    page_params = getattr(visit, "page_parameters", None) or (visit.get("page_parameters") if isinstance(visit, dict) else None)
                    
                    if page:
                        # Page visits without parameters
                        page_visits_list.append(page)
                        
                        # Page visits with parameters
                        qs = (
                            page_params.replace(", ", "&").replace(",", "&")
                            if page_params
                            else ""
                        )
                        url = f"{page}?{qs}" if qs else page
                        page_visits_with_params_list.append(url)
                
                page_visits = "\n".join(page_visits_list) if page_visits_list else None
                page_visits_with_params = "\n".join(page_visits_with_params_list) if page_visits_with_params_list else None
        except Exception as e:
            logger.warning(f"Error getting page visits with parameters: {e}")
            page_visits_with_params = None
            page_visits = None

        # Format dates
        personal_email_last_seen = (
            lead.personal_emails_last_seen.isoformat()
            if lead.personal_emails_last_seen
            else None
        )
        business_email_last_seen = (
            lead.business_email_last_seen.isoformat()
            if lead.business_email_last_seen
            else None
        )
        company_last_updated = (
            lead.company_last_updated.isoformat()
            if lead.company_last_updated
            else None
        )
        visited_date_str = (
            visited_date.isoformat() if isinstance(visited_date, (date, datetime)) else str(visited_date) if visited_date else None
        )

        # Build address strings
        personal_address = lead.personal_address
        if lead.personal_address_2:
            personal_address = (
                f"{personal_address}, {lead.personal_address_2}"
                if personal_address
                else lead.personal_address_2
            )

        company_address = lead.company_address
        # if lead.company_address_2:
        #     company_address = (
        #         f"{company_address}, {lead.company_address_2}"
        #         if company_address
        #         else lead.company_address_2
        #     )

        # Get business email alt (from programmatic_business_emails)
        business_email_alt = None
        if lead.programmatic_business_emails:
            try:
                emails = json.loads(lead.programmatic_business_emails)
                if isinstance(emails, list) and len(emails) > 0:
                    business_email_alt = emails[0]
                elif isinstance(emails, str):
                    business_email_alt = emails
            except (json.JSONDecodeError, AttributeError):
                business_email_alt = lead.programmatic_business_emails

        profile = {
            "First name": getattr(lead, "first_name", None),
            "Last name": getattr(lead, "last_name", None),
            "Mobile phone": validate_and_format_phone(getattr(lead, "mobile_phone", None)),
            "Personal phone": validate_and_format_phone(getattr(lead, "personal_phone", None)),
            "Direct number": validate_and_format_phone(getattr(lead, "direct_number", None)),
            "Address": personal_address,
            "City": getattr(lead, "personal_city", None),
            "State": getattr(lead, "personal_state", None),
            "Zip": getattr(lead, "personal_zip", None),
            "Personal email": getattr(lead, "personal_emails", None),
            "Personal email last seen": personal_email_last_seen,
            "Business email": getattr(lead, "business_email", None),
            "Business email last seen": business_email_last_seen,
            "Personal LinkedIn url": getattr(lead, "linkedin_url", None),
            "Gender": getattr(lead, "gender", None),
            "Age range": None,  # Not available in model
            "Marital status": getattr(lead, "married", None),
            "Children": getattr(lead, "children", None),
            "Job title": getattr(lead, "job_title", None),
            "Seniority level": getattr(lead, "seniority_level", None),
            "Department": getattr(lead, "department", None),
            "Company name": getattr(lead, "company_name", None),
            "Company domain": getattr(lead, "company_domain", None),
            "Company phone": getattr(lead, "company_phone", None),
            "Company description": getattr(lead, "company_description", None),
            "Business email (alt)": business_email_alt,
            "Business email last seen (alt)": None,  # Not available in model
            "Company last updated": company_last_updated,
            "Company address": company_address,
            "Company city": getattr(lead, "company_city", None),
            "Company state": getattr(lead, "company_state", None),
            "Company zipcode": getattr(lead, "company_zip", None),
            "Income range": getattr(lead, "income_range", None),
            "Net worth": getattr(lead, "net_worth", None),
            "Company revenue": getattr(lead, "company_revenue", None),
            "Company employee count": getattr(lead, "company_employee_count", None),
            "Primary industry": getattr(lead, "primary_industry", None),
            "Followers": None,  # Not available in model
            "Company LinkedIn url": getattr(lead, "company_linkedin_url", None),
            "Visited Date": visited_date_str,
            "Page Visits": page_visits,
            "Page visits count": page_visits_count if page_visits_count else None,
            "Time on site": time_on_site if time_on_site else None,
            "Page visits with parameters": page_visits_with_params,
        }

        # Handle visited_date field from data_map
        visited_date_field = next(
            (f for f in data_map if f["type"] == "visited_date"), None
        )

        if visited_date_field and visited_date_str:
            profile[visited_date_field["value"]] = visited_date_str

        # Handle custom fields from data_map
        # for field in data_map:
        #     t = field["type"]
        #     v = field["value"]

        #     if t == "visited_date":
        #         continue

        #     val = getattr(lead, t, None)

        #     if val is None:
        #         continue

        #     if isinstance(val, (datetime, date)):
        #         val = val.isoformat()

        #     profile[v] = val

        # Clean profile: remove None and empty values, sanitize keys
        # cleaned = {
        #     re.sub(r"[^a-z0-9_]", "_", k.lower()[:100]): v
        #     for k, v in profile.items()
        #     if v not in (None, "")
        # }

        return profile

    def __mapped_s3_contact(
        self,
        enrichment_user: EnrichmentUser,
        target_schema: str,
        validations: dict,
        data_map: list,
    ):
        enrichment_contacts = enrichment_user.contacts
        if not enrichment_contacts:
            return None

        business_email, personal_email, phone = (
            self.sync_persistence.get_verified_email_and_phone(
                enrichment_user.asid
            )
        )
        main_email, main_phone = resolve_main_email_and_phone(
            enrichment_contacts=enrichment_contacts,
            validations=validations,
            target_schema=target_schema,
            business_email=business_email,
            personal_email=personal_email,
            phone=phone,
        )
        first_name = enrichment_contacts.first_name
        last_name = enrichment_contacts.last_name

        if not main_email or not first_name or not last_name:
            return None

        result = {
            "email": main_email,
            "firstname": first_name,
            "lastname": last_name,
        }

        required_types = {m["type"] for m in data_map}
        context = {
            "main_phone": main_phone if main_phone else None,
            "professional_profiles": enrichment_user.professional_profiles,
            "postal": enrichment_user.postal,
            "personal_profiles": enrichment_user.personal_profiles,
            "business_email": business_email if business_email else None,
            "personal_email": personal_email if personal_email else None,
            "country_code": enrichment_user.postal,
            "gender": enrichment_user.personal_profiles,
            "zip_code": enrichment_user.personal_profiles,
            "state": enrichment_user.postal,
            "city": enrichment_user.postal,
            "company": enrichment_user.professional_profiles,
            "linkedin_url": enrichment_contacts,
        }

        for field_type in required_types:
            filler = FIELD_FILLERS.get(field_type)
            if filler:
                filler(result, context)

        return result
