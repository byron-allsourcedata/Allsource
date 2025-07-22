import logging

from fastapi import FastAPI, Request, BackgroundTasks, HTTPException, Query
from fastapi.responses import PlainTextResponse
from contextlib import asynccontextmanager

from schemas import PixelInstallationRequest
from tasks import fetch_external_data, fetch_domains_with_secret
from utils import get_domain_from_headers

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
valid_dpid_cache: set[str] = set()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global valid_dpid_cache
    domains_list_response = await fetch_domains_with_secret()
    if domains_list_response is None:
        raise HTTPException(
            status_code=500, detail="Failed to fetch domains from external service"
        )

    valid_dpid_cache = set(domains_list_response.data_providers_ids)
    logger.info(f"Loaded {len(valid_dpid_cache)} domains into cache.")
    yield
    logger.info("Application shutdown.")


app = FastAPI(lifespan=lifespan)


@app.get("/pixel.js")
async def read_item(
    request: Request,
    background_tasks: BackgroundTasks,
    pixel_client_id: str = Query(..., alias="dpid"),
    need_reload_page: bool = Query(False, alias="need_reload_page"),
):
    try:
        referer = request.headers.get("Referer")
        origin = request.headers.get("Origin")

        domain_to_check = get_domain_from_headers(referer, origin)

        if domain_to_check and pixel_client_id not in valid_dpid_cache:
            logger.info(
                f"Data provider {pixel_client_id} not found in cache. Domain name: {domain_to_check}. fetching external data..."
            )
            background_tasks.add_task(
                fetch_external_data,
                PixelInstallationRequest(
                    pixelClientId=pixel_client_id,
                    url=domain_to_check,
                    need_reload_page=need_reload_page,
                ),
            )
            valid_dpid_cache.add(pixel_client_id)
            logger.info(
                f"Added {domain_to_check} with data provider id '{pixel_client_id}' to referer_cache"
            )
        elif pixel_client_id in valid_dpid_cache:
            logger.info(
                f"Domain {domain_to_check} with data provider id '{pixel_client_id}' already in cache, skipping external request"
            )
        elif not domain_to_check:
            logger.warning(
                f"Domain name is not provided in 'Referer' or 'Origin' headers for data provider id '{pixel_client_id}'"
            )

        js_content = f"let refererCache = {list(valid_dpid_cache)};"
        return PlainTextResponse(
            content=js_content, media_type="application/javascript"
        )

    except Exception as e:
        logger.error(f"An error occurred while processing /pixel.js: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
