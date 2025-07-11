import csv
import hashlib
import io
import logging
import os
from typing import Tuple, Annotated

import httpx
from fastapi import HTTPException, Depends

from enums import (
    IntegrationsStatus,
    SourcePlatformEnum,
    ProccessDataSyncResult,
    DataSyncType,
    IntegrationLimit,
)
from models import LeadUser
from models.enrichment.enrichment_users import EnrichmentUser
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.integrations.users_domains_integrations import UserIntegration
from persistence.domains import UserDomainsPersistence
from persistence.integrations.integrations_persistence import (
    IntegrationsPresistence,
)
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.leads_persistence import LeadsPersistence, FiveXFiveUser
from resolver import injectable
from schemas.integrations.integrations import *
from services.integrations.commonIntegration import *
from services.integrations.million_verifier import (
    MillionVerifierIntegrationsService,
)
from utils import (
    get_valid_email,
    get_http_client,
    get_valid_email_without_million,
    get_valid_phone,
)
from utils import validate_and_format_phone


@injectable
class SalesForceIntegrationsService:
    def __init__(
        self,
        domain_persistence: UserDomainsPersistence,
        integrations_persistence: IntegrationsPresistence,
        leads_persistence: LeadsPersistence,
        sync_persistence: IntegrationsUserSyncPersistence,
        client: Annotated[httpx.Client, Depends(get_http_client)],
        million_verifier_integrations: MillionVerifierIntegrationsService,
    ):
        self.domain_persistence = domain_persistence
        self.integrations_persisntece = integrations_persistence
        self.leads_persistence = leads_persistence
        self.sync_persistence = sync_persistence
        self.million_verifier_integrations = million_verifier_integrations
        self.client = client

    def __handle_request(
        self,
        method: str,
        url: str,
        headers: dict = None,
        json: dict = None,
        data: dict = None,
        params: dict = None,
        api_key: str = None,
    ):
        if not headers:
            headers = {
                "accept": "application/json",
                "content-type": "application/json",
            }
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

    def get_credentials(self, domain_id: int, user_id: int):
        credential = self.integrations_persisntece.get_credentials_for_service(
            domain_id=domain_id,
            user_id=user_id,
            service_name=SourcePlatformEnum.SALES_FORCE.value,
        )
        return credential

    def get_smart_credentials(self, user_id: int):
        credential = (
            self.integrations_persisntece.get_smart_credentials_for_service(
                user_id=user_id,
                service_name=SourcePlatformEnum.SALES_FORCE.value,
            )
        )
        return credential

    def __save_integrations(
        self, api_key: str, instance_url: str, domain_id: int, user: dict
    ):
        credential = self.get_credentials(domain_id, user.get("id"))
        if credential:
            credential.access_token = api_key
            credential.is_failed = False
            credential.error_message = None
            self.integrations_persisntece.db.commit()
            return credential

        common_integration = os.getenv("COMMON_INTEGRATION") == "True"
        integration_data = {
            "access_token": api_key,
            "full_name": user.get("full_name"),
            "instance_url": instance_url,
            "service_name": SourcePlatformEnum.SALES_FORCE.value,
            "limit": IntegrationLimit.SALESFORCE.value,
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

        return integartion

    def get_list(self, domain_id: int, user_id: int):
        credentials = self.get_credentials(domain_id, user_id)
        if not credentials:
            return
        return self.__get_list(credentials.access_token, credentials)

    def edit_sync(
        self,
        leads_type: str,
        integrations_users_sync_id: int,
        domain_id: int,
        created_by: str,
        user_id: int,
        data_map: List[DataMap] = [],
    ):
        credentials = self.get_credentials(domain_id, user_id)
        sync = self.sync_persistence.edit_sync(
            {
                "integration_id": credentials.id,
                "leads_type": leads_type,
                "data_map": data_map,
                "created_by": created_by,
            },
            integrations_users_sync_id,
        )
        return sync

    def get_access_token(self, refresh_token):
        data = {
            "grant_type": "refresh_token",
            "client_id": os.getenv("SALES_FORCE_TOKEN"),
            "client_secret": os.getenv("SALES_FORCE_SECRET"),
            "refresh_token": refresh_token,
        }
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
        }
        response = self.__handle_request(
            method="POST",
            url="https://login.salesforce.com/services/oauth2/token",
            data=data,
            headers=headers,
        )
        return response.json().get("access_token")

    def _to_csv(self, records: list[dict]) -> str:
        if not records:
            return ""

        output = io.StringIO()

        all_keys = set()
        for rec in records:
            all_keys.update(rec.keys())

        writer = csv.DictWriter(
            output, fieldnames=list(all_keys), lineterminator="\n"
        )
        writer.writeheader()

        for rec in records:
            full_rec = {key: rec.get(key, "") for key in all_keys}
            writer.writerow(full_rec)

        return output.getvalue()

    def generate_external_id(self, profile: dict) -> str:
        unique_value = profile.get("email")
        if not unique_value:
            unique_value = str(profile)

        return hashlib.md5(unique_value.encode("utf-8")).hexdigest()

    # def test(self, profiles, instance_url, access_token):
    #     url = f"{instance_url}/services/data/v59.0/sobjects/Lead"
    #     headers = {
    #         "Authorization": f"Bearer {access_token}",
    #         "Content-Type": "application/json"
    #     }
    #     response = self.__handle_request(method='POST', url=url, json=profiles[-3], headers=headers)
    #     if response.status_code == 201:
    #         print("Created:", response.json())
    #     elif response.status_code == 204:
    #         print("Updated existing record")
    #     else:
    #         print("Error:", response.status_code, response.json())

    def bulk_upsert_leads(
        self, profiles: list[dict], instance_url: str, access_token: str
    ) -> str:
        try:
            job_payload = {
                "object": "Lead",
                "operation": "upsert",
                "externalIdFieldName": "Id",
                "contentType": "CSV",
            }
            base_url = f"{instance_url}/services/data/v59.0/jobs/ingest"
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            }
            job_resp = self.__handle_request(
                method="POST", url=base_url, json=job_payload, headers=headers
            )
            job_resp.raise_for_status()
            job_id = job_resp.json()["id"]
            csv_data = self._to_csv(profiles)
            upload_headers = {
                "Authorization": headers["Authorization"],
                "Content-Type": "text/csv",
            }
            upload_url = f"{base_url}/{job_id}/batches"
            upload_resp = self.__handle_request(
                method="PUT",
                url=upload_url,
                data=csv_data,
                headers=upload_headers,
            )
            upload_resp.raise_for_status()
            close_url = f"{base_url}/{job_id}"
            close_payload = {"state": "UploadComplete"}
            close_resp = self.__handle_request(
                method="PATCH",
                url=close_url,
                json=close_payload,
                headers=headers,
            )
            close_resp.raise_for_status()
        except Exception as e:
            logging.error(e)
            return ProccessDataSyncResult.AUTHENTICATION_FAILED.value

        return ProccessDataSyncResult.SUCCESS.value

    def add_integration(
        self, credentials: IntegrationCredentials, domain, user: dict
    ):
        domain_id = None if domain is None else domain.id
        client_id = os.getenv("SALES_FORCE_TOKEN")
        client_secret = os.getenv("SALES_FORCE_SECRET")
        data = {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": credentials.sales_force.code,
            "grant_type": "authorization_code",
            "redirect_uri": f"{os.getenv('SITE_HOST_URL')}/sales-force-landing",
        }
        response = self.__handle_request(
            method="POST",
            url="https://login.salesforce.com/services/oauth2/token",
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if response.status_code == 200:
            token_data = response.json()
            refresh_token = token_data.get("refresh_token")
            instance_url = token_data.get("instance_url")
            integration = self.__save_integrations(
                refresh_token,
                instance_url,
                domain_id,
                user,
            )
            return {
                "integrations": integration,
                "status": IntegrationsStatus.SUCCESS.value,
            }
        else:
            raise HTTPException(
                status_code=400, detail="Failed to get access token"
            )

    async def create_sync(
        self,
        leads_type: str,
        domain_id: int,
        created_by: str,
        user: dict,
        data_map: List[DataMap] = [],
    ):
        credentials = self.get_credentials(
            user_id=user.get("id"), domain_id=domain_id
        )
        sync = self.sync_persistence.create_sync(
            {
                "integration_id": credentials.id,
                "domain_id": domain_id,
                "leads_type": leads_type,
                "sent_contacts": -1,
                "sync_type": DataSyncType.CONTACT.value,
                "data_map": data_map,
                "created_by": created_by,
            }
        )
        return sync

    def create_smart_audience_sync(
        self,
        smart_audience_id: UUID,
        sent_contacts: int,
        created_by: str,
        user: dict,
        data_map: List[DataMap] = [],
    ):
        credentials = self.get_smart_credentials(user_id=user.get("id"))
        sync = self.sync_persistence.create_sync(
            {
                "integration_id": credentials.id,
                "sent_contacts": sent_contacts,
                "sync_type": DataSyncType.AUDIENCE.value,
                "smart_audience_id": smart_audience_id,
                "data_map": data_map,
                "created_by": created_by,
            }
        )
        return sync

    def get_failed_results(
        self, job_id: str, instance_url: str, access_token: str
    ) -> str:
        url = f"{instance_url}/services/data/v59.0/jobs/ingest/{job_id}/failedResults"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        response = self.__handle_request(method="GET", url=url, headers=headers)
        response.raise_for_status()
        return response.text

    async def process_data_sync(
        self,
        user_integration: UserIntegration,
        integration_data_sync: IntegrationUserSync,
        enrichment_users: EnrichmentUser,
        target_schema: str,
        validations: dict = {},
    ):
        profiles = []
        results = []
        access_token = self.get_access_token(user_integration.access_token)
        country_state_map = self._get_country_state_map_list()
        if not access_token:
            return [
                {"status": ProccessDataSyncResult.AUTHENTICATION_FAILED.value}
            ]

        for enrichment_user in enrichment_users:
            profile = self.__mapped_sales_force_profile(
                enrichment_user,
                target_schema,
                validations,
                integration_data_sync.data_map,
                country_state_map,
            )

            if profile == ProccessDataSyncResult.INCORRECT_FORMAT.value:
                results.append(
                    {
                        "enrichment_user_id": enrichment_user.id,
                        "status": profile,
                    }
                )
                continue
            else:
                results.append(
                    {
                        "enrichment_user_id": enrichment_user.id,
                        "status": ProccessDataSyncResult.SUCCESS.value,
                    }
                )

            if profile:
                profiles.append(profile)

        if not profiles:
            return results

        response_result = self.bulk_upsert_leads(
            profiles=profiles,
            instance_url=user_integration.instance_url,
            access_token=access_token,
        )

        if response_result != ProccessDataSyncResult.SUCCESS.value:
            for result in results:
                if result["status"] == ProccessDataSyncResult.SUCCESS.value:
                    result["status"] = response_result

        return results

    async def process_data_sync_lead(
        self,
        user_integration: UserIntegration,
        integration_data_sync: IntegrationUserSync,
        user_data: List[Tuple[LeadUser, FiveXFiveUser]],
        is_email_validation_enabled: bool,
    ):
        profiles = []
        results = []
        access_token = self.get_access_token(user_integration.access_token)
        country_state_map = self._get_country_state_map_list()
        if not access_token:
            return [
                {"status": ProccessDataSyncResult.AUTHENTICATION_FAILED.value}
            ]

        for lead_user, five_x_five_user in user_data:
            profile = await self.__mapped_sales_force_profile_lead(
                five_x_five_user,
                integration_data_sync.data_map,
                is_email_validation_enabled,
                country_state_map,
            )
            if profile in (
                ProccessDataSyncResult.INCORRECT_FORMAT.value,
                ProccessDataSyncResult.AUTHENTICATION_FAILED.value,
                ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value,
            ):
                results.append({"lead_id": lead_user.id, "status": profile})
                continue
            else:
                results.append(
                    {
                        "lead_id": lead_user.id,
                        "status": ProccessDataSyncResult.SUCCESS.value,
                    }
                )

            profiles.append(profile)

        if not profiles:
            return results

        response_result = self.bulk_upsert_leads(
            profiles=profiles,
            instance_url=user_integration.instance_url,
            access_token=access_token,
        )
        if response_result in (
            ProccessDataSyncResult.AUTHENTICATION_FAILED.value,
            ProccessDataSyncResult.INCORRECT_FORMAT.value,
        ):
            for result in results:
                if result["status"] == ProccessDataSyncResult.SUCCESS.value:
                    result["status"] = response_result

        return results

    def set_suppression(self, suppression: bool, domain_id: int, user: dict):
        credential = self.get_credentials(domain_id, user.get("id"))
        if not credential:
            raise HTTPException(
                status_code=403,
                detail=IntegrationsStatus.CREDENTIALS_NOT_FOUND.value,
            )
        credential.suppression = suppression
        self.integrations_persisntece.db.commit()
        return {"message": "successfuly"}

    def get_profile(
        self,
        domain_id: int,
        fields: List[ContactFiled],
        date_last_sync: str = None,
    ) -> List[ContactSuppression]:
        credentials = self.get_credentials(domain_id)
        if not credentials:
            raise HTTPException(
                status_code=403,
                detail=IntegrationsStatus.CREDENTIALS_NOT_FOUND.value,
            )
        params = {
            "fields[profile]": ",".join(fields),
        }
        if date_last_sync:
            params["filter"] = f"greater-than(created,{date_last_sync})"
        response = self.__handle_request(
            method="GET",
            url="https://a.klaviyo.com/api/profiles/",
            api_key=credentials.access_token,
            params=params,
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail={
                    "status": "Profiles from Klaviyo could not be retrieved"
                },
            )
        return [
            self.__mapped_profile_from_klaviyo(profile)
            for profile in response.json().get("data")
        ]

    def __mapped_sales_force_profile(
        self,
        enrichment_user: EnrichmentUser,
        target_schema: str,
        validations: dict,
        data_map: list,
        country_state_map: dict[str, str],
    ) -> dict:
        enrichment_contacts = enrichment_user.contacts
        if not enrichment_contacts:
            return ProccessDataSyncResult.INCORRECT_FORMAT.value

        business_email, personal_email, phone = (
            self.sync_persistence.get_verified_email_and_phone(
                enrichment_user.id
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
            return ProccessDataSyncResult.INCORRECT_FORMAT.value

        professional_profiles = enrichment_user.professional_profiles
        if not professional_profiles:
            return ProccessDataSyncResult.INCORRECT_FORMAT.value

        company = professional_profiles.current_company_name
        if not company:
            return ProccessDataSyncResult.INCORRECT_FORMAT.value

        primary_industry = professional_profiles.primary_industry
        current_job_title = professional_profiles.current_job_title
        country = None
        state = None
        city = None
        postal_code = None
        if enrichment_user.postal:
            enrichment_postal = enrichment_user.postal
            country = (
                enrichment_postal.home_country
                or enrichment_postal.business_country
            )
            state = (
                enrichment_postal.home_state or enrichment_postal.business_state
            )
            city = (
                enrichment_postal.home_city or enrichment_postal.business_city
            )
            postal_code = (
                enrichment_postal.home_postal_code
                or enrichment_postal.business_postal_code
            )

        if state:
            state = country_state_map.get(state, None)

        if country:
            country = country_state_map.get(state, None)

        result = {
            # 'Id': str(enrichment_user.id),
            "Email": main_email,
            "FirstName": first_name,
            "LastName": last_name,
            "Company": company,
            "Title": current_job_title,
            "Phone": main_phone,
            "Industry": primary_industry,
            "City": city,
            "State": state,
            "PostalCode": postal_code,
            "Country": country,
        }

        return result

    async def __mapped_sales_force_profile_lead(
        self,
        five_x_five_user: FiveXFiveUser,
        data_map: list,
        is_email_validation_enabled: bool,
        country_state_map: dict[str, str],
    ) -> dict:
        if is_email_validation_enabled:
            first_email = await get_valid_email(
                five_x_five_user, self.million_verifier_integrations
            )
        else:
            first_email = get_valid_email_without_million(five_x_five_user)

        if first_email in (
            ProccessDataSyncResult.INCORRECT_FORMAT.value,
            ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value,
        ):
            return first_email

        company_name = getattr(five_x_five_user, "company_name", None)
        if not company_name:
            return ProccessDataSyncResult.INCORRECT_FORMAT.value

        first_phone = get_valid_phone(five_x_five_user)
        phone_number = validate_and_format_phone(first_phone)
        mobile_phone = getattr(five_x_five_user, "mobile_phone", None)

        location = {
            "address1": getattr(five_x_five_user, "personal_address")
            or getattr(five_x_five_user, "company_address", None),
            "city": getattr(five_x_five_user, "personal_city")
            or getattr(five_x_five_user, "company_city", None),
            "region": getattr(five_x_five_user, "personal_state")
            or getattr(five_x_five_user, "company_state", None),
            "zip": getattr(five_x_five_user, "personal_zip")
            or getattr(five_x_five_user, "company_zip", None),
        }

        description = getattr(five_x_five_user, "company_description", None)
        if description:
            description = description[:9999]

        company_employee_count = getattr(
            five_x_five_user, "company_employee_count", None
        )
        if company_employee_count:
            company_employee_count = str(company_employee_count).replace(
                "+", ""
            )
            if "to" in company_employee_count:
                start, end = company_employee_count.split(" to ")
                company_employee_count = (int(start) + int(end)) // 2
            else:
                company_employee_count = int(company_employee_count)
            company_employee_count = str(company_employee_count)

        company_revenue = getattr(five_x_five_user, "company_revenue", None)
        if company_revenue:
            try:
                company_revenue = (
                    str(company_revenue).replace("+", "").split(" to ")[-1]
                )
                if "Billion" in company_revenue:
                    cleaned_value = float(company_revenue.split()[0]) * 10**9
                elif "Million" in company_revenue:
                    cleaned_value = float(company_revenue.split()[0]) * 10**6
                elif company_revenue.isdigit():
                    cleaned_value = float(company_revenue)
                else:
                    cleaned_value = 0
            except:
                cleaned_value = 0

            company_revenue = str(cleaned_value)

        state = None
        if location:
            state = location.get("region")
            if state:
                state = country_state_map.get(state, None)

        return {
            "FirstName": getattr(five_x_five_user, "first_name", None),
            "LastName": getattr(five_x_five_user, "last_name", None),
            "Email": first_email,
            "Phone": ", ".join(phone_number.split(", ")[-3:])
            if phone_number
            else None,
            "MobilePhone": ", ".join(mobile_phone.split(", ")[-3:])
            if mobile_phone
            else None,
            "Company": company_name,
            "Title": getattr(five_x_five_user, "job_title", None),
            "Industry": getattr(five_x_five_user, "primary_industry", None),
            "LeadSource": "Web",
            "City": location.get("city") if location else None,
            "State": state,
            "Country": "United States",
            "NumberOfEmployees": company_employee_count,
            "AnnualRevenue": company_revenue,
            "Description": description,
        }

    def _get_country_state_map_list(self):
        return {
            "Andorra": "AD",
            "United Arab Emirates": "AE",
            "Afghanistan": "AF",
            "Antigua and Barbuda": "AG",
            "Anguilla": "AI",
            "Albania": "AL",
            "Armenia": "AM",
            "Angola": "AO",
            "Antarctica": "AQ",
            "Argentina": "AR",
            "Austria": "AT",
            "Australia": "AU",
            "Aruba": "AW",
            "Aland Islands": "AX",
            "Azerbaijan": "AZ",
            "Bosnia and Herzegovina": "BA",
            "Barbados": "BB",
            "Bangladesh": "BD",
            "Belgium": "BE",
            "Burkina Faso": "BF",
            "Bulgaria": "BG",
            "Bahrain": "BH",
            "Burundi": "BI",
            "Benin": "BJ",
            "Saint Barthélemy": "BL",
            "Bermuda": "BM",
            "Brunei Darussalam": "BN",
            "Bolivia, Plurinational State of": "BO",
            "Bonaire, Sint Eustatius and Saba": "BQ",
            "Brazil": "BR",
            "Bahamas": "BS",
            "Bhutan": "BT",
            "Bouvet Island": "BV",
            "Botswana": "BW",
            "Belarus": "BY",
            "Belize": "BZ",
            "Canada": "CA",
            "Cocos (Keeling) Islands": "CC",
            "Congo, the Democratic Republic of the": "CD",
            "Central African Republic": "CF",
            "Congo": "CG",
            "Switzerland": "CH",
            "Cote d'Ivoire": "CI",
            "Cook Islands": "CK",
            "Chile": "CL",
            "Cameroon": "CM",
            "China": "CN",
            "Colombia": "CO",
            "Costa Rica": "CR",
            "Cape Verde": "CV",
            "Curaçao": "CW",
            "Christmas Island": "CX",
            "Cyprus": "CY",
            "Czechia": "CZ",
            "Germany": "DE",
            "Djibouti": "DJ",
            "Denmark": "DK",
            "Dominica": "DM",
            "Dominican Republic": "DO",
            "Algeria": "DZ",
            "Ecuador": "EC",
            "Estonia": "EE",
            "Egypt": "EG",
            "Western Sahara": "EH",
            "Eritrea": "ER",
            "Spain": "ES",
            "Ethiopia": "ET",
            "Finland": "FI",
            "Fiji": "FJ",
            "Falkland Islands (Malvinas)": "FK",
            "Faroe Islands": "FO",
            "France": "FR",
            "Gabon": "GA",
            "United Kingdom": "GB",
            "Grenada": "GD",
            "Georgia": "GE",
            "French Guiana": "GF",
            "Guernsey": "GG",
            "Ghana": "GH",
            "Gibraltar": "GI",
            "Greenland": "GL",
            "Gambia": "GM",
            "Guinea": "GN",
            "Guadeloupe": "GP",
            "Equatorial Guinea": "GQ",
            "Greece": "GR",
            "South Georgia and the South Sandwich Islands": "GS",
            "Guatemala": "GT",
            "Guinea-Bissau": "GW",
            "Guyana": "GY",
            "Heard Island and McDonald Islands": "HM",
            "Honduras": "HN",
            "Croatia": "HR",
            "Haiti": "HT",
            "Hungary": "HU",
            "Indonesia": "ID",
            "Ireland": "IE",
            "Israel": "IL",
            "Isle of Man": "IM",
            "India": "IN",
            "British Indian Ocean Territory": "IO",
            "Iraq": "IQ",
            "Iceland": "IS",
            "Italy": "IT",
            "Jersey": "JE",
            "Jamaica": "JM",
            "Jordan": "JO",
            "Japan": "JP",
            "Kenya": "KE",
            "Kyrgyzstan": "KG",
            "Cambodia": "KH",
            "Kiribati": "KI",
            "Comoros": "KM",
            "Saint Kitts and Nevis": "KN",
            "Korea, Republic of": "KR",
            "Kuwait": "KW",
            "Cayman Islands": "KY",
            "Kazakhstan": "KZ",
            "Lao People's Democratic Republic": "LA",
            "Lebanon": "LB",
            "Saint Lucia": "LC",
            "Liechtenstein": "LI",
            "Sri Lanka": "LK",
            "Liberia": "LR",
            "Lesotho": "LS",
            "Lithuania": "LT",
            "Luxembourg": "LU",
            "Latvia": "LV",
            "Libya": "LY",
            "Morocco": "MA",
            "Monaco": "MC",
            "Moldova, Republic of": "MD",
            "Montenegro": "ME",
            "Saint Martin (French part)": "MF",
            "Madagascar": "MG",
            "North Macedonia": "MK",
            "Mali": "ML",
            "Myanmar": "MM",
            "Mongolia": "MN",
            "Macao": "MO",
            "Martinique": "MQ",
            "Mauritania": "MR",
            "Montserrat": "MS",
            "Malta": "MT",
            "Mauritius": "MU",
            "Maldives": "MV",
            "Malawi": "MW",
            "Mexico": "MX",
            "Malaysia": "MY",
            "Mozambique": "MZ",
            "Namibia": "NA",
            "New Caledonia": "NC",
            "Niger": "NE",
            "Norfolk Island": "NF",
            "Nigeria": "NG",
            "Nicaragua": "NI",
            "Netherlands": "NL",
            "Norway": "NO",
            "Nepal": "NP",
            "Nauru": "NR",
            "Niue": "NU",
            "New Zealand": "NZ",
            "Oman": "OM",
            "Panama": "PA",
            "Peru": "PE",
            "French Polynesia": "PF",
            "Papua New Guinea": "PG",
            "Philippines": "PH",
            "Pakistan": "PK",
            "Poland": "PL",
            "Saint Pierre and Miquelon": "PM",
            "Pitcairn": "PN",
            "Palestine": "PS",
            "Portugal": "PT",
            "Paraguay": "PY",
            "Qatar": "QA",
            "Reunion": "RE",
            "Romania": "RO",
            "Serbia": "RS",
            "Russian Federation": "RU",
            "Rwanda": "RW",
            "Saudi Arabia": "SA",
            "Solomon Islands": "SB",
            "Seychelles": "SC",
            "Sweden": "SE",
            "Singapore": "SG",
            "Saint Helena, Ascension and Tristan da Cunha": "SH",
            "Slovenia": "SI",
            "Svalbard and Jan Mayen": "SJ",
            "Slovakia": "SK",
            "Sierra Leone": "SL",
            "San Marino": "SM",
            "Senegal": "SN",
            "Somalia": "SO",
            "Suriname": "SR",
            "South Sudan": "SS",
            "Sao Tome and Principe": "ST",
            "El Salvador": "SV",
            "Sint Maarten (Dutch part)": "SX",
            "Eswatini": "SZ",
            "Turks and Caicos Islands": "TC",
            "Chad": "TD",
            "French Southern Territories": "TF",
            "Togo": "TG",
            "Thailand": "TH",
            "Tajikistan": "TJ",
            "Tokelau": "TK",
            "Timor-Leste": "TL",
            "Turkmenistan": "TM",
            "Tunisia": "TN",
            "Tonga": "TO",
            "Türkiye": "TR",
            "Trinidad and Tobago": "TT",
            "Tuvalu": "TV",
            "Taiwan": "TW",
            "Tanzania, United Republic of": "TZ",
            "Ukraine": "UA",
            "Uganda": "UG",
            "United States": "US",
            "Uruguay": "UY",
            "Uzbekistan": "UZ",
            "Holy See (Vatican City State)": "VA",
            "Saint Vincent and the Grenadines": "VC",
            "Venezuela, Bolivarian Republic of": "VE",
            "Virgin Islands, British": "VG",
            "Vietnam": "VN",
            "Vanuatu": "VU",
            "Wallis and Futuna": "WF",
            "Samoa": "WS",
            "Kosovo": "XK",
            "Yemen": "YE",
            "Mayotte": "YT",
            "South Africa": "ZA",
            "Zambia": "ZM",
            "Zimbabwe": "ZW",
        }
