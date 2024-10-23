from fastapi import HTTPException

from enums import SubscriptionStatus
from persistence.domains import UserDomainsPersistence, UserDomains
from persistence.plans_persistence import PlansPersistence
from schemas.domains import DomainResponse
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
        if self.domain_persistence.count_domain(
                user.get('id')) >= plan_info.domains_limit or plan_info == self.UNLIMITED:
            raise HTTPException(status_code=403, detail={'status': SubscriptionStatus.NEED_UPGRADE_PLAN.value})
        new_domain = self.domain_persistence.create_domain(user.get('id'), {'domain': normalize_url(domain)})
        return self.domain_mapped(new_domain)

    def get_domains(self, user_id: int, **filter_by):
        domains = self.domain_persistence.get_domain_by_user(user_id)
        sorted_domains = sorted(domains, key=lambda x: x.created_at)
        return [
            self.domain_mapped(domain)
            for i, domain in enumerate(sorted_domains)
        ]

    def domain_mapped(self, domain: UserDomains):
        return DomainResponse(
            id=domain.id,
            domain=domain.domain,
            data_provider_id=domain.data_provider_id,
            is_pixel_installed=domain.is_pixel_installed,
            enable=domain.enable
        ).model_dump()

    def delete_domain(self, user_id: int, domain_id: int):
        if self.domain_persistence.count_domain(user_id) == 1:
            raise HTTPException(status_code=409, detail={'status': 'LAST_DOMAIN'})
        return self.domain_persistence.delete_domain(user_id, domain_id)
