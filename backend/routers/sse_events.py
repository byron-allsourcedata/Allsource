from fastapi import APIRouter, Depends, Query
from services.sse_events import SseEventsService
from dependencies import get_sse_events_service
from sse_starlette.sse import EventSourceResponse

router = APIRouter()


@router.get("/event-source")
def get_sse(sse_service: SseEventsService = Depends(get_sse_events_service), token: str = Query(...)):
    print('Work')
    return EventSourceResponse(sse_service.init_sse_events(token))