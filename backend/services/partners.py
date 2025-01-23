import logging
import os
import hashlib
import json
from urllib.parse import unquote
from typing import Optional
from models.partner import Partner
from persistence.user_persistence import UserPersistence
from services.referral import ReferralService
from persistence.partners_persistence import PartnersPersistence
from persistence.sendgrid_persistence import SendgridPersistence
from persistence.plans_persistence import PlansPersistence
from persistence.referral_user import ReferralUserPersistence
from schemas.partners import PartnersResponse, PartnerUserData, PartnersObjectResponse
from services.sendgrid import SendgridHandler
from enums import SendgridTemplate
from types import SimpleNamespace

logger = logging.getLogger(__name__)


class PartnersService:

    def __init__(self, partners_persistence: PartnersPersistence, user_persistence: UserPersistence, send_grid_persistence: SendgridPersistence,
                 plans_persistence: PlansPersistence):
        self.partners_persistence = partners_persistence
        self.user_persistence = user_persistence
        self.send_grid_persistence = send_grid_persistence
        self.plans_persistence = plans_persistence


    def get_user_info(self, user_id=None, ff=None):
        if user_id is not None:
            subsciption = self.plans_persistence.get_current_plan(user_id)
            if (subsciption and subsciption.title):
                return subsciption.title


    def get_partners(self, is_master, search, start_date, end_date, page, rowsPerPage) -> PartnersObjectResponse:
        offset = page * rowsPerPage
        limit = rowsPerPage

        search_term = f"%{search}%" if search else None
        
        partners, total_count = self.partners_persistence.get_partners(
            is_master, search_term, start_date, end_date, offset, limit
        )

        result = [
            self.partner_mapped(partner, self.get_user_info(partner["user_id"]))
            for partner in partners
        ]
        return {"data": {"items": result, "totalCount": total_count}}
    
    
    def get_partner(self, email) -> PartnersObjectResponse:
        print("uiiui", "get_partner")
        partner = self.partners_persistence.get_partner_by_email(email)

        return {"data": partner.to_dict()}
        
    

    def get_partner_partners(self, email, start_date, end_date, page, rowsPerPage) -> PartnersObjectResponse:
        print("uiiui", "get_partner_partners")
        offset = page * rowsPerPage
        limit = rowsPerPage
        
        partner = self.partners_persistence.get_partner_by_email(email)
        partners, total_count = self.partners_persistence.get_partners_by_partner_id(
            partner.id, start_date, end_date, offset, limit)
        

        result = [
            self.partner_mapped(partner, self.get_user_info(partner["user_id"]))
            for partner in partners
        ]
        return {"data": {"items": result, "totalCount": total_count}}
    

    def partners_by_partner_id(self, id, search, start_date, end_date, page, rows_per_page) -> PartnersObjectResponse:
        print("uiiui", "partners_by_partners_id")

        search_term = f"%{search}%" if search else None

        partners, total_count = self.partners_persistence.get_partners_by_partner_id(id, start_date, end_date, page, rows_per_page, search_term)

        result = [
            self.partner_mapped(partner, self.get_user_info(partner["user_id"]))
            for partner in partners
        ]

        return {"data": {"items": result, "totalCount": total_count}}
    

    def delete_partner(self, id: int, message: str) -> PartnersObjectResponse:
        status = True

        partner = self.partners_persistence.get_partner_by_id(id)
        self.partners_persistence.terminate_partner(partner_id=id)
        template_id = self.send_grid_persistence.get_template_by_alias(
            SendgridTemplate.PARTNER_TERMINATE_TEMPLATE.value)
        
        try:
            self.send_message_in_email(partner.name, message, partner.email, template_id)
        except Exception as e:
            logger.debug('Error sending mail', e)
            status = False
        
        return {"message": "Error sending email message. Please try again." if not status else None}
    

    def send_message_in_email(self, full_name: str, message: str, email: str, template_id, commission=''):
        mail_object = SendgridHandler()
        mail_object.send_sign_up_mail(
            to_emails=email,
            template_id=template_id,
            template_placeholder={"full_name": full_name, "message": message, "email": email, "commission": commission},
        )
    

    def send_referral_in_email(self, full_name: str, email: str, commission: int):
        mail_object = SendgridHandler()
        template_id = self.send_grid_persistence.get_template_by_alias(
            SendgridTemplate.PARTNER_INVITE_TEMPLATE.value)
        md5_token_info = {
            'user_mail': email,
            'salt': os.getenv('SECRET_SALT')
        }
        json_string = json.dumps(md5_token_info, sort_keys=True)
        md5_hash = hashlib.md5(json_string.encode()).hexdigest()
        referral_token = f"{os.getenv('SITE_HOST_URL')}/signup?referral_token={md5_hash}&user_mail={email}"
        mail_object.send_sign_up_mail(
            to_emails=email,
            template_id=template_id,
            template_placeholder={"full_name": full_name, "link": referral_token, "email": email, "commission": commission},
        )
        return md5_hash
    

    async def create_partner(self, new_data: dict) -> PartnersObjectResponse:
        status = True
        token = None

        user_by_email = self.user_persistence.get_user_by_email(new_data.email)
        partner_by_email = self.partners_persistence.get_partner_by_email(new_data.email)

        if user_by_email or partner_by_email:
            return {"message": "User with this email already exists!"}
        
        try:
            token = self.send_referral_in_email(new_data.name, new_data.email, new_data.commission)
        except Exception as e:
            logger.debug('Error sending mail', e)
            status = False
        
        creating_data = {
            **new_data.dict(),
            "token": token,
            "master_id": new_data.master_id if new_data.master_id else None
        }

        created_data = self.partners_persistence.create_partner(creating_data)

        user = self.get_user_info(created_data.user_id, created_data)

        return {
            "message": "Error sending email message. Please try again." if not status else None, 
            "data": self.partner_mapped(created_data, user)
        }
    

    def setUser(self, email: str, user_id: int, status: str, join_date = None):        
        self.partners_persistence.update_partner_by_email(email=email, user_id=user_id, status=status, join_date=join_date)
        
    
    async def update_partner(self, partner_id: int, new_data: dict) -> PartnersObjectResponse:
        status = True
        new_data_dict = new_data.dict()
        updated_data, commission_changed = self.partners_persistence.update_partner(partner_id=partner_id, **new_data_dict)

        if commission_changed:
            template_id = self.send_grid_persistence.get_template_by_alias(
                SendgridTemplate.PARTNER_UPDATE_TEMPLATE.value
            )
            try:
                self.send_message_in_email(
                    updated_data.name, '', updated_data.email, template_id, updated_data.commission
                )
            except Exception as e:
                logger.debug('Error sending mail', e)
                status = False

        user = self.get_user_info(updated_data.user_id, updated_data)
        return {
            "message": "Error sending email message. Please try again." if not status else None, 
            "data": self.partner_mapped(updated_data, user)}


    async def update_opportunity_partner(self, partner_id: int, payload: dict):
        status = True
        
        if (payload.status):
            template_id = self.send_grid_persistence.get_template_by_alias(
            SendgridTemplate.PARTNER_ENABLE_TEMPLATE.value) 
        else:
            template_id = self.send_grid_persistence.get_template_by_alias(
            SendgridTemplate.PARTNER_DISABLE_TEMPLATE.value)

        
        update_data = {"is_active": payload.status}
        updated_data, commission_changed = self.partners_persistence.update_partner(partner_id=partner_id, **update_data)
        
        message = payload.message
        if not message:
            message = "the fact that the master partner decided so"
        
        try:
            self.send_message_in_email(updated_data.name, message, updated_data.email, template_id)
        except Exception as e:
            logger.debug('Error sending mail', e)
            status = False
    
        return {"message": "Error sending email message. Please try again." if not status else None}



    def partner_mapped(self, partner, subscription: str):
        if isinstance(partner, dict):
            partner = SimpleNamespace(**partner)

        return PartnersResponse(
            id=partner.id,
            partner_name=partner.name,
            company_name=partner.company_name,
            email=partner.email,
            is_master=partner.is_master,
            join_date=partner.join_date,
            commission=partner.commission,
            subscription=subscription,
            sources=partner.source,
            last_payment_date=partner.last_payment_date,
            reward_amount=partner.reward_amount,
            reward_status=partner.reward_status,
            reward_payout_date=partner.reward_payout_date,
            count=partner.count_accounts,
            status=partner.status.capitalize() if partner.is_active else 'Inactive',
            isActive=partner.is_active
        ).model_dump()
