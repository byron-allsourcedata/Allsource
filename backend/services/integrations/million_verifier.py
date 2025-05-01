import requests
import os
import logging

from persistence.million_verifier import MillionVerifierPersistence

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MillionVerifierIntegrationsService:

    def __init__(self, million_verifier_persistence: MillionVerifierPersistence):
        self.million_verifier_persistence = million_verifier_persistence
        self.api_key = os.getenv('MILLION_VERIFIER_KEY')
        self.api_url = 'https://api.millionverifier.com/api/v3/'
    
    def is_email_verify(self, email: str):
        is_verify = False
        checked_email = self.million_verifier_persistence.find_checked_email(email=email)
        if checked_email:
            return checked_email.is_verify
        
        result = self.__check_verify_email(email)
        if result.get('credits') == 0:
            logger.warning(result.get('error'))
            raise Exception(f"Insufficient credits for million_verifier")
        
        if result.get('resultcode') in (3, 4, 5, 6):
            error_text = result.get('error')
            result_error = result.get('result')
            if error_text:
                logger.debug(f"millionverifier error: {error_text}")
            if result_error:
                logger.debug(f"millionverifier error: {result_error}")
        
        subresult_value = result.get('subresult')
        
        if subresult_value in ('ok', 'unknown', 'greylisted'):
            is_verify = True
        self.million_verifier_persistence.save_checked_email(email=email, is_verify=is_verify, verify_result=subresult_value)
        return is_verify
      
    def __check_verify_email(self, email: str) -> dict:
        params = {
            'email': email,
            'api': self.api_key
        }
        
        try:
            response = requests.get(self.api_url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.HTTPError as e:
            logger.error(e)
        except Exception as e:
            logger.error(e)
