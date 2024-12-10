from fastapi import APIRouter, Depends
from dependencies import get_partners_assets_service, check_user_authorization, PartnersAssetService

router = APIRouter()

@router.get('/')
def partners_assets(
                get_partners_assets_service: PartnersAssetService = Depends(get_partners_assets_service),
                user=Depends(check_user_authorization)):
    assets = get_partners_assets_service.get_assets()
    return assets