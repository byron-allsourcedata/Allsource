from pydantic import BaseModel

class Customer(BaseModel):
    email: str
    first_name: str | None
    last_name: str | None
    phone: str | None

class IntegrationCreditional(BaseModel):
    shop_domain: str
    access_token: str