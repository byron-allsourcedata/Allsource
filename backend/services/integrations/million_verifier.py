import requests
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

API_KEY = os.getenv('MILLION_VERIFIER_KEY')
API_URL = 'https://api.millionverifier.com/api/v3/'
class MillionVerifierIntegrationsService:

    def __init__(self):
        self.result_stats = {}
        self.subresult_stats = {}
    
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
    
    def find_checked_email(self, email: str):
        return True

    def is_email_verify(self, email: str):
        checked_email = self.find_checked_email()
        if checked_email:
            return checked_email.verify
        result = self.check_verify_email(email)
        if result.get('resultcode') in (3, 4, 5, 6):
            error_text = result.get('error')
            result_error = result.get('result')
            if error_text:
                logger.error(f"millionverifier error: {error_text}")
            if result_error:
                logger.error(f"millionverifier error: {result_error}")
            return False
        
        subresult_value = result.get('subresult', 'other')
        
        if subresult_value in ('ok', 'unknown', 'greylisted'):
            return True
        
        return False
