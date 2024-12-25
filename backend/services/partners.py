import logging
import os
from typing import Union
import tempfile
import hashlib
import zipfile
from pathlib import Path
from PIL import Image
import ffmpeg
import subprocess
from fastapi import HTTPException, UploadFile
from io import BytesIO
from urllib.parse import urlparse
import requests
from models.partners_asset import PartnersAsset
from services.aws import AWSService
from persistence.user_persistence import UserPersistence
from persistence.partners_persistence import PartnersPersistence
from schemas.partners_asset import PartnersResponse

logger = logging.getLogger(__name__)


class PartnersService:

    def __init__(self,
        partners_persistence: PartnersPersistence,
        user_persistence_service: UserPersistence):
        self.partners_persistence = partners_persistence
        self.user_persistence_service = user_persistence_service
        self.default_user = {
            "full_name": "Default User",
            "email": "default@example.com",
            "source_platform": "N/A"
        }


    def get_partners(self):
        partners = self.partners_persistence.get_partners()

        result = []
        for partner in partners:
            user_id = partner.user_id
            if user_id is not None:
                user = self.user_persistence_service.get_user_by_id(user_id)
            else:
                user = self.default_user
            result.append(self.domain_mapped(partner, user))

        return result
    

    def delete_asset(self, id: int):
        if not id:
            raise HTTPException(status_code=404, detail="Partner data not found")
        try:
            self.partners_persistence.terminate_partner(partner_id=id)
            return {"status": "SUCCESS"}
        except Exception as e:
            logger.debug('Error deleting partner', e)
            raise HTTPException(status_code=500, detail=f"Unexpected error during delete: {str(e)}")
    

    async def create_partner(self, full_name: str, email: str, company_name: str, commission: str):
        if not full_name or not email or not company_name or not commission:
            raise HTTPException(status_code=404, detail="Partner data not found")
        
        try:
            creating_data = {
                "full_name": full_name,
                "email": email,
                "company_name": company_name,
                "commission": commission
            }

            created_data = self.partners_persistence.create_partner(creating_data)

            if not created_data:
                logger.debug('Database error during creation', e)
                raise HTTPException(status_code=500, detail="Partner not created")

            return {"status": "SUCCESS", "data": self.domain_mapped(created_data, self.default_user)}
        except Exception as e:
            logger.debug('Error creating assets file', e)
            raise HTTPException(status_code=500, detail=f"Unexpected error during creation: {str(e)}")
        
    
    async def update_partner(self, partner_id: int, commission: str):
        if not partner_id or not commission:
            raise HTTPException(status_code=404, detail="Partner data not found")
        
        try:
            updated_data = self.partners_persistence.update_partner(partner_id, commission)

            if not updated_data:
                logger.debug('Database error during updation', e)
                raise HTTPException(status_code=500, detail="Partner not updated")

            return {"status": "SUCCESS", "data": self.domain_mapped(updated_data, self.default_user)}
        except Exception as e:
            logger.debug('Error updating assets file', e)
            raise HTTPException(status_code=500, detail=f"Unexpected error during updation: {str(e)}")


    def domain_mapped(self, partner: PartnersAsset, user: dict):
        return PartnersResponse(
            id=partner.id,
            partner_name=user['full_name'],
            email=user['email'],
            # join_date=user['created_at'],
            join_date="1880-12-19 12:54:55",
            commission=partner.commission,
            subscription="Basic",
            sources=user['source_platform'],
            last_payment_date="1880-12-19 12:54:55",
            status=partner.status,
        ).model_dump()