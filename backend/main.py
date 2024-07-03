import logging

from h11._abnf import status_code

from backend.config.base import Base
from backend.config.database import SessionLocal
from backend.dependencies import request_logger, get_user_persistence_service, valid_user, get_db
from backend.enums import MiddleWareEnum, BaseEnum
from backend.routers.users import router
from fastapi.middleware.cors import CORSMiddleware
import traceback
from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.services.user_persistence_service import UserPersistenceService

FREE_ENDPOINTS = [
    "/favicon.ico",
    "/api/sign-up",
    "/api/login",
    "/api/sign-up_google",
    "/api/authentication/verify-token"
]

logging.basicConfig(
    level=logging.ERROR,
    format='%(asctime)s %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)
app = FastAPI()


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.error(f"HTTP Exception: {exc.detail}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            'status': status_code,
            'detail': {'error': traceback.format_exc()}
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation Exception: {exc.errors()}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=400,
        content={
            'status': status_code,
            'detail': {'error': traceback.format_exc()}
        }
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=Base.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"]
)
app.include_router(router, prefix=f"/api", dependencies=[Depends(request_logger)])


@app.middleware("http")
async def check_limits(request: Request, call_next):
    if (request.method == "OPTIONS") or (request.url.path in FREE_ENDPOINTS) or (
            "/docs" in request.url.path) or ("/openapi.json" in request.url.path):
        return await call_next(request)
    token = request.headers.get('Authorization')
    db = SessionLocal()
    user = valid_user(token, db=db)
    if not user.email_confirmed:
        return JSONResponse(
            status_code=403,
            content={
                'status': MiddleWareEnum.NEED_EMAIL_CONFIRMATION.value,
            }
        )
    response = await call_next(request)
    return response