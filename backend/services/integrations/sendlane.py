from typing import List
from schemas.integrations.sendlane import SendlaneCustomer, SendlaneList
from schemas.integrations.integrations import IntegrationCredentials
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from httpx import Client 
from fastapi import HTTPException


class SendlaneIntegration:

    def __init__(self, integration_persistence: IntegrationsPresistence, client: Client):
        self.integration_persistence = integration_persistence
        self.client = client


    def __get_credentials(self, user_id: int):
        return self.integration_persistence.get_credentials_for_service(user_id, 'Sandlane')
    
    
    def __get_customers(self, access_token: str):
        response = self.client.get('https://api.sendlane.com/v2/contacts', headers={
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        })
        if response != 200:
            raise HTTPException(status_code=400, detail={'status': 'error', 'detail': {
                'message': 'Sandlane credentials invalid'
            }})
        return response.json().get('data')
    
    def __save_integration(self, access_token: str, user_id: int):
        data = {'user_id': user_id, 'access_token': access_token, 'service_name': 'Sendlane'}
        if self.integration_persistence.get_credentials_for_service(user_id, 'Shopify'):
            raise HTTPException(status_code=409, detail={'status': 'error', 'detail': {
                'message': 'You already have Sendlane integrations'
            }})  
        integration = self.integration_persistence.create_integration(data)
        if not integration:
            raise HTTPException(status_code=400, detail={'status': 'error', 'detail': {
                'message': 'Save integration is failed'
            }})
        return integration
    
    def __save_customer(self, customer: SendlaneCustomer):
        with self.integration_persistence as service:
            service.sendlane.save_customer(customer)


    def add_integration(self, user, credentials: IntegrationCredentials):
        customers = [self.__mapped_customer(customer) for customer in self.__get_customers(credentials.sendlane.access_token)]
        integrataion = self.__save_integration(credentials.sendlane.access_token, user['id'])
        for customer in customers:
            self.__save_customer(customer, user['id'])
        return {
            'status': 'Successfuly',
            'detail': {
                'id': integrataion.id,
                'service_name': 'Sendlane'
            }
        }        

    def get_list(self, access_token: str):
        response = self.client.get('https://api.sendlane.com/v2/lists', headers={
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        })
        return [self.__mapped_list(list) for list in response.get('data')]

    def __create_list(self, access_token: str, list_name: str):
        data = {'name': list_name, 'sender_id': None}  # Я ПОКА НЕ ЗНАЮ ЧТО ЗА СЕНДЕР ИД 
        response = self.client.post('https://api.sendlane.com/v2/lists', headers={
            'Authorization': f'Bearer {access_token}', 'Content-Type': 'application/json'
        })
        if response.status_code != 201:
            raise HTTPException(status_code=response.status_code, detail={'status': 'error', 'detail': {
                'message': response.json().get('message')
            }})
        return self.__mapped_list(response.json().get('data'))
    
    def __add_customer_to_list(self, access_token: str, list_id: int, customers):
        response = self.client.post(f'https://api.sendlane.com/v2/lists/{list_id}/contacts', headers={
            'Authorizations': f'Bearer {access_token}', 'Content-Type': 'application/json'
        }, data={
            'contacts': [self.__mapped_customer_for_sendlane(customer) for customer in customers]
        })

    
    def export_sync(self, user, list_name: str = None, list_id: int = None, customers_ids: List[int] = None, filter_id: int = None):
        credentials = self.__get_credentials(user['id'])
        if not credentials:
            raise HTTPException(status_code=400, detail={'status': 'error', 'detail': {
                'message': 'Sendlane credentials invalid'
            }})
        if not list_id:
            list = self.__create_list(credentials.access_token, list_name)
            list_id = list.id
        if not customers_ids:
            if not filter_id:
                raise HTTPException(status_code=400, detail={'status': 'error', 'detail': {'message': 'Filter is empty' } } )
            customers_ids = self.leads_persistence.get_customer_by_filter_id(user['id'], filter_id) 
        self.__add_customer_to_list(list_id, customers_ids)
        return {'status': 'Success'}
    

# -------------------------------MAPPED-SENDLANE-DATA------------------------------------ #

    def __mapped_customer(self, customer) -> SendlaneCustomer:
        return SendlaneCustomer(
            sendlane_user_id=customer['id'],
            email=customer['email'],
            first_name=customer['first_name'],
            integration_customer=customer['integration_customer'],
            last_name=customer['last_name'],
            lifetime_value=customer['lifetime_value'],
            lists=customer['lists'],
            phone=customer['phone'],
            sms_consent=customer['sms_consent'],
            subcribed=customer['subcribed'],
            suppressed=customer['suppressed'],
            tags=customer['tags']
        )
    
    def __mapped_list(self, list) -> SendlaneList:
        return SendlaneList(
            id=list['id'],
            name=list['name'],
            description=list['description'],
            status=list['status'],
            created=list['created'],
            sender_id=list['sender_id'],
            flagged=list['flagged']
        )
    
    def __mapped_customer_for_sendlane(self, customer):
        return {
            "first_name": customer.first_name,
            "last_name": customer.last_name,
            "email": customer.business_email,
            "phone": customer.mobile_phone,
            }
    
