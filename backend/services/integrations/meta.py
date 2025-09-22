import hashlib
import json
import os
from datetime import datetime, timezone, timedelta
from typing import List, Tuple, Annotated
from uuid import UUID

import httpx
import logging
from facebook_business.adobjects.adaccount import AdAccount
from facebook_business.api import FacebookAdsApi
from facebook_business.exceptions import FacebookRequestError
from fastapi import HTTPException, Depends

from config.meta import MetaConfig
from enums import (
    IntegrationsStatus,
    SourcePlatformEnum,
    ProccessDataSyncResult,
    DataSyncType,
    IntegrationLimit,
)
from models import FiveXFiveUser, LeadUser
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
from schemas.integrations.integrations import (
    IntegrationCredentials,
    ListFromIntegration,
)
from schemas.integrations.meta import (
    AdAccountScheme,
    TosStatus,
    TosAccepted,
    AssignedUsersResult,
    AssignedUser,
    CanAcceptResult,
)
from services.integrations.commonIntegration import resolve_main_email_and_phone
from services.integrations.million_verifier import (
    MillionVerifierIntegrationsService,
)
from utils import (
    get_valid_email,
    format_phone_number,
    get_http_client,
    get_valid_email_without_million,
    get_valid_phone,
)

APP_SECRET = MetaConfig.app_secret
APP_ID = MetaConfig.app_piblic
API_VERSION = "v23.0"

logger = logging.getLogger(__name__)

SUBCODE_MESSAGES = {
    2446375: "Daily budget is too small. Increase the campaign daily budget.",
    1870090: "Custom Audience Terms not accepted. Ask admin to accept Terms for this account.",
}


class MetaError(Exception):
    def __init__(self, user_message: str | None):
        super().__init__(self, user_message)

        if user_message:
            self.user_message = user_message
        else:
            self.user_message = "Error while connecting to Meta"


@injectable
class MetaIntegrationsService:
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
        self.sync_persistence = sync_persistence
        self.million_verifier_integrations = million_verifier_integrations
        self.client = client

    def _ensure_act_prefix(slef, ad_account_id: str) -> str:
        ad_id = str(ad_account_id)
        if not ad_id.startswith("act_"):
            return f"act_{ad_id}"
        return ad_id

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
        return self.integrations_persisntece.get_credentials_for_service(
            domain_id=domain_id,
            user_id=user_id,
            service_name=SourcePlatformEnum.META.value,
        )

    def get_smart_credentials(self, user_id: int):
        credential = (
            self.integrations_persisntece.get_smart_credentials_for_service(
                user_id=user_id, service_name=SourcePlatformEnum.META.value
            )
        )
        return credential

    def get_info_by_access_token(self, access_token: str):
        url = f"https://graph.facebook.com/{API_VERSION}/me"
        params = {"access_token": access_token}
        response = self.__handle_request("GET", url=url, params=params)
        if response.status_code != 200:
            return
        return response.json()

    def add_integration(
        self, credentials: IntegrationCredentials, domain, user: dict
    ):
        domain_id = None if domain is None else domain.id
        credential = self.get_credentials(domain_id, user.get("id"))
        access_token = self.get_long_lived_token(credentials.meta.access_token)
        if not access_token:
            raise HTTPException(
                status_code=400,
                detail={"status": "Long-lived token unavailable"},
            )
        if credential:
            credential.is_failed = False
            credential.error_message = None
            self.integrations_persisntece.db.commit()
            return
        ad_account_info = self.get_info_by_access_token(
            access_token.get("access_token")
        )

        common_integration = os.getenv("COMMON_INTEGRATION") == "True"
        integration_data = {
            "ad_account_id": ad_account_info.get("id"),
            "access_token": access_token.get("access_token"),
            "meta_user_access_token": access_token.get("access_token"),
            "full_name": user.get("full_name"),
            "expire_access_token": access_token.get("expires_in"),
            "last_access_token_update": datetime.now(),
            "service_name": SourcePlatformEnum.META.value,
            "limit": IntegrationLimit.META.value,
        }

        if common_integration:
            integration_data["user_id"] = user.get("id")
        else:
            integration_data["domain_id"] = domain_id

        integartion = self.integrations_persisntece.create_integration(
            integration_data
        )

        integrations = (
            self.integrations_persisntece.get_all_integrations_filter_by(
                ad_account_id=ad_account_info.get("id"), domain_id=domain_id
            )
        )
        for integration in integrations:
            integration.access_token == access_token.get("access_token")
            integration.expire_access_token = access_token.get("expires_in")
            integration.last_access_token_update = datetime.now()
            self.integrations_persisntece.db.commit()
        if not integartion:
            raise HTTPException(
                status_code=400,
                detail={"status": IntegrationsStatus.CREATE_IS_FAILED.value},
            )

        return integartion

    def check_custom_audience_terms(self, ad_account_id, access_token):
        acct = ad_account_id
        if acct.startswith("act_"):
            acct_no_prefix = acct.replace("act_", "")
        else:
            acct_no_prefix = acct

        url = f"https://graph.facebook.com/{API_VERSION}/act_{acct_no_prefix}/customaudiences"

        params = {
            "access_token": access_token,
            "name": "Custom Audience test",
            "subtype": "CUSTOM",
            "customer_file_source": "USER_PROVIDED_ONLY",
        }

        response = self.__handle_request("POST", url=url, params=params)

        if response.status_code == 200:
            return {"terms_accepted": True}

        error_data = response.json()
        if error_data.get("error", {}).get("error_subcode") == 1870090:
            terms_link = f"https://business.facebook.com/ads/manage/customaudiences/tos/?act={acct_no_prefix}"
            return {"terms_accepted": False, "terms_link": terms_link}

        return {"terms_accepted": False, "error": error_data}

    def get_long_lived_token(self, fb_exchange_token):
        url = f"https://graph.facebook.com/{API_VERSION}/oauth/access_token"
        params = {
            "client_id": APP_ID,
            "client_secret": APP_SECRET,
            "code": fb_exchange_token,
        }
        response = self.__handle_request("GET", url=url, params=params)
        if response.status_code != 200:
            return
        data = response.json()
        return {
            "access_token": data.get("access_token"),
            "token_type": data.get("token_type"),
            "expires_in": data.get("expires_in"),
        }

    def __get_ad_accounts(self, access_token: str):
        url = f"https://graph.facebook.com/{API_VERSION}/me/adaccounts"
        params = {"fields": "name", "access_token": access_token}
        response = self.__handle_request(url=url, params=params, method="GET")
        return response

    def get_ad_accounts(self, domain_id: int, user_id: int):
        credentials = self.get_credentials(domain_id, user_id)
        if not credentials:
            return
        response = self.__get_ad_accounts(credentials.access_token)
        if not response:
            credentials.is_failed = True
            credentials.error_message = "Connection Error"
            self.integrations_persisntece.db.commit()
            return
        return [
            self.__mapped_ad_account(ad_account)
            for ad_account in response.json().get("data", [])
        ]

    def __get_audience_list(self, ad_account_id, access_token: str):
        ad_account_id = self._ensure_act_prefix(ad_account_id)
        url = f"https://graph.facebook.com/{API_VERSION}/{ad_account_id}/customaudiences"
        params = {"fields": "name", "access_token": access_token}
        response = self.__handle_request(url=url, params=params, method="GET")
        return response

    def __get_campaigns_list(self, ad_account_id, access_token: str):
        ad_account_id = self._ensure_act_prefix(ad_account_id)
        url = f"https://graph.facebook.com/{API_VERSION}/{ad_account_id}/campaigns"
        params = {"fields": "name", "access_token": access_token}
        response = self.__handle_request(url=url, params=params, method="GET")
        return response

    def get_tos_status(
        self, ad_account_id: str, access_token: str
    ) -> TosStatus:
        acct = self._ensure_act_prefix(ad_account_id).replace("act_", "")
        url = f"https://graph.facebook.com/{API_VERSION}/act_{acct}"
        params = {"fields": "tos_accepted", "access_token": access_token}
        resp = self.__handle_request(method="GET", url=url, params=params)

        if not resp or resp.status_code != 200:
            return TosStatus(
                ok=False,
                error="no_response",
                status_code=getattr(resp, "status_code", None),
            )

        try:
            data = resp.json()
        except Exception:
            return TosStatus(ok=False, error="bad_json")

        tos_obj = data.get("tos_accepted")
        tos_accepted = (
            TosAccepted(**tos_obj) if isinstance(tos_obj, dict) else None
        )
        return TosStatus(ok=True, tos_accepted=tos_accepted, raw=data)

    def get_assigned_users(
        self, ad_account_id: str, access_token: str
    ) -> AssignedUsersResult:
        acct = self._ensure_act_prefix(ad_account_id).replace("act_", "")
        status_code = None
        raw = None
        business_id = None

        try:
            info_url = f"https://graph.facebook.com/{API_VERSION}/act_{acct}"
            info_resp = self.__handle_request(
                method="GET",
                url=info_url,
                params={"fields": "business", "access_token": access_token},
            )
            if info_resp and getattr(info_resp, "status_code", None) == 200:
                info_body = info_resp.json()
                biz = info_body.get("business")
                if isinstance(biz, dict):
                    business_id = biz.get("id")
                elif isinstance(biz, str):
                    business_id = biz
        except Exception:
            business_id = None

        if not business_id:
            try:
                app_token = f"{APP_ID}|{APP_SECRET}"
                info_resp = self.__handle_request(
                    method="GET",
                    url=f"https://graph.facebook.com/{API_VERSION}/act_{acct}",
                    params={"fields": "business", "access_token": app_token},
                )
                if info_resp and getattr(info_resp, "status_code", None) == 200:
                    info_body = info_resp.json()
                    biz = info_body.get("business")
                    if isinstance(biz, dict):
                        business_id = biz.get("id")
                    elif isinstance(biz, str):
                        business_id = biz
            except Exception:
                business_id = None

        try:
            assigned_url = f"https://graph.facebook.com/{API_VERSION}/act_{acct}/assigned_users"
            params = {"fields": "id,name,tasks", "access_token": access_token}
            if business_id:
                params["business"] = business_id

            resp = self.__handle_request(
                method="GET", url=assigned_url, params=params
            )
            status_code = getattr(resp, "status_code", None) if resp else None
            if not resp:
                return AssignedUsersResult(
                    ok=False,
                    error="no_response",
                    assigned_users=[],
                    raw=None,
                    status_code=None,
                )

            raw = resp.json()
            if raw.get("error"):
                return AssignedUsersResult(
                    ok=False,
                    error="api_error",
                    assigned_users=[],
                    raw=raw,
                    status_code=status_code,
                )

            users = self._parse_assigned_users_raw(raw)
            return AssignedUsersResult(
                ok=True, assigned_users=users, raw=raw, status_code=status_code
            )
        except Exception as exc:
            logger.exception("get_assigned_users failed: %s", exc)
            return AssignedUsersResult(
                ok=False,
                error="exception",
                assigned_users=[],
                raw=str(exc),
                status_code=status_code,
            )

    def _parse_assigned_users_raw(
        self, raw_response: dict
    ) -> list[AssignedUser]:
        out = []
        data = raw_response.get("data", []) or []

        for item in data:
            if isinstance(item, dict) and item.get("user"):
                user_obj = item.get("user", {})
                uid = user_obj.get("id") or item.get("id")
                name = user_obj.get("name") or item.get("name")
                tasks = item.get("tasks") or user_obj.get("tasks") or []
                role = item.get("role") or user_obj.get("role")
                out.append(
                    AssignedUser(id=uid, name=name, role=role, tasks=tasks)
                )

            elif isinstance(item, dict) and ("id" in item or "name" in item):
                uid = item.get("id")
                name = item.get("name")
                tasks = item.get("tasks") or []
                role = item.get("role") or None
                out.append(
                    AssignedUser(id=uid, name=name, role=role, tasks=tasks)
                )

            else:
                uid = None
                name = None
                role = None
                tasks = []
                for k, v in item.items() if isinstance(item, dict) else []:
                    if isinstance(v, dict):
                        if v.get("id") and not uid:
                            uid = v.get("id")
                        if v.get("name") and not name:
                            name = v.get("name")
                        if v.get("tasks") and not tasks:
                            tasks = v.get("tasks")
                if uid or name:
                    out.append(
                        AssignedUser(
                            id=uid or name, name=name, role=role, tasks=tasks
                        )
                    )

        return out

    def can_current_user_accept_tos(
        self,
        ad_account_id: str,
        access_token: str,
    ) -> CanAcceptResult:
        token_owner_id = None
        token_owner_name = None
        try:
            me_resp = self.__handle_request(
                method="GET",
                url=f"https://graph.facebook.com/{API_VERSION}/me",
                params={"fields": "id,name", "access_token": access_token},
            )
            if me_resp and getattr(me_resp, "status_code", None) == 200:
                me_json = me_resp.json()
                token_owner_id = (
                    str(me_json.get("id")) if me_json.get("id") else None
                )
                token_owner_name = me_json.get("name")
        except Exception:
            return CanAcceptResult(
                can_accept=False, reason="no_user_in_token", tos_accepted=False
            )

        if not token_owner_id:
            return CanAcceptResult(
                can_accept=False, reason="no_user_in_token", tos_accepted=False
            )

        tos_status = self.get_tos_status(ad_account_id, access_token)
        if not tos_status.ok:
            return CanAcceptResult(
                can_accept=False,
                reason="cannot_check_tos",
                tos_accepted=False,
                debug={"tos_raw": tos_status.raw},
            )

        if (tos_status.tos_accepted or TosAccepted()).custom_audience_tos in (
            1,
            True,
        ):
            return CanAcceptResult(
                can_accept=False, reason="already_accepted", tos_accepted=True
            )

        au = self.get_assigned_users(ad_account_id, access_token)
        if not au.ok:
            return CanAcceptResult(
                can_accept=False,
                reason="no_assigned_users_access",
                tos_accepted=False,
                debug={"assigned_raw": au.raw},
            )

        assigned = au.assigned_users or []
        if not assigned:
            return CanAcceptResult(
                can_accept=False,
                reason="empty_assigned_users",
                tos_accepted=False,
                debug={"assigned_raw": au.raw},
            )

        non_system_users = [
            u
            for u in assigned
            if (getattr(u, "name", "") or "").strip().lower()
            != "allsource system user"
        ]
        if not non_system_users:
            return CanAcceptResult(
                can_accept=False,
                reason="only_system_user_present",
                tos_accepted=False,
                assigned_users=assigned,
                debug={"assigned_raw": au.raw},
            )

        matched_user = None
        for u in assigned:
            uid = str(u.id) if getattr(u, "id", None) is not None else None
            if uid and uid == token_owner_id:
                matched_user = u
                break

        if not matched_user and token_owner_name:
            for u in assigned:
                uname = (
                    (u.name or "").strip() if getattr(u, "name", None) else None
                )
                if (
                    uname
                    and uname.strip().lower()
                    == token_owner_name.strip().lower()
                ):
                    matched_user = u
                    break

        if not matched_user:
            return CanAcceptResult(
                can_accept=False,
                reason="user_not_in_assigned_users",
                tos_accepted=False,
                assigned_users=assigned,
                debug={"assigned_raw": au.raw},
            )

        tasks_set = set(getattr(matched_user, "tasks", []) or [])
        role = getattr(matched_user, "role", None)
        if role == "ADMIN" or bool(tasks_set & {"MANAGE", "ADVERTISE"}):
            terms_link = f"https://business.facebook.com/ads/manage/customaudiences/tos/?act={self._ensure_act_prefix(ad_account_id).replace('act_', '')}"
            return CanAcceptResult(
                can_accept=True,
                reason="has_tasks",
                tos_accepted=False,
                terms_link=terms_link,
                debug={"matched_user": matched_user},
            )

        return CanAcceptResult(
            can_accept=False,
            reason="insufficient_tasks",
            tos_accepted=False,
            assigned_tasks=list(tasks_set),
            assigned_users=assigned,
            debug={"matched_user": matched_user, "assigned_raw": au.raw},
        )

    def get_list(self, ad_account_id: str, domain_id: int, user_id: int):
        credentials = self.get_credentials(domain_id, user_id)
        if not credentials:
            return None

        can_manage = self.can_current_user_accept_tos(
            ad_account_id=ad_account_id,
            access_token=credentials.access_token,
        )
        if not can_manage.tos_accepted and not can_manage.can_accept:
            raise HTTPException(
                status_code=403,
                detail={
                    "message": "You don’t have the required permissions to create a list. Please add your account here:",
                    "link": f"https://business.facebook.com/settings/ad-accounts",
                    "link_text": "Ad Account Settings",
                },
            )

        response_audience = self.__get_audience_list(
            ad_account_id, credentials.access_token
        )
        response_campaign = self.__get_campaigns_list(
            ad_account_id, credentials.access_token
        )
        audience_lists = (
            [
                self.__mapped_meta_list(audience)
                for audience in response_audience.json().get("data")
            ]
            if response_audience
            else []
        )
        campaign_lists = (
            [
                self.__mapped_meta_list(campaign)
                for campaign in response_campaign.json().get("data")
            ]
            if response_campaign
            else []
        )
        return {
            "audience_lists": audience_lists,
            "campaign_lists": campaign_lists,
        }

    def create_list(
        self, list_obj, domain_id: int, user_id: int, description: str = None
    ):
        credential = self.get_credentials(domain_id, user_id)
        if not credential:
            raise HTTPException(
                status_code=403,
                detail={
                    "status": IntegrationsStatus.CREDENTIALS_NOT_FOUND.value
                },
            )
        FacebookAdsApi.init(
            access_token=credential.access_token, api_version=API_VERSION
        )
        params = {
            "name": list_obj.name,
            "subtype": "CUSTOM",
            "description": description or "",
            "customer_file_source": "USER_PROVIDED_ONLY",
        }

        ad_account_id = self._ensure_act_prefix(list_obj.ad_account_id)

        try:
            ad_account = AdAccount(ad_account_id)
            resp = ad_account.create_custom_audience(fields=[], params=params)
            audience_id = resp.get("id")
        except FacebookRequestError as e:
            return self.check_custom_audience_terms(
                ad_account_id, credential.access_token
            )
        return {"id": audience_id, "list_name": list_obj.name}

    def edit_sync(
        self,
        leads_type: str,
        integrations_users_sync_id: int,
        domain_id: int,
        created_by: str,
        user_id: int,
    ):
        credentials = self.get_credentials(domain_id, user_id)
        sync = self.sync_persistence.edit_sync(
            {
                "integration_id": credentials.id,
                "leads_type": leads_type,
                "created_by": created_by,
            },
            integrations_users_sync_id,
        )
        return sync

    def create_adset(
        self,
        ad_account_id,
        campaign_id,
        access_token,
        list_id,
        campaign_name,
        bid_amount: str | None = None,
        campaign_objective: str | None = None,
    ):
        ad_account_id = self._ensure_act_prefix(ad_account_id)
        url = f"https://graph.facebook.com/{API_VERSION}/{ad_account_id}/adsets"
        ad_set_data = {
            "name": f"{campaign_name}_ad",
            "billing_event": "IMPRESSIONS",
            "targeting": {
                "custom_audiences": [{"id": list_id}],
                "geo_locations": {"countries": ["US"]},
                "targeting_automation": {"advantage_audience": 0},
            },
            "campaign_id": campaign_id,
            "access_token": access_token,
            "status": "PAUSED",
        }

        # ad_set_data["optimization_goal"] = "LINK_CLICKS"

        if campaign_objective:
            ad_set_data["optimization_goal"] = campaign_objective
        else:
            ad_set_data["optimization_goal"] = "LANDING_PAGE_VIEWS"

        if bid_amount is not None:
            ad_set_data["bid_amount"] = int(bid_amount)

        resp = self.__handle_request(
            method="POST",
            url=url,
            json=ad_set_data,
        )

        try:
            body = resp.json()
        except Exception:
            logger.exception("create_adset: can't parse response")
            raise MetaError("Failed to parse Meta API response")

        if body.get("error"):
            logger.error("create_adset error: %s", body["error"])
            message: str | None = body.get("error", {}).get("error_user_msg")
            raise MetaError(message)

    def create_campaign(
        self, campaign_name: str, daily_budget: str, ad_account_id, user_id: int
    ):
        credentials = self.get_smart_credentials(user_id=user_id)
        ad_account_id = self._ensure_act_prefix(ad_account_id)
        url = f"https://graph.facebook.com/{API_VERSION}/{ad_account_id}/campaigns"

        try:
            daily_budget_int = int(daily_budget)
        except Exception:
            logger.warning(
                "daily_budget not integer, trying to cast from string"
            )
            try:
                daily_budget_int = int(float(daily_budget))
            except Exception:
                logger.exception("Invalid daily_budget format")
                raise

        start_time = datetime.now(timezone.utc).isoformat()
        end_time = (
            datetime.now(timezone.utc) + timedelta(days=365)
        ).isoformat()
        campaign_data = {
            "name": campaign_name,
            "objective": "OUTCOME_TRAFFIC",
            "status": "ACTIVE",
            "buying_type": "AUCTION",
            "daily_budget": daily_budget_int,
            "start_time": start_time,
            "end_time": end_time,
            "access_token": credentials.access_token,
            "special_ad_categories": [],
        }
        try:
            response = self.__handle_request(
                method="POST", url=url, json=campaign_data
            )

            if response is None:
                logger.error("create_campaign: empty response from Meta API")
                raise HTTPException(
                    status_code=502,
                    detail={"message": "Empty response from Meta API"},
                )

            try:
                body = response.json()
            except Exception:
                logger.exception("create_campaign: can't parse response JSON")
                raise HTTPException(
                    status_code=502,
                    detail={"message": "Invalid response from Meta API"},
                )

            if body.get("error"):
                err = body["error"]
                subcode = err.get("error_subcode")
                fbtrace = err.get("fbtrace_id")
                logger.error(
                    "create_campaign error from Meta: subcode=%s fbtrace=%s err=%s",
                    subcode,
                    fbtrace,
                    err,
                )

                user_msg = (
                    SUBCODE_MESSAGES.get(subcode)
                    or err.get("error_user_msg")
                    or err.get("message")
                    or "Meta API error"
                )
                detail = {
                    "message": user_msg,
                    "meta": {
                        "type": err.get("type"),
                        "code": err.get("code"),
                        "error_subcode": subcode,
                        "fbtrace_id": fbtrace,
                    },
                }

                raise HTTPException(status_code=400, detail=detail)

            campaign_id = body.get("id")
            if not campaign_id:
                logger.error("create_campaign: no id returned %s", body)
                raise HTTPException(
                    status_code=502,
                    detail={"message": "No campaign id returned"},
                )

            return {"id": campaign_id, "list_name": campaign_name}

        except FacebookRequestError as fb_err:
            info = self.parse_facebook_exception(fb_err)
            logger.error(
                "FacebookRequestError create_campaign: %s", info.get("raw")
            )

            sub = info.get("error_subcode")
            msg = (
                SUBCODE_MESSAGES.get(sub)
                or info.get("error_user_msg")
                or info.get("message")
                or "Meta API error"
            )

            raise HTTPException(
                status_code=400, detail={"message": msg, "meta": info}
            )

        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("Unexpected error in create_campaign")
            raise HTTPException(
                status_code=500, detail={"message": "Internal server error"}
            )

    async def create_sync(
        self,
        domain_id: int,
        customer_id: int,
        created_by: str,
        user: dict,
        leads_type: str,
        list_id: str,
        list_name: str,
        campaign=None,
    ):
        if campaign is None:
            campaign = {}
        credentials = self.get_credentials(
            user_id=user.get("id"), domain_id=domain_id
        )
        if campaign.get("campaign_id"):
            self.create_adset(
                ad_account_id=customer_id,
                campaign_id=campaign["campaign_id"],
                access_token=credentials.access_token,
                list_id=list_id,
                campaign_objective=campaign["campaign_objective"],
                campaign_name=campaign["campaign_name"],
                bid_amount=campaign["bid_amount"],
            )
        sync = self.sync_persistence.create_sync(
            {
                "integration_id": credentials.id,
                "list_id": list_id,
                "list_name": list_name,
                "leads_type": leads_type,
                "sent_contacts": -1,
                "sync_type": DataSyncType.CONTACT.value,
                "customer_id": customer_id,
                "domain_id": domain_id,
                "campaign_id": campaign.get("campaign_id"),
                "campaign_name": campaign.get("campaign_name"),
                "created_by": created_by,
            }
        )
        return sync

    def create_smart_audience_sync(
        self,
        customer_id: int,
        created_by: str,
        user: dict,
        smart_audience_id: UUID,
        sent_contacts: int,
        list_id: str,
        list_name: str,
        campaign=None,
    ):
        if campaign is None:
            campaign = {}
        credentials = self.get_smart_credentials(user_id=user.get("id"))
        if campaign.get("campaign_id"):
            self.create_adset(
                ad_account_id=customer_id,
                campaign_id=campaign["campaign_id"],
                access_token=credentials.access_token,
                list_id=list_id,
                campaign_objective=campaign["campaign_objective"],
                campaign_name=campaign["campaign_name"],
                bid_amount=campaign["bid_amount"],
            )
        sync = self.sync_persistence.create_sync(
            {
                "integration_id": credentials.id,
                "list_id": list_id,
                "list_name": list_name,
                "customer_id": customer_id,
                "sent_contacts": sent_contacts,
                "campaign_id": campaign.get("campaign_id"),
                "campaign_name": campaign.get("campaign_name"),
                "sync_type": DataSyncType.AUDIENCE.value,
                "smart_audience_id": smart_audience_id,
                "created_by": created_by,
            }
        )
        return sync

    async def process_data_sync(
        self,
        user_integration: UserIntegration,
        integration_data_sync: IntegrationUserSync,
        enrichment_users: List[EnrichmentUser],
        target_schema: str,
        validations: dict = {},
    ):
        profiles: list[list[str]] = []
        results = []
        for enrichment_user in enrichment_users:
            profile = self.__hash_mapped_meta_user(
                enrichment_user, target_schema, validations
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

            if profile:
                profiles.append(profile)

        if not profiles:
            return results

        bulk_result = self.__create_user(
            custom_audience_id=integration_data_sync.list_id,
            access_token=user_integration.access_token,
            profiles=profiles,
        )

        if bulk_result != ProccessDataSyncResult.SUCCESS.value:
            for result in results:
                if result["status"] == ProccessDataSyncResult.SUCCESS.value:
                    result["status"] = bulk_result

        return results

    async def add_hashed_emails_to_list(
        self, access_token: str, list_id: str, hashed_emails: list[str]
    ):
        profiles = [[hashed_email] for hashed_email in hashed_emails]
        bulk_result = self.__create_user(
            custom_audience_id=list_id,
            access_token=access_token,
            profiles=profiles,
        )

        return bulk_result

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
            profile = await self.__hash_mapped_meta_user_lead(
                five_x_five_user, is_email_validation_enabled
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

        bulk_result = self.__create_user(
            custom_audience_id=integration_data_sync.list_id,
            access_token=user_integration.access_token,
            profiles=profiles,
        )
        if bulk_result != ProccessDataSyncResult.SUCCESS.value:
            for result in results:
                if result["status"] == ProccessDataSyncResult.SUCCESS.value:
                    result["status"] = bulk_result

        return results

    def __create_user(
        self, custom_audience_id: str, access_token: str, profiles: List[dict]
    ):
        payload = {
            "schema": [
                "EMAIL",
                "PHONE",
                "GEN",
                "DOBY",
                "DOBM",
                "DOBD",
                "FN",
                "LN",
                "FI",
                "ST",
                "CT",
                "ZIP",
                "COUNTRY",
            ],
            "data": profiles,
        }
        session = {
            "session_id": 1,
            "batch_seq": 1,
            "last_batch_flag": True,
            "estimated_num_total": len(profiles),
        }
        url = f"https://graph.facebook.com/{API_VERSION}/{custom_audience_id}/users"
        response = self.__handle_request(
            method="POST",
            url=url,
            params={"access_token": access_token},
            data={
                "session": json.dumps(session),
                "payload": json.dumps(payload),
                "app_id": APP_ID,
            },
        )

        result = response.json()

        logger.info(
            f"Meta API response for list {custom_audience_id}: "
            f"sent {len(profiles)} contacts, result={result}"
        )

        if result.get("error", {}).get("type") == "OAuthException":
            return ProccessDataSyncResult.AUTHENTICATION_FAILED.value

        if result.get("error"):
            logger.error(result["error"])
            return ProccessDataSyncResult.PLATFORM_VALIDATION_FAILED.value

        return ProccessDataSyncResult.SUCCESS.value

    async def __hash_mapped_meta_user_lead(
        self, five_x_five_user: FiveXFiveUser, is_email_validation_enabled: bool
    ):
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

        def hash_value(value):
            return (
                hashlib.sha256(value.encode("utf-8")).hexdigest()
                if value
                else ""
            )

        first_phone = get_valid_phone(five_x_five_user)
        first_phone = format_phone_number(first_phone)

        return [
            hash_value(first_email),  # EMAIL
            hash_value(first_phone),  # PHONE
            hash_value(five_x_five_user.gender),  # GEN
            hash_value(""),  # DOBY
            hash_value(""),  # DOBM
            hash_value(""),  # DOBD
            hash_value(five_x_five_user.first_name),  # FN
            hash_value(five_x_five_user.last_name),  # LN
            hash_value(five_x_five_user.first_name[0].lower()),  # FI
            hash_value(five_x_five_user.personal_state),  # ST
            hash_value(five_x_five_user.personal_city),  # CT
            hash_value(five_x_five_user.personal_zip),  # ZIP
            hash_value("USA"),  # COUNTRY
        ]

    def __hash_mapped_meta_user(
        self,
        enrichment_user: EnrichmentUser,
        target_schema: str,
        validations: dict,
    ):
        enrichment_contacts = enrichment_user.contacts
        if not enrichment_contacts:
            return ProccessDataSyncResult.INCORRECT_FORMAT.value

        business_email, personal_email, phone = (
            self.sync_persistence.get_verified_email_and_phone(
                enrichment_user.asid
            )
        )
        main_email, main_phone = resolve_main_email_and_phone(
            enrichment_contacts,
            validations,
            target_schema,
            business_email,
            personal_email,
            phone,
        )
        first_name = enrichment_contacts.first_name
        last_name = enrichment_contacts.last_name

        if not main_email or not first_name or not last_name:
            return ProccessDataSyncResult.INCORRECT_FORMAT.value

        enrichment_personal_profiles = enrichment_user.personal_profiles
        enrichment_user_postal = enrichment_user.postal
        city = None
        state = None
        zip_code = None
        gender = None
        birth_day = None
        birth_month = None
        birth_year = None
        country = None

        if enrichment_user_postal:
            city = enrichment_user_postal.home_city
            if not city:
                city = enrichment_user_postal.business_city
            state = enrichment_user_postal.home_state
            if not state:
                state = enrichment_user_postal.business_state
            country = enrichment_user_postal.home_country
            if not country:
                country = enrichment_user_postal.business_country

        if enrichment_personal_profiles:
            zip_code = str(enrichment_personal_profiles.zip_code5)

            if enrichment_personal_profiles.gender == 1:
                gender = "m"
            elif enrichment_personal_profiles.gender == 2:
                gender = "f"
            birth_day = str(enrichment_personal_profiles.birth_day)
            birth_month = str(enrichment_personal_profiles.birth_month)
            birth_year = str(enrichment_personal_profiles.birth_year)

        def hash_value(value):
            return (
                hashlib.sha256(value.encode("utf-8")).hexdigest()
                if value
                else ""
            )

        return [
            hash_value(main_email),  # EMAIL
            hash_value(main_phone),  # PHONE
            hash_value(gender),  # GEN
            hash_value(birth_year),  # DOBY
            hash_value(birth_month),  # DOBM
            hash_value(birth_day),  # DOBD
            hash_value(first_name),  # FN
            hash_value(last_name),  # LN
            hash_value(first_name[0].lower()),  # FI
            hash_value(state),  # ST
            hash_value(city),  # CT
            hash_value(zip_code),  # ZIP
            hash_value(country),  # COUNTRY
        ]

    def __mapped_meta_list(self, list):
        return ListFromIntegration(
            id=list.get("id"), list_name=list.get("name")
        )

    def __mapped_ad_account(self, ad_account):
        return AdAccountScheme(
            id=ad_account.get("id"), name=ad_account.get("name")
        )

    def parse_facebook_exception(self, exc) -> dict:
        info = {
            "message": None,
            "error_user_msg": None,
            "error_user_title": None,
            "code": None,
            "error_subcode": None,
            "fbtrace_id": None,
            "raw": None,
        }
        try:
            if hasattr(exc, "api_error_message"):
                info["message"] = exc.api_error_message()
            if hasattr(exc, "api_error_code"):
                info["code"] = exc.api_error_code()
            if hasattr(exc, "api_error_subcode"):
                info["error_subcode"] = exc.api_error_subcode()

            body = (
                getattr(exc, "body", None)
                or getattr(exc, "message", None)
                or str(exc)
            )
            info["raw"] = body

            if isinstance(body, (dict,)):
                err = body.get("error") if isinstance(body, dict) else None
            else:
                try:
                    parsed = json.loads(body)
                    err = (
                        parsed.get("error")
                        if isinstance(parsed, dict)
                        else None
                    )
                except Exception:
                    err = None

            if isinstance(err, dict):
                info["message"] = info["message"] or err.get("message")
                info["error_user_msg"] = err.get("error_user_msg")
                info["error_user_title"] = err.get("error_user_title")
                info["code"] = info["code"] or err.get("code")
                info["error_subcode"] = info["error_subcode"] or err.get(
                    "error_subcode"
                )
                info["fbtrace_id"] = err.get("fbtrace_id")
        except Exception:
            logger.exception("Failed to parse FacebookRequestError")

        if not info["message"]:
            info["message"] = str(exc)
        return info
