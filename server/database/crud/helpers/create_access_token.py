from datetime import datetime, timedelta
import os
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
from server.database.database import get_db
from server.database.models.user import User
from server.database.schemas.user import TokenPayload
from jose import jwt, JWTError

load_dotenv()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/user/login-user")

SECRET_KEY = os.getenv("SECRET_KEY", "")
ALGORITHM = os.getenv("ALGORITHM", "")

def create_access_token(payload: TokenPayload, expires_delta: timedelta) -> str:
    to_encode = payload.model_dump()
    to_encode["exp"] = datetime.now() + expires_delta
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_authenticated_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User: 
    try: 
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM]) 
        username: int = payload.get("sub") 
        if username is None: raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") 
    except JWTError: 
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") 
    
    user = db.query(User).filter(User.username == username).first() 
    if not user: 
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found") 
    return user