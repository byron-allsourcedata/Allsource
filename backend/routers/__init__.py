from fastapi import APIRouter
from routers import subscriptions, users, company_info, pixel_installation, admin_customers, dashboard, sse_events, \
    leads, audience, calendly, integrations, settings, domains, suppressions, data_sync, partners

main_router = APIRouter()

main_router.include_router(subscriptions.router, prefix='/subscriptions')
main_router.include_router(company_info.router)
main_router.include_router(users.router)
main_router.include_router(admin_customers.router, prefix='/admin')
main_router.include_router(partners.router, prefix='/partners-assets')
main_router.include_router(dashboard.router, prefix='/dashboard')
main_router.include_router(audience.router, prefix='/audience')
main_router.include_router(pixel_installation.router, prefix='/install-pixel')
main_router.include_router(suppressions.router, prefix='/suppressions')
main_router.include_router(leads.router, prefix='/leads')
main_router.include_router(sse_events.router)
main_router.include_router(calendly.router, prefix='/calendly')
main_router.include_router(integrations.router, prefix='/integrations', tags=['Integrations'])
main_router.include_router(data_sync.router, prefix='/data-sync', tags=['DataSync'])
main_router.include_router(settings.router, prefix='/settings')
main_router.include_router(domains.router, prefix='/domains', tags=['Domains'])
