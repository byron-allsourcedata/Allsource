from fastapi import APIRouter, HTTPException, Depends, Response, Request
from fastapi.responses import JSONResponse
from dependencies import get_domain_service, check_user_authentication, UserDomainsService
from schemas.domains import DomainScheme
from urllib.parse import unquote
router = APIRouter(prefix='/domains', tags=['Domains'])


@router.post('/', status_code=201)
def create_domain(domain_data: DomainScheme,
                  domain_service: UserDomainsService = Depends(get_domain_service),
                  user = Depends(check_user_authentication)):
    domain = domain_service.create(user, domain_data.domain)
    if not domain:
        raise HTTPException(status_code=400, detail={'status': 'Domain creation failed'})
    return domain


@router.get('/')
def list_domain(request: Request = None,
                domain_service: UserDomainsService = Depends(get_domain_service),
                user = Depends(check_user_authentication)):
    filter_by = dict(request.query_params)
    domains = domain_service.get_domains(user.get('id'), **filter_by)
    return domains
