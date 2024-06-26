import logging

from backend.config.base import Base
from backend.enums import SignUpStatus
from backend.routers.users import router
from fastapi.middleware.cors import CORSMiddleware
import traceback
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

logging.basicConfig(
    level=logging.ERROR,
    format='%(asctime)s %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=Base.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"]
)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.error(f"HTTP Exception: {exc.detail}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            'status': SignUpStatus.ERROR.value,
            'detail': {'error': traceback.format_exc()}
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation Exception: {exc.errors()}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=400,
        content={
            'status': SignUpStatus.ERROR.value,
            'detail': {'error': traceback.format_exc()}
        }
    )


app.include_router(router)
