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


@router.delete("/{id}/", response_model=PartnersAssetsInfoResponse)
@router.delete("/{id}", response_model=PartnersAssetsInfoResponse)
async def delete_asset(
                    id: str, 
                    get_partners_assets_service: PartnersAssetService = Depends(get_partners_assets_service)):
    return PartnersAssetsInfoResponse(status=get_partners_assets_service.delete_asset(id))


# @router.put("", response_model=PartnersAssetsInfoResponse)
# async def update_asset(data: any, asset_id: str = Query(...), 
#                      get_partners_assets_service: PartnersAssetService  = Depends(get_partners_assets_service)):
#     return PartnersAssetsInfoResponse(status=get_partners_assets_service.update_asset(asset_id, data))


@router.post("", response_model=PartnersAssetsInfoResponse)
@router.post("/", response_model=PartnersAssetsInfoResponse)
async def create_asset(
                    file: UploadFile = File(...),
                    description: str = Form(...), 
                    get_partners_assets_service: PartnersAssetService  = Depends(get_partners_assets_service)):

    file_contents = await file.read()
    file_name = file.filename
    print(f"Received file: {file_name}")
    print(f"Description: {description}")

    data = {"file_name": file_name, "description": description}
    status = get_partners_assets_service.create_asset()

    return PartnersAssetsInfoResponse(status=status)