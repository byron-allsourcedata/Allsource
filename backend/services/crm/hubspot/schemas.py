from __future__ import annotations

from typing import List

from pydantic import BaseModel


class NewContactCRM(BaseModel):
    email: str
    lastname: str

class NewContactRequest(BaseModel):
    associations: List[Association]
    properties: NewContactCRM

Association = dict