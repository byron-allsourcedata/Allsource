from pydantic import BaseModel, Field
from typing import Optional, List, Union, Any

class SuppressionRequest(BaseModel):
    suppression_list_id: Optional[Union[int, List[int]]] = None
    data: Optional[Union[str, List[Union[str, Any]]]] = None
    
class CollectionRuleRequest(BaseModel):
    page_views: int = Field(...)
    seconds: int = Field(...)
