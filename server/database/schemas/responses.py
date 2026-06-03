from pydantic import BaseModel
from typing import Optional

class ErrorResponse(BaseModel):
    detail: str                
    code: Optional[str] = None  
    field: Optional[str] = None 
    hint: Optional[str] = None  
