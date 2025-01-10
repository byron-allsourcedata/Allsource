from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from dependencies import get_partners_assets_service, check_user_admin, PartnersAssetService

router = APIRouter(dependencies=[Depends(check_user_admin)])


@router.get('')
@router.get('/')
def partners_assets(
    get_partners_assets_service: PartnersAssetService = Depends(get_partners_assets_service)):
    
    assets = get_partners_assets_service.get_assets()
    
    if not assets.get("status"):
        error = assets.get("error", {}) or {}
        raise HTTPException(status_code=error.get("code", 500), detail=error.get("message", "Unknown error occurred"))
     
    return assets.get('data')  


@router.delete("/{id}")
@router.delete("/{id}/")
async def delete_asset(
    id: str, 
    get_partners_assets_service: PartnersAssetService = Depends(get_partners_assets_service)):
    
    status = get_partners_assets_service.delete_asset(id)
    return {"status": status, "data": None}


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
    type: str = Form(...),
    file: UploadFile = File(None),
    get_partners_assets_service: PartnersAssetService = Depends(get_partners_assets_service),
):
    
    updated_asset = await get_partners_assets_service.update_asset(asset_id, description, type, file)
    return updated_asset