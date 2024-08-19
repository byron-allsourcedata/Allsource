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
    def __init__(self, db: Session, user, send_grid_persistence_service: SendgridPersistence):
        self.db = db
        self.user = user
        self.send_grid_persistence_service = send_grid_persistence_service

    def get_my_info(self):
        return {"email": self.user.get('email'),
                "full_name": self.user.get('full_name')}

    def get_manual(self):
        client_id = self.user.get('data_provider_id')
        if client_id is None:
            client_id = hashlib.sha256((str(self.user.get('id')) + os.getenv('SECRET_SALT')).encode()).hexdigest()
            self.db.query(Users).filter(Users.id == self.user.get('id')).update(
                {Users.data_provider_id: client_id},
                synchronize_session=False
            )
            self.db.commit()

        script = f'''
            <script id="acegm_pixel_script" type="text/javascript" defer="defer">
                var pixel_clientId = "{client_id}";
                var pixel_pid = 'aeefb163f3395a3d1bafbbcbf8260a30b1f89ffdb0c329565b5a412ee79f00a7';
                var pixel_puid = {{
                    client_id: pixel_clientId,
                    purpose: 'website',
                    current_page: window.location.href,
                }};
                var pixel_encodedPuid = encodeURIComponent(JSON.stringify(pixel_puid));
                var pixelUrl = 'https://a.usbrowserspeed.com/cs?pid=' + pixel_pid + '&puid=' + pixel_encodedPuid;
                var pixelContainer = document.createElement('div');
                pixelContainer.id = 'pixel-container';
                document.body.appendChild(pixelContainer);
                var pixelScript = document.createElement('script');
                pixelScript.src = pixelUrl;
                pixelContainer.appendChild(pixelScript);
                if (location.href.includes("vge=true")) {{
                    showPopup();
                }}
                function showPopup() {{
                    var popup = document.createElement("div");
                    popup.classList.add("popup");
                    popup.style.position = "fixed";
                    popup.style.top = "1rem";
                    popup.style.right = "1rem";
                    popup.style.backgroundColor = "#fff";
                    popup.style.color = "#4d505a";
                    popup.style.borderRadius = "8px";
                    popup.style.font = "600 16px Arial, sans-serif";
                    popup.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
                    popup.style.height = "auto";
                    popup.style.border = "1px solid #ccc";
                    popup.style.width = "400px";
                    popup.style.zIndex = "999";
                    popup.style.padding = "1rem";
                    popup.innerHTML = `
                        <div style="text-align:center;padding-bottom:24px;">
                            <img src="https://dev.maximiz.ai/logo.svg" style="height:36px;width:auto;">
                        </div>
                        <table style="width:100%;font-size:14px;border-collapse:collapse;margin:0;">
                            <tr>
                                <th style="border-bottom:1px solid #000;border-right:1px solid #000;padding-bottom:6px;width:50%;text-align:left;">SCRIPT</th>
                                <th style="border-bottom:1px solid #000;border-right:1px solid #000;padding-bottom:6px;text-align:center;">FOUND</th>
                            </tr>
                            <tr>
                                <td style="border-right:1px solid #000;color:#1F2C48;height:32px;text-align:left;padding:4px;background:#fff;">Setup Pixel</td>
                                <td style="border-right:1px solid #000;text-align:center;padding:4px;background:#fff;"><img src="https://jsstore.s3-us-west-2.amazonaws.com/circle-check.png" style="width:18px;"></td>
                            </tr>
                        </table>
                        <div style="padding-top:20px;color:#1F2C48;"></div>
                    `;
                    document.body.appendChild(popup);
                    popup.addEventListener("click", function() {{
                        popup.remove();
                    }});
                }}
            </script>
        '''
        return script

    def send_pixel_code_in_email(self, email):
        pixel_code = self.get_manual()
        mail_object = SendgridHandler()

        template_id = self.send_grid_persistence_service.get_template_by_alias(
            SendgridTemplate.SEND_PIXEL_CODE_TEMPLATE.value)
        full_name = email.split('@')[0]
        mail_object.send_sign_up_mail(
            subject="Maximize Password Reset Request",
            to_emails=email,
            template_id=template_id,
            template_placeholder={"full_name": full_name, "pixel_code": pixel_code,
                                  "email": email},
        )
        return BaseEnum.SUCCESS

    def parse_website(self, url):
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
            client_id_match = re.search(r'const\s+pixel_clientId\s*=\s*["\']([^"\']+)["\']', script_content)
            if client_id_match:
                pixel_client_id = client_id_match.group(1)
                if self.user.get('data_provider_id') == pixel_client_id:
                    return True
        return False

    def check_pixel_installed(self, url):
        result = {'success': False}
        result_parser = self.parse_website(url)
        if result_parser:
            start_date = datetime.utcnow()
            end_date = start_date + timedelta(days=7)
            start_date_str = start_date.isoformat() + "Z"
            end_date_str = end_date.isoformat() + "Z"
            self.db.query(UserSubscriptions).filter(UserSubscriptions.user_id == self.user.get('id')).update(
                {UserSubscriptions.plan_start: start_date_str, UserSubscriptions.plan_end: end_date_str},
                synchronize_session=False
            )
            self.db.query(Users).filter(Users.id == self.user.get('id')).update(
                {Users.is_pixel_installed: True},
                synchronize_session=False)
            self.db.commit()
            result['success'] = True
        result['user_id'] = self.user.get('id')
        return result
