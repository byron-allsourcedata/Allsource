from typing import List

from pydantic import BaseModel


class UnsubscribeRequest(BaseModel):
    reason_unsubscribe: str
