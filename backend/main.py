import logging

from h11._abnf import status_code

from config.base import Base
from routers import main_router
from external_api_routers import subapi_router
from fastapi.middleware.cors import CORSMiddleware
import traceback
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s.%(msecs)03d %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

app = FastAPI()
external_api = FastAPI()


@external_api.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code is not None and not (exc.status_code == 403 or exc.status_code == 401):
        logger.error(f"HTTP Exception: {exc.detail}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail
    )


@external_api.exception_handler(Exception)
async def http_exception_handler(request: Request, exc: Exception):
    logger.error(f"HTTP Exception: {str(exc)}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={
            'status': 'Internal Server Error',
            'detail': {'error': str(exc)}
        }
    )


@external_api.exception_handler(RequestValidationError)
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
    allow_origins=['*'],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allow_headers=["*"]
)

external_api.add_middleware(
    CORSMiddleware,
    allow_origins=Base.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allow_headers=["*"]
)

app.include_router(subapi_router)
external_api.include_router(main_router)
app.mount('/api', external_api)
