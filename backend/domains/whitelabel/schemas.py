from pydantic import BaseModel


class WhitelabelSettingsSchema(BaseModel):
    brand_name: str | None = None
    brand_logo_url: str | None = None
    brand_icon_url: str | None = None
    meeting_url: str | None = None


class FilledWhitelabelSettingsSchema(BaseModel):
    brand_name: str
    brand_logo_url: str
