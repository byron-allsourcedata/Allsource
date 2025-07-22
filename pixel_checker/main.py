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

        found_in_cache = pixel_client_id in valid_dpid_cache
        if domain_to_check and not found_in_cache:
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
        elif found_in_cache:
            logger.info(
                f"Domain {domain_to_check} with data provider id '{pixel_client_id}' already in cache, skipping external request"
            )
        elif not domain_to_check:
            logger.warning(
                f"Domain name is not provided in 'Referer' or 'Origin' headers for data provider id '{pixel_client_id}'"
            )

        js_content = """
        (function createPopup({ success, message, domain_url }) {
        const popup = document.createElement("div");
        popup.className = "popup";

        const icon = success
            ? `<img src="https://jsstore.s3-us-west-2.amazonaws.com/circle-check.png" style="width:18px;">`
            : `<svg width="18" height="18" viewBox="0 0 24 24" fill="red" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6l12 12" stroke="red" stroke-width="2" stroke-linecap="round"/>
               </svg>`;

        popup.innerHTML = `
            <div style="text-align:center; padding-bottom:24px;">
                <img src="https://app.allsourcedata.io/logo.svg" style="height:36px; width:auto;">
            </div>
            <table style="width:100%; font-size:14px; border-collapse:collapse; margin:0;">
                <tr>
                    <th style="border-bottom:1px solid #000; border-right:1px solid #000; padding-bottom:6px; width:50%; text-align:left;">SCRIPT</th>
                    <th style="border-bottom:1px solid #000; padding-bottom:6px; text-align:center;">FOUND</th>
                </tr>
                <tr>
                    <td style="border-right:1px solid #000; color:#1F2C48; height:32px; text-align:left; padding:4px; background:#fff;">Setup Pixel</td>
                    <td style="text-align:center; padding:4px; background:#fff;">${icon}</td>
                </tr>
            </table>
            ${!success ? `<div style="color: #d00; margin-top: 16px; font-size: 14px; text-align: center;">${message}</div>` : ""}
            ${domain_url ? `
                <div style="text-align:right; margin-top:30px;">
                    <a href="${domain_url}" style="background-color:#3898FC; color:#fff; text-decoration:none; padding:8px 16px; font-size:14px; border-radius:4px; display:inline-block; min-height:25px; line-height:25px;">
                        Go back
                    </a>
                </div>
            ` : ""}
        `;

        Object.assign(popup.style, {
            position: "fixed",
            top: "1rem",
            right: "1rem",
            backgroundColor: "#fff",
            color: "#4d505a",
            borderRadius: "8px",
            font: "600 16px Arial, sans-serif",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            border: "1px solid #ccc",
            width: "400px",
            zIndex: "9999",
            padding: "1rem",
            cursor: "pointer"
        });

        document.body.appendChild(popup);
    }
    )({ success: true, message: "" })
    """

        if found_in_cache:
            js_content = "let _ = 0;"
        return PlainTextResponse(
            content=js_content, media_type="application/javascript"
        )

    except Exception as e:
        logger.error(f"An error occurred while processing /pixel.js: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
