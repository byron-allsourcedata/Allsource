from pydantic import BaseModel


class FilledWhitelabelSettingsSchema(BaseModel):
    brand_name: str
    brand_logo_url: str
