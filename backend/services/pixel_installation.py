import hashlib
import logging
import os
import re

from fastapi import HTTPException, status
from ffmpeg import run_async
from sqlalchemy.orm import Session
from sqlalchemy import or_
from bs4 import BeautifulSoup
import requests

from enums import BaseEnum, SendgridTemplate, PixelStatus, DomainStatus
from models.subscriptions import UserSubscriptions
from models.users import Users
from models.users_domains import UserDomains
from datetime import datetime, timedelta
from utils import normalize_url
from persistence.sendgrid_persistence import SendgridPersistence
from services.sendgrid import SendgridHandler

logger = logging.getLogger(__name__)


class PixelInstallationService:
    def __init__(self, db: Session, send_grid_persistence_service: SendgridPersistence):
        self.db = db
        self.send_grid_persistence_service = send_grid_persistence_service

    def get_manual(self, user, domain):
        if domain is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={'status': DomainStatus.DOMAIN_NOT_FOUND.value})

        client_id = domain.data_provider_id
        if client_id is None:
            client_id = hashlib.sha256((str(domain.id) + os.getenv('SECRET_SALT')).encode()).hexdigest()
            self.db.query(UserDomains).filter(
                UserDomains.user_id == user.get('id'), 
                UserDomains.domain == domain.domain
            ).update(
                {UserDomains.data_provider_id: client_id},
                synchronize_session=False
            )
            self.db.commit()

        script = f'''
            <script type="text/javascript">
            (function(s, p, i, c, e) {{
                s[e] = s[e] || function() {{ (s[e].a = s[e].a || []).push(arguments); }};
                s[e].l = 1 * new Date();
                var k = c.createElement("script"), a = c.getElementsByTagName("script")[0];
                k.async = 1, k.src = p, a.parentNode.insertBefore(k, a);
                s.pixelClientId = i;
            }})(window, "https://maximiz-data.s3.us-east-2.amazonaws.com/allsource_pixel.js", "{client_id}", document, "script");
            </script>
        '''

        return script, client_id

    def send_pixel_code_in_email(self, email, user, domain):
        message_expiration_time = user.get('pixel_code_sent_at', None)
        time_now = datetime.now()
        if message_expiration_time is not None:
            if (message_expiration_time + timedelta(minutes=1)) > time_now:
                return BaseEnum.SUCCESS
        pixel_code, pixel_client_id = self.get_manual(user, domain)
        mail_object = SendgridHandler()
        template_id = self.send_grid_persistence_service.get_template_by_alias(
            SendgridTemplate.SEND_PIXEL_CODE_TEMPLATE.value)
        full_name = email.split('@')[0]
        mail_object.send_sign_up_mail(
            to_emails=email,
            template_id=template_id,
            template_placeholder={"full_name": full_name, "pixel_code": pixel_code,
                                  "email": email},
        )
        return BaseEnum.SUCCESS

    def parse_website(self, url, domain):
        try:
            response = requests.get(url)
        except:
            return False
        if response.status_code != 200:
            return False
        soup = BeautifulSoup(response.text, 'html.parser')
        pixel_container = soup.find('script', id='acegm_pixel_script')
        if pixel_container:
            script_content = pixel_container.string
            client_id_match = re.search(r'window\.pixelClientId\s*=\s*"([^"]+)"', script_content)
            if client_id_match:
                pixel_client_id = client_id_match.group(1).strip()
                if domain.data_provider_id == pixel_client_id:
                    return True
        return False

    def check_pixel_installed_via_parse(self, url, user, domain):
        result = {'success': False}
        result_parser = self.parse_website(url, domain)

        if result_parser:
            self.db.query(UserDomains).filter(
                UserDomains.user_id == user.get('id'),
                or_(
                    UserDomains.domain == normalize_url(url),
                    UserDomains.domain == 'www.' + normalize_url(url)
                )
            ).update(
                {
                    UserDomains.domain: normalize_url(url),
                    UserDomains.is_pixel_installed: True
                },
                synchronize_session=False
            )

            self.db.commit()
            result['success'] = True
        result['user_id'] = user.get('id')
        return result
    
    def check_pixel_installed_via_api(self, pixelClientId, url):
        result = {'status': PixelStatus.INCORRECT_PROVIDER_ID.value}
        domain = self.db.query(UserDomains).filter(UserDomains.data_provider_id == pixelClientId).first()
        if domain:
            result['status'] = PixelStatus.PIXEL_MISMATCH.value
            if normalize_url(domain.domain) == normalize_url(url):
                result['status'] = PixelStatus.PIXEL_CODE_INSTALLED.value
                domain.is_pixel_installed = True
                self.db.commit()
            user = self.db.query(Users).filter(Users.id == domain.user_id).first()
            result['user_id'] = user.id
        return result
    
    

