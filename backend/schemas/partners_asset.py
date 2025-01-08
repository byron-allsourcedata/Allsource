from pydantic import BaseModel

class PartnersAssetResponse(BaseModel):
    id: int
    title: str
    type: str
    preview_url: str
    file_url: str
    file_extension: str
    file_size: str