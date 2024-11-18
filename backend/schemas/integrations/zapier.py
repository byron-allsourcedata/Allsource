from pydantic import BaseModel

class ZapierHookConnect(BaseModel):
    hookUrl: str