import logging

from h11._abnf import status_code

from config.base import Base
from dependencies import request_logger
from routers.users import router
from fastapi.middleware.cors import CORSMiddleware
import traceback
from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException


logging.basicConfig(
    level=logging.DEBUG,
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
            'status': exc.detail['status'],
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
