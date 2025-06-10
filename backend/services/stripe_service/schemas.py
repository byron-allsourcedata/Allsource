from pydantic import BaseModel


class NewStripeCustomer(BaseModel):
    email: str
    full_name: str
