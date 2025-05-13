from fastapi import APIRouter, HTTPException, Depends, Request, status
from dependencies import get_domain_service, check_user_authentication,check_team_access_standard_user, UserDomainsService, check_domain, check_user_authorization, check_user_authorization_without_pixel
from schemas.domains import DomainScheme, UpdateDomainRequest
from enums import TeamAccessLevel

router = APIRouter(dependencies=[Depends(check_user_authorization)])


@router.post('/', status_code=201)
def create_domain(domain_data: DomainScheme,
                  domain_service: UserDomainsService = Depends(get_domain_service),
                  user=Depends(check_team_access_standard_user)):

    domain = domain_service.create(user, domain_data.domain)
    if not domain:
        raise HTTPException(status_code=400, detail={'status': 'Domain creation failed'})
    return domain

@router.put('/', status_code=201)
def update_domain_name(request: UpdateDomainRequest,
                    domain = Depends(check_domain),
                    domain_service: UserDomainsService = Depends(get_domain_service),
                    user=Depends(check_team_access_standard_user)):
    
    if domain.is_pixel_installed == True:
        raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Pixel already installed"
            )

    return domain_service.update_domain_name(domain_id=domain.id, domain_name=request.domain_name)

@router.get('/')
def list_domain(request: Request = None,
                domain_service: UserDomainsService = Depends(get_domain_service),
                user=Depends(check_user_authentication)):
    filter_by = dict(request.query_params)
    domains = domain_service.get_domains(user.get('id'), **filter_by)
    return domains


@router.delete('/{domain_id}')
def delete_domain(domain_id: int, domain_service: UserDomainsService = Depends(get_domain_service),
                  user=Depends(check_team_access_standard_user)):
    
    domain_service.delete_domain(user.get('id'), domain_id)
    return {'status': "SUCCESS"}

@router.get("/pixel-installed-anywhere")
def pixel_installed_anywhere(
    user: dict = Depends(check_user_authorization_without_pixel),
    domain_service: UserDomainsService = Depends(get_domain_service)
):
    return domain_service.pixel_installed_anywhere(user)

@router.get('/api_key')
def get_api_key_domain(domain = Depends(check_domain), 
                       user = Depends(check_user_authorization_without_pixel), 
                       domain_service: UserDomainsService = Depends(get_domain_service)):
    return domain_service.get_api_key(domain.id)

    