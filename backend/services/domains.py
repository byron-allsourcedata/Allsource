from fastapi import HTTPException
import uuid
import os
from enums import SubscriptionStatus
from persistence.domains import UserDomainsPersistence, UserDomains
from persistence.plans_persistence import PlansPersistence
from schemas.domains import DomainResponse, UpdateDomain
from services.subscriptions import SubscriptionService
from utils import normalize_url


class UserDomainsService:

    def __init__(self, user_domain_persistence: UserDomainsPersistence, plan_persistence: PlansPersistence,
                 subscription_service: SubscriptionService):
        self.domain_persistence = user_domain_persistence
        self.plan_persistence = plan_persistence
        self.subscription_service = subscription_service
        self.UNLIMITED = -1

    def create(self, user, domain: str):
        plan_info = self.subscription_service.get_user_subscription((user.get('id')))
        if plan_info.domains_limit != self.UNLIMITED:
            if self.domain_persistence.count_domain(
                    user.get('id')) >= plan_info.domains_limit:
                raise HTTPException(status_code=403, detail={'status': SubscriptionStatus.NEED_UPGRADE_PLAN.value})
        new_domain = self.domain_persistence.create_domain(user.get('id'), {'domain': normalize_url(domain)})
        return self.domain_mapped(new_domain)

    def get_domains(self, user_id: int, **filter_by):
        domains = self.domain_persistence.get_domains_by_user(user_id)
        sorted_domains = sorted(domains, key=lambda x: x.created_at)
        return [
            self.domain_mapped(domain)
            for i, domain in enumerate(sorted_domains)
        ]

    def pixel_installed_anywhere(self, user):
        domains = self.domain_persistence.get_domains_by_user(user.get("id"))
        installed_any = any(d.is_pixel_installed for d in domains)
        return {"pixel_installed": installed_any}
    
    def get_domains_with_leads(self, user):
        domains = self.domain_persistence.get_domains_with_leads(user.get("id"))
        return [
            {
                'id': domain[0],
                'name': domain[1],
                'pixel_installed': domain[2],
                'converted_sales_count': domain[3],
                'viewed_product_count': domain[4],
                'visitor_count': domain[5],
                'abandoned_cart_count': domain[6],
                'total_count': domain[7],
            }
            for domain in domains
        ]
    
    def clean_account(self, email):
        self.domain_persistence.clear_account_from_domains(email)
        return f"{os.environ.get('SITE_HOST_URL')}"
        
    def update_domain_name(self, domain_id: int, domain_name: str):
        self.domain_persistence.update_domain_name(domain_id, domain_name)
        return {'status': 'SUCCESS'}
    
    def update_domain(self, user_id: int, request: UpdateDomain):
        self.domain_persistence.update_first_domain_by_user_id(user_id, request.new_domain)

    def domain_mapped(self, domain: UserDomains):
        return DomainResponse(
            id=domain.id,
            domain=domain.domain,
            data_provider_id=domain.data_provider_id,
            is_pixel_installed=domain.is_pixel_installed,
            enable=domain.is_enable
        ).model_dump()

    def delete_domain(self, user_id: int, domain_id: int):
        if self.domain_persistence.count_domain(user_id) == 1:
            raise HTTPException(status_code=409, detail={'status': 'LAST_DOMAIN'})
        return self.domain_persistence.delete_domain(user_id, domain_id)

    def __create_api_key(self, domain: UserDomains):
        api_key = f'maximiz-{uuid.uuid4().hex}'
        domain.api_key = api_key
        self.domain_persistence.db.commit()
        return api_key

    def get_api_key(self, domain_id: int):
        domains = self.domain_persistence.get_domain_by_filter(id=domain_id)
        if not domains:
            raise HTTPException(status_code=404, detail={'status': 'Domain not found'})
        api_key = domains[0].api_key
        if not api_key:
            api_key = self.__create_api_key(domains[0])
        return api_key