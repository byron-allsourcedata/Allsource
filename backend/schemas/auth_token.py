from typing import Optional, Union

from pydantic import BaseModel


class Token(BaseModel):
    id: int
