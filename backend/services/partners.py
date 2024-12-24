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


    def get_partners(self):
        partners = self.partners_persistence.get_partners()

        result = []
        for partner in partners:
            user_id = partner.user_id
            user = self.user_persistence_service.get_user_by_id(user_id)
            result.append(self.domain_mapped(partner, user))

        return result


    def domain_mapped(self, partner: PartnersAsset, user: any):
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