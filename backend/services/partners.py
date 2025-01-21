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
from persistence.partners_invations_persistence import ParntersInvitationsPersistence
from persistence.sendgrid_persistence import SendgridPersistence
from persistence.plans_persistence import PlansPersistence
from schemas.partners import PartnersResponse, PartnerUserData, PartnersObjectResponse
from services.sendgrid import SendgridHandler
from enums import SendgridTemplate

logger = logging.getLogger(__name__)


class PartnersService:

    def __init__(self, partners_persistence: PartnersPersistence, accounts_persistence: ParntersInvitationsPersistence, user_persistence: UserPersistence, send_grid_persistence: SendgridPersistence,
                 plans_persistence: PlansPersistence):
        self.partners_persistence = partners_persistence
        self.accounts_persistence = accounts_persistence
        self.user_persistence = user_persistence
        self.send_grid_persistence = send_grid_persistence
        self.plans_persistence = plans_persistence


    def get_user_info(self, user_id=None, partner=None):
        user_data = {}
        user_data["subscription"] = "--"
        user_data["payment_date"] = None
        user_data["reward_amount"] = None
        user_data["reward_status"] = None
        user_data["reward_payout_date"] = None
        user_data["sources"] = "Direct"
        if partner.master_id is not None:
            master_partner = self.partners_persistence.get_asset_by_id(partner.master_id)
            if (master_partner and master_partner.company_name):
                user_data["sources"] = master_partner.company_name
        if user_id is not None:
            subsciption = self.plans_persistence.get_current_plan(user_id)
            if (subsciption and subsciption.title):
                user_data["subscription"] = subsciption.title
        return user_data


    def get_partners(self, isMaster, search, start_date, end_date, page, rowsPerPage) -> PartnersObjectResponse:
        offset = page * rowsPerPage
        limit = rowsPerPage

        search_term = f"%{search}%" if search else None
        
        partners, total_count = self.partners_persistence.get_partners(
            isMaster, search_term, start_date, end_date, offset, limit
        )

        result = [
            self.domain_mapped(partner, self.get_user_info(partner.user_id, partner))
            for partner in partners
        ]
        return {"status": True, "data": {"items": result, "totalCount": total_count}}
    
    
    def get_partner(self, email) -> PartnersObjectResponse:
        try:
            partner = self.partners_persistence.get_partner_by_email(email)
            
            user_id = partner.user_id
            user = self.get_user_info(user_id, partner)
            partnerData = self.domain_mapped(partner, user)

            return {"status": True, "data": partnerData}
        
        except Exception as e:
            logger.debug("Error getting partner data", e)
            return {"status": False, "error":{"code": 500, "message": f"Unexpected error during getting: {str(e)}"}}
    

    def get_partner_partners(self, email, start_date, end_date, page, rowsPerPage) -> PartnersObjectResponse:
        offset = page * rowsPerPage
        limit = rowsPerPage
        
        try:
            decoded_email = unquote(email)
            partner = self.partners_persistence.get_partner_by_email(decoded_email)
            partners = self.partners_persistence.get_partners_by_partners_id(partner.id, start_date, end_date, offset, limit)
            total_count = self.partners_persistence.get_total_count_by_id(partner.id, start_date, end_date)
            
            result = []
            for partner in partners:
                user_id = partner.user_id
                user = self.get_user_info(user_id, partner)
                count = self.accounts_persistence.get_total_count(partner.id)
                result.append(self.domain_mapped(partner, user, count))
        
        except Exception as e:
            logger.debug("Error getting partner data", e)
            return {"status": False, "error":{"code": 500, "message": f"Unexpected error during getting: {str(e)}"}}
        return {"status": True, "data": {"items": result, "totalCount": total_count}}
    

    def partners_by_partners_id(self, id: int) -> PartnersObjectResponse:
        if not id:
            return {"status": False, "error": {"code": 400, "message": "Invalid request with your partner data"}}
        
        try:
            partners = self.partners_persistence.get_partners_by_partners_id(id)

            result = []
            for partner in partners:
                user_id = partner.user_id
                user = self.get_user_info(user_id, partner)
                result.append(self.domain_mapped(partner, user))
        except Exception as e:
            logger.debug("Error getting partner data", e)
            return {"status": False, "error":{"code": 500, "message": f"Unexpected error during getting: {str(e)}"}}

        return {"status": True, "data": result}
    

    def delete_partner(self, id: int, message: str) -> PartnersObjectResponse:
        if not id:
            return {"status": False, "error": {"code": 400, "message": "Invalid request with your partner data"}}
        try:
            partner = self.partners_persistence.get_asset_by_id(id)
            self.partners_persistence.terminate_partner(partner_id=id)
            template_id = self.send_grid_persistence.get_template_by_alias(
                SendgridTemplate.PARTNER_TERMINATE_TEMPLATE.value)
            self.send_message_in_email(partner.name, message, partner.email, template_id)
            return {"status": True}
        except Exception as e:
            logger.debug('Error deleting partner', e)
            return {"status": False, "error":{"code": 500, "message": f"Unexpected error during deletion: {str(e)}"}}
    

    def send_message_in_email(self, full_name: str, message: str, email: str, template_id, commission=''):
        mail_object = SendgridHandler()
        mail_object.send_sign_up_mail(
            to_emails=email,
            template_id=template_id,
            template_placeholder={"full_name": full_name, "message": message, "email": email, "commission": commission},
        )
    

    def send_referral_in_email(self, full_name: str, email: str, commission: str):
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
    

    async def create_partner(self, full_name: str, email: str, company_name: str, commission: str, is_master: bool, masterId=None) -> PartnersObjectResponse:
        if not full_name or not email or not company_name or not commission:
            return {"status": False, "error": {"code": 400, "message": "Invalid request with your partner data"}}
        
        try:
            hash = self.send_referral_in_email(full_name, email, commission)
            creating_data = {
                "full_name": full_name,
                "email": email,
                "company_name": company_name,
                "commission": commission,
                "token": hash,
                "is_master": is_master
            }

            if masterId is not None:
                creating_data["masterId"] = masterId

            created_data = self.partners_persistence.create_partner(creating_data)

            if not created_data:
                logger.debug('Database error during creation', e)
                return {"status": False, "error": {"code": 500, "message": "Partner not created"}}

            user = self.get_user_info(created_data.user_id, created_data)
            return {"status": True, "data": self.domain_mapped(created_data, user)}
        
        except Exception as e:
            logger.debug('Error creating partner', e)
            return {"status": False, "error":{"code": 500, "message": f"Unexpected error during creation: {str(e)}"}}
    

    def setUser(self, email: str, user_id: int, status: str, join_date = None):        
        self.partners_persistence.update_partner_by_email(email=email, user_id=user_id, status=status, join_date=join_date)
        
    
    async def update_partner(
        self, 
        partner_id: int, 
        field: str, 
        value: str, 
        message: str, 
        partner_name: Optional[str] = None, 
        company_name: Optional[str] = None
    ) -> PartnersObjectResponse:
        if not partner_id or not field or not value:
            return {"status": False, "error": {"code": 400, "message": "Invalid request with your partner data"}}
            
        try:
            if field == 'status' and value == 'inactive':
                field = 'is_active'
                value = False
                
            if field == 'status' and value == 'active':
                field = 'is_active'
                value = True
                
            update_data = {field: value}

            if partner_name is not None:
                update_data["full_name"] = partner_name
            if company_name is not None:
                update_data["company_name"] = company_name

            updated_data = self.partners_persistence.update_partner(partner_id=partner_id, **update_data)

            if not updated_data:
                logger.debug("Database error during updation")
                return {"status": False, "error": {"code": 500, "message": "Partner not updated"}}
            

            if (field == "status"):
                if (value == "active"):
                    template_id = self.send_grid_persistence.get_template_by_alias(
                    SendgridTemplate.PARTNER_ENABLE_TEMPLATE.value)
                    self.send_message_in_email(updated_data.name, message, updated_data.email, template_id)
                else:
                    template_id = self.send_grid_persistence.get_template_by_alias(
                    SendgridTemplate.PARTNER_DISABLE_TEMPLATE.value)
                    self.send_message_in_email(updated_data.name, message, updated_data.email, template_id)
            else:
                template_id = self.send_grid_persistence.get_template_by_alias(
                    SendgridTemplate.PARTNER_UPDATE_TEMPLATE.value)
                self.send_message_in_email(updated_data.name, message, updated_data.email, template_id, value)

            user = self.get_user_info(updated_data.user_id, updated_data)
            return {"status": True, "data": self.domain_mapped(updated_data, user)}
        except Exception as e:
            logger.debug("Error updating partner data", exc_info=True)
            return {"status": False, "error": {"code": 500, "message": f"Unexpected error during updation: {str(e)}"}}

    async def update_opportunity_partner(
        self, 
        partner_id: int, 
        payload: dict, 
    ):
            
        try:
            if (payload.status):
                template_id = self.send_grid_persistence.get_template_by_alias(
                SendgridTemplate.PARTNER_ENABLE_TEMPLATE.value) 
            else:
                template_id = self.send_grid_persistence.get_template_by_alias(
                SendgridTemplate.PARTNER_DISABLE_TEMPLATE.value)
            
            update_data = {"is_active": payload.status}
            updated_data = self.partners_persistence.update_partner(partner_id=partner_id, **update_data) 
            
            message = payload.message
            if not message:
                message = "the fact that the master partner decided so"
            
            self.send_message_in_email(updated_data.name, message, updated_data.email, template_id)
        
            return {"status": True}
        except Exception as e:
            logger.debug("Error updating partner data", exc_info=True)
            return {"status": False, "error": {"code": 500, "message": f"Unexpected error during updation: {str(e)}"}}


    def domain_mapped(self, partner: Partner, user: PartnerUserData, count=0):
        return PartnersResponse(
            id=partner.id,
            partner_name=partner.name,
            email=partner.email,
            isMaster=partner.is_master,
            join_date=partner.join_date,
            commission=partner.commission,
            subscription=user["subscription"],
            sources=user["sources"],
            last_payment_date=user["payment_date"],
            reward_amount=user["reward_amount"],
            reward_status=user["reward_status"],
            reward_payout_date=user["reward_payout_date"],
            status=partner.status.capitalize() if partner.is_active else 'Inactive',
            count=count,
            isActive=partner.is_active
        ).model_dump()
