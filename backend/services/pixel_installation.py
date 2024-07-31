import hashlib
import logging
import os
import re
from sqlalchemy.orm import Session
from bs4 import BeautifulSoup
import requests
from models.subscriptions import UserSubscriptions
from models.users import Users
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class PixelInstallationService:
    def __init__(self, db: Session, user: Users):
        self.db = db
        self.user = user

    def get_my_info(self):
        return {"email": self.user.email,
                "full_name": self.user.full_name}

    def get_manual(self):
        client_id = self.user.data_provider_id
        if client_id is None:
            client_id = hashlib.sha256((str(self.user.id) + os.getenv('SECRET_SALT')).encode()).hexdigest()
            self.db.query(Users).filter(Users.id == self.user.id).update(
                {Users.data_provider_id: client_id},
                synchronize_session=False)
            self.db.commit()
        script = f'''
            <script id="acegm_pixel_script" type="text/javascript">
                const pixel_clientId = "{client_id}";
                const pixel_pid = 'aeefb163f3395a3d1bafbbcbf8260a30b1f89ffdb0c329565b5a412ee79f00a7';
                const pixel_puid = {{
                    client_id: pixel_clientId,
                    purpose: 'website',
                    current_page: window.location.href,
                }};
                const pixel_encodedPuid = encodeURIComponent(JSON.stringify(pixel_puid));
                const pixelUrl = 'https://a.usbrowserspeed.com/cs?pid=' + pixel_pid + '&puid=' + pixel_encodedPuid;
                const pixelContainer = document.createElement('div');
                pixelContainer.id = 'pixel-container';
                document.body.appendChild(pixelContainer);
                const pixelScript = document.createElement('script');
                pixelScript.src = pixelUrl;
                pixelContainer.appendChild(pixelScript);
                if (location.href.includes("vge=true")) {{
                    showPopup();
                }}
                function showPopup() {{
                        const popup = document.createElement("div");
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
                        popup.addEventListener("click", () => {{
                            popup.remove();
                        }});
                    }}
            </script>
        '''
        return script

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
                hash_client_id = hashlib.sha256((str(self.user.id) + os.getenv('SECRET_SALT')).encode()).hexdigest()
                if hash_client_id == pixel_client_id:
                    return True
        return False

    def check_pixel_installed(self, url):
        if self.user and not self.user.is_pixel_installed:
            result_parser = self.parse_website(url)
            if result_parser:
                start_date = datetime.utcnow()
                end_date = start_date + timedelta(days=7)
                start_date_str = start_date.isoformat() + "Z"
                end_date_str = end_date.isoformat() + "Z"
                self.db.query(UserSubscriptions).filter(UserSubscriptions.user_id == self.user.id).update(
                    {UserSubscriptions.plan_start: start_date_str, UserSubscriptions.plan_end: end_date_str},
                    synchronize_session=False
                )
                self.db.query(Users).filter(Users.id == self.user.id).update(
                    {Users.is_pixel_installed: True},
                    synchronize_session=False)
                self.db.commit()
                return self.user.id
