from fastapi import APIRouter, Depends, UploadFile, File, Form
from schemas.partners_asset import PartnersAssetsInfoResponse
from dependencies import get_partners_assets_service, check_user_partners_access, PartnersAssetService

router = APIRouter(dependencies=[Depends(check_user_partners_access)])

@router.get('')
@router.get('/')
def partners_assets(
    get_partners_assets_service: PartnersAssetService = Depends(get_partners_assets_service)):
    
    assets = get_partners_assets_service.get_assets()
    return assets
