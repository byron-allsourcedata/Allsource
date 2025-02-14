from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import RedirectResponse
from dependencies import get_slack_service, check_domain, check_user_authentication
from services.integrations.slack import SlackService
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message
from config.slack import SlackConfig
import time
import os
import hmac
from schemas.integrations.slack import SlackCreateListRequest
import logging

router = APIRouter()

def verify_slack_signature(request: Request, request_body: bytes):
    timestamp = request.headers.get('X-Slack-Request-Timestamp')
    slack_signature = request.headers.get('X-Slack-Signature')

    if not timestamp or not slack_signature:
        raise HTTPException(status_code=400, detail="Missing Slack headers")
    
    if abs(time.time() - int(timestamp)) > 60 * 5:
        raise HTTPException(status_code=400, detail="Request timestamp is too old")

    sig_basestring = f"v0:{timestamp}:".encode('utf-8') + request_body

    my_signature = 'v0=' + hmac.new(
        os.getenv('SLACK_CLIENT_SECRET').encode('utf-8'),
        sig_basestring,
        'sha256'
    ).hexdigest()
    
    if not hmac.compare_digest(my_signature, slack_signature):
        raise HTTPException(status_code=400, detail="Invalid Slack signature")

@router.get("/oauth/callback")
async def slack_oauth_callback(request: Request, slack_service: SlackService = Depends(get_slack_service)):
    code = request.query_params.get("code")
    state = request.query_params.get("state")
    result = slack_service.slack_oauth_callback(code=code, state=state)
    if result['status'] == 'SUCCESS':
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        queue_name = f"sse_events_{str(result['user_id'])}"
        try:
            await publish_rabbitmq_message(
            connection=connection,
            queue_name=queue_name,
            message_body={'status': 'Integration with slack was successful'}
            )
        except:
            logging.error('Failed to publish rabbitmq message')
        finally:
            await rabbitmq_connection.close()
        return RedirectResponse(SlackConfig.frontend_redirect)
    return RedirectResponse(f"{SlackConfig.sign_up_redirect}?slack_status={result['status']}")
    
@router.get("/authorize-url")
async def get_authorize_url(domain = Depends(check_domain),
                            user=Depends(check_user_authentication), 
                            slack_service: SlackService = Depends(get_slack_service)):
    return slack_service.generate_authorize_url(user_id=user.get('id'), domain_id=domain.id)

@router.get("/get-channels")
async def get_channels(user=Depends(check_user_authentication),
                       domain = Depends(check_domain),
                       slack_service: SlackService = Depends(get_slack_service)):
    return slack_service.get_channels(domain_id = domain.id)

@router.post("/create-channel")
async def get_channels(slack_create_List_request: SlackCreateListRequest,
                       user=Depends(check_user_authentication),
                       domain = Depends(check_domain),
                       slack_service: SlackService = Depends(get_slack_service)):
    return slack_service.create_channel(domain_id = domain.id, channel_name = slack_create_List_request.name)

@router.post("/events")
async def handle_slack_events(request: Request, slack_service: SlackService = Depends(get_slack_service)):
    body = await request.body()
    verify_slack_signature(request, body)
    data = await request.json()
    if "challenge" in data:
        return {"challenge": data["challenge"]}

    slack_service.slack_events(data)
    return {"status": "ok"}
