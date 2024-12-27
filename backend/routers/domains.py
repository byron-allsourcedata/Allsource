from fastapi import APIRouter, HTTPException, Depends, Response, Request, status
from fastapi.responses import JSONResponse
from dependencies import get_domain_service, check_user_authentication, UserDomainsService, check_pixel_install_domain, check_user_authorization
from schemas.domains import DomainScheme
from urllib.parse import unquote
from enums import TeamAccessLevel

router = APIRouter(dependencies=[Depends(check_user_authorization)])


@router.post('/', status_code=201)
def create_domain(domain_data: DomainScheme,
                  domain_service: UserDomainsService = Depends(get_domain_service),
                  user=Depends(check_user_authentication)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {TeamAccessLevel.ADMIN.value, TeamAccessLevel.OWNER.value,
                                                        TeamAccessLevel.STANDARD.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins and standard only."
            )

    domain = domain_service.create(user, domain_data.domain)
    if not domain:
        raise HTTPException(status_code=400, detail={'status': 'Domain creation failed'})
    return domain


@router.get('/')
def list_domain(request: Request = None,
                domain_service: UserDomainsService = Depends(get_domain_service),
                user=Depends(check_user_authentication)):
    filter_by = dict(request.query_params)
    domains = domain_service.get_domains(user.get('id'), **filter_by)
    return domains


@router.delete('/{domain_id}')
def delete_domain(domain_id: int, domain_service: UserDomainsService = Depends(get_domain_service),
                  user=Depends(check_user_authentication)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {TeamAccessLevel.ADMIN.value, TeamAccessLevel.OWNER.value,
                                                        TeamAccessLevel.STANDARD.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins and standard only."
            )
    domain_service.delete_domain(user.get('id'), domain_id)
    return {'status': "SUCCESS"}


@router.get('/api_key')
def get_api_key_domain(domain = Depends(check_pixel_install_domain), 
                       user = Depends(check_user_authentication), 
                       domain_service: UserDomainsService = Depends(get_domain_service)):
    return domain_service.get_api_key(domain.id)

        
    