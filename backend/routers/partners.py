from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from schemas.partners_asset import PartnersAssetsInfoResponse
from dependencies import get_partners_assets_service, check_user_partners_access, PartnersAssetService

router = APIRouter(dependencies=[Depends(check_user_partners_access)])


@router.get('')
@router.get('/')
def partners_assets(
    get_partners_assets_service: PartnersAssetService = Depends(get_partners_assets_service)):
    
    assets = get_partners_assets_service.get_assets()
    return assets


@router.delete("/{id}", response_model=PartnersAssetsInfoResponse)
@router.delete("/{id}/", response_model=PartnersAssetsInfoResponse)
async def delete_asset(
    id: str, 
    get_partners_assets_service: PartnersAssetService = Depends(get_partners_assets_service)):
    
    return PartnersAssetsInfoResponse(status=get_partners_assets_service.delete_asset(id))


@router.post("")
@router.post("/")
async def create_asset(
    description: str = Form(...),
    type: str = Form(...),
    file: UploadFile = File(None),
    get_partners_assets_service: PartnersAssetService = Depends(get_partners_assets_service),
):
    
    created_asset = await get_partners_assets_service.create_asset(description, type, file)
    return created_asset


@router.put("/{asset_id}")
@router.put("/{asset_id}/")
async def update_asset(
    asset_id: int,
    description: str = Form(...),
    file: UploadFile = File(None),
    get_partners_assets_service: PartnersAssetService = Depends(get_partners_assets_service),
):
    
    updated_asset = await get_partners_assets_service.update_asset(asset_id, description, file)
    return updated_asset