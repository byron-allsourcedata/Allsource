from pydantic import BaseModel


class PotentialTeamMembers(BaseModel):
    email: str
    full_name: str
