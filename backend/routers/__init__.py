from fastapi import APIRouter
from routers import subscriptions, users, company_info, pixel_installation, admin_customers, dashboard, sse_events, sources, \
    admin_partner, admin_accounts, leads, audience, calendly, integrations, settings, domains, suppressions, data_sync, referral, partners, admin_assets, admin_payouts,\
    slack, leads_companies, lookalikes


main_router = APIRouter()

main_router.include_router(subscriptions.router, prefix='/subscriptions')
main_router.include_router(company_info.router)
main_router.include_router(users.router)
main_router.include_router(sources.router, prefix='/audience-sources')
main_router.include_router(admin_customers.router, prefix='/admin')
main_router.include_router(partners.router, prefix='/partners')
main_router.include_router(admin_partner.router, prefix='/admin-partners')
main_router.include_router(admin_assets.router, prefix='/admin-assets')
main_router.include_router(admin_accounts.router, prefix='/admin-accounts')
main_router.include_router(admin_payouts.router, prefix='/admin-payouts')
main_router.include_router(dashboard.router, prefix='/dashboard')
main_router.include_router(audience.router, prefix='/audience')
main_router.include_router(pixel_installation.router, prefix='/install-pixel')
main_router.include_router(suppressions.router, prefix='/suppressions')
main_router.include_router(leads.router, prefix='/leads')
main_router.include_router(slack.router, prefix='/slack')
main_router.include_router(sse_events.router)
main_router.include_router(calendly.router, prefix='/calendly')
main_router.include_router(integrations.router, prefix='/integrations', tags=['Integrations'])
main_router.include_router(data_sync.router, prefix='/data-sync', tags=['DataSync'])
main_router.include_router(settings.router, prefix='/settings')
main_router.include_router(domains.router, prefix='/domains', tags=['Domains'])
main_router.include_router(referral.router, prefix='/referral')
main_router.include_router(leads_companies.router, prefix='/company')
main_router.include_router(lookalikes.router, prefix='/lookalikes')
