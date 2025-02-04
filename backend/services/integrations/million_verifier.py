import requests
import os
import logging

from persistence.million_verifier import MillionVerifierPersistence

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

API_KEY = os.getenv('MILLION_VERIFIER_KEY')
API_URL = 'https://api.millionverifier.com/api/v3/'
class MillionVerifierIntegrationsService:

    def __init__(self, million_verifier_persistence: MillionVerifierPersistence):
        self.million_verifier_persistence = million_verifier_persistence
    
    def check_verify_email(self, email: str) -> dict:
        params = {
            'email': email,
            'api': API_KEY
        }
        
        try:
            response = requests.get(API_URL, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {'error': str(e)}
    
    def is_email_verify(self, email: str):
        is_verify = False
        checked_email = self.million_verifier_persistence.find_checked_email(email=email)
        if checked_email:
            return checked_email.is_verify
        
        result = self.check_verify_email(email)
        if result.get('resultcode') in (3, 4, 5, 6):
            error_text = result.get('error')
            result_error = result.get('result')
            if error_text:
                logger.error(f"millionverifier error: {error_text}")
            if result_error:
                logger.error(f"millionverifier error: {result_error}")
            is_verify = False
        
        subresult_value = result.get('subresult', 'other')
        
        if subresult_value in ('ok', 'unknown', 'greylisted'):
            is_verify = True
        self.million_verifier_persistence.save_checked_email(email=email, is_verify=is_verify)
        return is_verify
