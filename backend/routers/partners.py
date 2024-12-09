from fastapi import APIRouter, Depends, Query
from dependencies import get_partners_assets_service, check_user_authorization, PartnersAssetService

router = APIRouter()

@router.get('/')
def partners_assets(
                get_partners_assets_service: PartnersAssetService = Depends(get_partners_assets_service),
                user=Depends(check_user_authorization)):
    assets = get_partners_assets_service.get_assets()
    return assets

@router.get("/download")
async def download_asset(
        asset_id: int = Query(...),
        partnersAsset_service: PartnersAssetService = Depends(get_partners_assets_service),
        user=Depends(check_user_authorization)):
    response = partnersAsset_service.download_asset(asset_id)
    return response