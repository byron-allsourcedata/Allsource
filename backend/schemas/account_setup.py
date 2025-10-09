from pydantic import BaseModel


class PotentialTeamMembers(BaseModel):
    email: str
    full_name: str
    company_name: str
    id: int
