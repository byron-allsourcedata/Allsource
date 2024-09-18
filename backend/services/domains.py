from persistence.domains import UserDomainsPersistence, UserDomains
from schemas.domains import DomainResponse
from services.users import UsersService
from persistence.plans_persistence import PlansPersistence
from enums import  SubscriptionStatus
from fastapi import HTTPException
class UserDomainsService:

    def __init__(self, domain_persistece: UserDomainsPersistence, plan_persistence: PlansPersistence):
        self.domain_persistence = domain_persistece
        self.plan_persistence = plan_persistence
        self.user_service = UsersService

    def create(self, user, domain: str):
        plan_info = self.plan_persistence.get_plan_info(user.get('id'))
        if self.domain_persistence.count_domain(user.get('id')) >= plan_info.domains_limit:
            raise HTTPException(status_code=403, detail={'status': SubscriptionStatus.NEED_UPGRADE_PLAN.value})
        if 'https://' not in domain or 'http://' not in domain:
            domain = f'https://{domain}'
        new_domain = self.domain_persistence.create_domain(user.get('id'), {'domain': domain})
        return self.domain_mapped(new_domain)

    def get_domains(self, user_id: int, **filter_by):
        domains = self.domain_persistence.get_domain_by_user(user_id)
        return [self.domain_mapped(domain) for domain in domains]
    
    def domain_mapped(self, domain: UserDomains):
        return DomainResponse(
            id=domain.id,
            domain=domain.domain,
            data_provider_id=domain.data_provider_id,
            is_pixel_installed=domain.is_pixel_installed,
            enable=domain.enable
        ).model_dump()