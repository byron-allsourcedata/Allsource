from pydantic import BaseModel


class PrivacyPolicyRequest(BaseModel):
    version_privacy_policy: str
