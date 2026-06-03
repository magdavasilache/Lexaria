from typing import Optional
from fastapi import HTTPException

def raise_http_error(status_code: int, detail: str, code: Optional[str] = None,
                     field: Optional[str] = None, hint: Optional[str] = None):

    payload = {"detail": detail}
    if code:
        payload["code"] = code
    if field:
        payload["field"] = field
    if hint:
        payload["hint"] = hint

    raise HTTPException(status_code=status_code, detail=payload)