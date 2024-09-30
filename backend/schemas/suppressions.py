from pydantic import BaseModel
from typing import Optional, List, Union, Any

class SuppressionRequest(BaseModel):
    suppression_list_ids: Optional[List[int]] = None
    data: Optional[Union[str, List[Union[str, Any]]]] = None
    