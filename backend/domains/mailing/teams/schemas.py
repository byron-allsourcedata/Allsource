from pydantic import BaseModel


class TeamInvitationTemplateSchema(BaseModel):
    full_name: str
    link: str
    company_name: str | None
