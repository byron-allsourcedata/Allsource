from fastapi import APIRouter, HTTPException, Depends, Response, Request
from fastapi.responses import JSONResponse
from dependencies import get_domain_service, check_user_authentication, UserDomainsService, get_cookie_domain
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
async def list_domain(request: Request = None,
                domain_service: UserDomainsService = Depends(get_domain_service),
                user = Depends(check_user_authentication)):
    filter_by = dict(request.query_params)
    domains = domain_service.get_domains(user.get('id'), **filter_by)
    response = JSONResponse(content=domains)
    if not request.cookies.get('current_domain'):
        response.set_cookie(key='current_domain', value=domains[0].get('domain'), samesite='none', secure=True)
    return response

@router.post('/set')
def set_domain(domain: DomainScheme):
    response = JSONResponse(content={'current_domain': domain.domain})
    response.set_cookie(key='current_domain', value=domain.domain, samesite='none', secure=True)
    return response