import hashlib
import logging
import os
from sqlalchemy.orm import Session
from models.users import Users

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
            <script type="text/javascript">
                const clientId = "{client_id}";
                const pid = 'aeefb163f3395a3d1bafbbcbf8260a30b1f89ffdb0c329565b5a412ee79f00a7';
                const puid = {{
                    client_id: clientId,
                    purpose: 'website',
                    partner: 'Maximiz'
                }};
                const encodedPuid = encodeURIComponent(JSON.stringify(puid));
                const pixelUrl = 'https://a.usbrowserspeed.com/cs?pid=' + pid + '&puid=' + encodedPuid;
                const script = document.createElement('script');
                script.src = pixelUrl;
                document.getElementById('pixel-container').appendChild(script);

                if (location.href.includes("vge=true")) {{
                    fetch('{os.getenv('SITE_URL')}/install-pixel/pixel_installed', {{
                        method: 'POST',
                        headers: {{
                            'Content-Type': 'application/json'
                        }},
                        body: JSON.stringify({{
                            'client_id': clientId
                        }})
                    }});

                    function showPopup() {{
                        const popup = document.createElement("div");
                        popup.classList.add("popup");
                        popup.style.position = "fixed";
                        popup.style.top = "7rem";
                        popup.style.right = "1rem";
                        popup.style.backgroundColor = "#fff";
                        popup.style.color = "#4d505a";
                        popup.style.borderRadius = "8px";
                        popup.style.font = "600 16px Arial, sans-serif";
                        popup.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
                        popup.style.height = "auto";
                        popup.style.border = "1px solid #ccc";
                        popup.style.width = "400px";
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
                    window.addEventListener("load", showPopup);
                }}
            </script>
        '''
        return script
