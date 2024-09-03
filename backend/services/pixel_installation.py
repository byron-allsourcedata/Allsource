import hashlib
import logging
import os
import re
from sqlalchemy.orm import Session
from bs4 import BeautifulSoup
import requests

from enums import BaseEnum, SendgridTemplate
from models.subscriptions import UserSubscriptions
from models.users import Users
from datetime import datetime, timedelta

from persistence.sendgrid_persistence import SendgridPersistence
from services.sendgrid import SendgridHandler

logger = logging.getLogger(__name__)


class PixelInstallationService:
    def __init__(self, db: Session, send_grid_persistence_service: SendgridPersistence):
        self.db = db
        self.send_grid_persistence_service = send_grid_persistence_service

    def get_manual(self, user):
        client_id = user.get('data_provider_id')
        if client_id is None:
            client_id = hashlib.sha256((str(user.get('id')) + os.getenv('SECRET_SALT')).encode()).hexdigest()
            self.db.query(Users).filter(Users.id == user.get('id')).update(
                {Users.data_provider_id: client_id},
                synchronize_session=False
            )
            self.db.commit()
        script = f'''
        <script id="acegm_pixel_script" type="text/javascript" defer="defer">
        window.pixelClientId = "{client_id}";
        var acegm_pixelScriptUrl = 'https://maximiz-data.s3.us-east-2.amazonaws.com/pixel.js'
        var acegm_base_pixel_script = document.createElement('script');
        acegm_base_pixel_script.src = acegm_pixelScriptUrl;
        document.body.appendChild(acegm_base_pixel_script);
        </script>
        '''

        return script, client_id

    def send_pixel_code_in_email(self, email, user):
        message_expiration_time = user.get('pixel_code_sent_at', None)
        time_now = datetime.now()
        if message_expiration_time is not None:
            if (message_expiration_time + timedelta(minutes=1)) > time_now:
                return BaseEnum.SUCCESS
        pixel_code, pixel_client_id = self.get_manual(user)
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

    def parse_website(self, url, user):
        try:
            response = requests.get(url)
        except:
            return False
        response.raise_for_status()
        if response.status_code != 200:
            return False
        soup = BeautifulSoup(response.text, 'html.parser')
        pixel_container = soup.find('script', id='acegm_pixel_script')
        if pixel_container:
            script_content = pixel_container.string
            client_id_match = re.search(r'window\.pixelClientId\s*=\s*"([^"]+)"', script_content)
            if client_id_match:
                pixel_client_id = client_id_match.group(1).strip()
                if user.get('data_provider_id') == pixel_client_id:
                    return True
        return False

    def check_pixel_installed(self, url, user):
        result = {'success': False}
        result_parser = self.parse_website(url, user)
        if result_parser:
            start_date = datetime.utcnow()
            end_date = start_date + timedelta(days=7)
            start_date_str = start_date.isoformat() + "Z"
            end_date_str = end_date.isoformat() + "Z"
            self.db.query(UserSubscriptions).filter(UserSubscriptions.user_id == user.get('id')).update(
                {UserSubscriptions.plan_start: start_date_str, UserSubscriptions.plan_end: end_date_str},
                synchronize_session=False
            )
            self.db.query(Users).filter(Users.id == user.get('id')).update(
                {Users.company_website: url},
                synchronize_session=False)
            self.db.commit()
            result['success'] = True
        result['user_id'] = user.get('id')
        return result
