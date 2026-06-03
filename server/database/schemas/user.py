from datetime import datetime
from pydantic import BaseModel
from sqlalchemy import Enum


class UserCreate(BaseModel):
    username: str
    password: str
    
class UserResponse(BaseModel):
    token: str

    class Config:
        from_attributes = True

class LoginForm(BaseModel):
    username: str
    password: str

class UserErrorResponse(BaseModel):
    message: str

    class Config:
        from_attributes = True

class RegisterSuccessMessage(BaseModel):
    message: str

    class Config:
        from_attributes = True

class TokenRefreshRequest(BaseModel):
    refresh_token: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str

    class Config:
        from_attributes = True

class ResponseUser(BaseModel):
    id: int
    username: str

class TokenPayload(BaseModel):
    sub: str 
    exp: datetime | None = None

class AuthResponse(BaseModel):
    user: ResponseUser
    token: TokenResponse

class UserStatus(Enum):
    ADMIN = 1
    REGULAR = 2
    PREMIUM = 3

class UserOut(BaseModel):
    username: str

    class Config:
        from_attributes: True