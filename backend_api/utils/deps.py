from fastapi import Cookie, HTTPException
import jwt 
from backend_api.utils.jwt_utils import decode_token

def get_current_user(token: str | None = Cookie(default=None)):
    if not token: 
        raise HTTPException(status_code=401, detail="missing token")
    try:
        return decode_token(token) 
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="invalid token")