from fastapi import APIRouter, HTTPException, Depends, Response, Request, status, Query
from fastapi.responses import JSONResponse
from dependencies import get_partnersAssets_service, check_user_authentication, PartnersAssetService
from schemas.domains import DomainScheme
from urllib.parse import unquote
from enums import TeamAccessLevel

router = APIRouter()



@router.get('/')
def partners_assets(
                partnersAsset_service: PartnersAssetService = Depends(get_partnersAssets_service),
                user=Depends(check_user_authentication)):
    assets = partnersAsset_service.get_assets()
    return assets

@router.get("/download")
async def download_asset(
        asset_id: int = Query(...),
        partnersAsset_service: PartnersAssetService = Depends(get_partnersAssets_service),
        user=Depends(check_user_authentication)):
    response = partnersAsset_service.download_asset(asset_id)
    return response

# @router.get("/download")
# async def download_asset(
#         asset_id: int = Query(...),
#         partnersAsset_service: PartnersAssetService = Depends(get_partnersAssets_service),
#         user=Depends(check_user_authentication)):
#     response, error = partnersAsset_service.download_asset(asset_id)
#     if error:
#         raise HTTPException(status_code=400, detail=error)
#     return response
    