import logging

from dotenv import load_dotenv
from fastapi import FastAPI, Request, BackgroundTasks, HTTPException, Query
from fastapi.responses import PlainTextResponse
from contextlib import asynccontextmanager

from schemas import PixelInstallationRequest
from tasks import fetch_external_data, fetch_domains_with_secret
from utils import get_domain_from_headers

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
valid_domain_cache = set()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global valid_domain_cache
    domains_list_response = await fetch_domains_with_secret()

    if domains_list_response is None:
        raise HTTPException(status_code=500, detail="Failed to fetch domains from external service")

    valid_domain_cache = set(domains_list_response.domains)
    logger.info(f"Loaded {len(valid_domain_cache)} domains into cache.")
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

        if domain_to_check and domain_to_check not in valid_domain_cache:
            logger.info(f"Domain {domain_to_check} not found in cache, fetching external data...")
            background_tasks.add_task(
                    fetch_external_data, PixelInstallationRequest(
                        pixelClientId=pixel_client_id,
                        url=domain_to_check,
                        need_reload_page=need_reload_page
                    )
                )
            valid_domain_cache.add(domain_to_check)
            logger.info(f"Added {domain_to_check} to referer_cache")
        elif domain_to_check in valid_domain_cache:
            logger.info(f"Domain {domain_to_check} already in cache, skipping external request")

        js_content = f"let refererCache = {list(valid_domain_cache)};"
        return PlainTextResponse(content=js_content, media_type="application/javascript")

    except Exception as e:
        logger.error(f"An error occurred while processing /pixel.js: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
