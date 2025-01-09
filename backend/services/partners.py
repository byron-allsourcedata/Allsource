import logging
import os
import hashlib
import json
from models.partners import Partners
from persistence.user_persistence import UserPersistence
from persistence.partners_persistence import PartnersPersistence
from persistence.sendgrid_persistence import SendgridPersistence
from persistence.plans_persistence import PlansPersistence
from schemas.partners import PartnersResponse, PartnerUserData, PartnersObjectResponse
from services.sendgrid import SendgridHandler
from enums import SendgridTemplate

logger = logging.getLogger(__name__)


class PartnersService:

    def __init__(self,
        partners_persistence: PartnersPersistence,
        user_persistence: UserPersistence,
        send_grid_persistence: SendgridPersistence,
        plans_persistence: PlansPersistence):
        self.partners_persistence = partners_persistence
        self.user_persistence = user_persistence
        self.send_grid_persistence = send_grid_persistence
        self.plans_persistence = plans_persistence


    def get_user_info(self, user_id: int):
        user_data = {}
        user_data["subscription"] = "--"
        user_data["payment_date"] = None
        if user_id is not None:
            # self.user_persistence.get_user_by_id(user_id)
            # user_data["payment_date"] = datetime.strptime("1880-12-19 12:54:55", "%Y-%m-%d %H:%M:%S")
            subsciption = self.plans_persistence.get_current_plan(user_id)
            if (subsciption and subsciption.title):
                user_data["subscription"] = subsciption.title
        return user_data


    def get_partners(self, isMaster, search, start_date, end_date, page, rowsPerPage) -> PartnersObjectResponse:
        offset = page * rowsPerPage
        limit = rowsPerPage
        
        try:
            if search is None:
                partners = self.partners_persistence.get_partners(isMaster, start_date, end_date, offset, limit)
                total_count = self.partners_persistence.get_total_count(isMaster)
            else:
                search_term = f"%{search}%"
                partners = self.partners_persistence.get_partners_search(isMaster, search_term, start_date, end_date, offset, limit)
                total_count = self.partners_persistence.get_total_count_search(isMaster, search_term)
            
            result = []
            for partner in partners:
                user_id = partner.user_id
                user = self.get_user_info(user_id)
                result.append(self.domain_mapped(partner, user))
        
        except Exception as e:
            logger.debug("Error getting partner data", e)
            return {"status": False, "error":{"code": 500, "message": f"Unexpected error during getting: {str(e)}"}}
        return {"status": True, "data": {"items": result, "totalCount": total_count}}
    

    def partners_by_partners_id(self, id: int) -> PartnersObjectResponse:
        if not id:
            return {"status": False, "error": {"code": 404, "message": "Partner data not found"}}
        
        try:
            partners = self.partners_persistence.get_partners_by_partners_id(id)

            result = []
            for partner in partners:
                user_id = partner.user_id
                user = self.get_user_info(user_id)
                result.append(self.domain_mapped(partner, user))
        except Exception as e:
            logger.debug("Error getting partner data", e)
            return {"status": False, "error":{"code": 500, "message": f"Unexpected error during getting: {str(e)}"}}

        return {"status": True, "data": result}
    

    def delete_partner(self, id: int, message: str) -> PartnersObjectResponse:
        if not id:
            return {"status": False, "error": {"code": 404, "message": "Partner data not found"}}
        try:
            partner = self.partners_persistence.get_asset_by_id(id)
            self.partners_persistence.terminate_partner(partner_id=id)
            self.send_message_in_email(message, partner.email)
            return {"status": True}
        except Exception as e:
            logger.debug('Error deleting partner', e)
            return {"status": False, "error":{"code": 500, "message": f"Unexpected error during deletion: {str(e)}"}}
    

    def send_message_in_email(self, message: str, email: str):
        mail_object = SendgridHandler()
        template_id = self.send_grid_persistence.get_template_by_alias(
            SendgridTemplate.PARTNER_TEMPLATE.value)
        mail_object.send_sign_up_mail(
            to_emails=email,
            template_id=template_id,
            template_placeholder={"plan_name": message, "email": email},
        )
    

    def send_referral_in_email(self, full_name: str, email: str):
        mail_object = SendgridHandler()
        template_id = self.send_grid_persistence.get_template_by_alias(
            SendgridTemplate.PARTNER_TEMPLATE.value)
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
            template_placeholder={"full_name": full_name, "link": referral_token, "email": email},
        )
        return md5_hash
    

    async def create_partner(self, full_name: str, email: str, company_name: str, commission: str, isMaster: bool) -> PartnersObjectResponse:
        if not full_name or not email or not company_name or not commission:
            return {"status": False, "error": {"code": 404, "message": "Partner data not found"}}
        
        try:
            hash = self.send_referral_in_email(full_name, email)
            creating_data = {
                "full_name": full_name,
                "email": email,
                "company_name": company_name,
                "commission": commission,
                "token": hash,
                "isMaster": isMaster
            }

            created_data = self.partners_persistence.create_partner(creating_data)

            if not created_data:
                logger.debug('Database error during creation', e)
                return {"status": False, "error": {"code": 500, "message": "Partner not created"}}

            user = self.get_user_info(created_data.user_id)
            return {"status": True, "data": self.domain_mapped(created_data, user)}
        
        except Exception as e:
            logger.debug('Error creating partner', e)
            return {"status": False, "error":{"code": 500, "message": f"Unexpected error during creation: {str(e)}"}}
    

    def setUser(self, email: str, user_id: int, status: str, join_date = None):
        if not email or not user_id or not status:
            return {"status": False, "error": {"code": 404, "message": "Partner data not found"}}
        
        try:
            if(join_date):
                updated_data = self.partners_persistence.update_partner_by_email(
                    email=email, user_id=user_id, status=status, join_date=join_date)
            else:
                updated_data = self.partners_persistence.update_partner_by_email(
                    email=email, user_id=user_id, status=status)

            if not updated_data:
                logger.debug('Database error during updation', e)
                return {"status": False, "error": {"code": 500, "message": "Partner not updated"}}
            
            return {"status": True}

        except Exception as e:
            logger.debug('Error updating partner data', e)
            return {"status": False, "error":{"code": 500, "message": f"Unexpected error during updation: {str(e)}"}}
        
    
    async def update_partner(self, partner_id: int, field: str, value: str, message: str) -> PartnersObjectResponse:
        if not partner_id or not field or not value:
            return {"status": False, "error": {"code": 404, "message": "Partner data not found"}}
        
        try:
            updated_data = self.partners_persistence.update_partner(partner_id=partner_id, **{field: value})

            if not updated_data:
                logger.debug("Database error during updation")
                return {"status": False, "error": {"code": 500, "message": "Partner not updated"}}

            self.send_message_in_email(message, updated_data.email)

            user = self.get_user_info(updated_data.user_id)
            return {"status": True, "data": self.domain_mapped(updated_data, user)}
        except Exception as e:
            logger.debug("Error updating partner data", e)
            return {"status": False, "error":{"code": 500, "message": f"Unexpected error during updation: {str(e)}"}}


    def domain_mapped(self, partner: Partners, user: PartnerUserData):
        return PartnersResponse(
            id=partner.id,
            partner_name=partner.name,
            email=partner.email,
            join_date=partner.join_date,
            commission=partner.commission,
            subscription=user["subscription"],
            sources=partner.company_name,
            last_payment_date=user["payment_date"],
            status=partner.status.capitalize()
        ).model_dump()