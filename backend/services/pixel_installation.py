import hashlib
import logging
import os
from sqlalchemy.orm import Session
from models.users import Users
from schemas.install_pixel import PixelInstallationRequest

logger = logging.getLogger(__name__)


class PixelInstallationService:
    def __init__(self, db: Session, user: Users):
        self.db = db
        self.user = user

    def get_my_info(self):
        return {"email": self.user.email,
                "full_name": self.user.full_name}

    def pixel_installed(self, pixel_installation_request: PixelInstallationRequest):
        if pixel_installation_request is not None:
            self.db.query(Users).filter(Users.data_provider_id == pixel_installation_request.client_id).update(
                {Users.is_pixel_installed: True},
                synchronize_session=False)
            self.db.commit()
        return "OK"

    def get_manual(self):
        client_id = self.user.data_provider_id
        if client_id is None:
            client_id = hashlib.sha256((str(self.user.id) + os.getenv('SECRET_SALT')).encode()).hexdigest()
            self.db.query(Users).filter(Users.id == self.user.id).update(
                {Users.data_provider_id: client_id},
                synchronize_session=False)
            self.db.commit()
            script = '''
               <script type="text/javascript">
               const clientId = "{}"; 
               const pid = 'aeefb163f3395a3d1bafbbcbf8260a30b1f89ffdb0c329565b5a412ee79f00a7'; 
               const puid = {{
                 client_id: clientId,
                 purpose:  'website',
                 partner: 'Maximiz'
               }};

               const encodedPuid = encodeURIComponent(JSON.stringify(puid));
               const pixelUrl = 'https://a.usbrowserspeed.com/cs?pid=' + pid + '&puid=' + encodedPuid;
               const script = document.createElement('script');
               script.src = pixelUrl;
               if (location.href.includes("vge=true")) {{
                 fetch('{}/install-pixel/pixel_installed', {{
                   method: 'POST',
                   headers: {{
                     'Content-Type': 'application/json'
                   }},
                   body: JSON.stringify({{ 'client_id': clientId }})
                 }})
                 .then(response => {{
                   if (response.ok) {{
                     console.log('VGE value saved successfully');
                   }} else {{
                     console.error('Failed to save VGE value');
                   }}
                 }})
                 .catch(error => {{
                   console.error('Error saving VGE value:', error);
                 }});
               }}
               document.body.appendChild(script);
               </script>
               '''.format(client_id, os.getenv('SITE_URL'))
        return script
