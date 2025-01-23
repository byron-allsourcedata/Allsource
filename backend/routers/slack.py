from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from dependencies import get_slack_service, check_user_authorization, check_pixel_install_domain
from services.integrations.slack import SlackService
from config.slack import SlackConfig

router = APIRouter()

@router.get("/oauth/callback")
async def slack_oauth_callback(request: Request, slack_service: SlackService = Depends(get_slack_service)):
    code = request.query_params.get("code")
    state = request.query_params.get("state")
    slack_service.slack_oauth_callback(code=code, state=state)
    return RedirectResponse(SlackConfig.frontend_redirect)
    
@router.get("/authorize-url")
async def get_authorize_url(domain = Depends(check_pixel_install_domain),
                            user=Depends(check_user_authorization), 
                            slack_service: SlackService = Depends(get_slack_service)):
    return slack_service.generate_authorize_url(user_id=user.get('id'), domain_id=domain.id)

@router.get("/get-channels")
async def get_channels(user=Depends(check_user_authorization),
                       domain = Depends(check_pixel_install_domain),
                       slack_service: SlackService = Depends(get_slack_service)):
    return slack_service.get_channels(domain_id = domain.id)
