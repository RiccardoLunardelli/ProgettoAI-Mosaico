import os 
import jwt
from datetime import datetime, timezone, timedelta
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

from typing import Dict, Any

JWT_SECRET = os.getenv("JWT_SECRET", "i9Y2@8gqw^C$%SfBia9ZUl!c^r9yM@Y4&z6T&4by@0%jgr0ZpmEsuthA#3X8Fu!c!bu") # firma del token
JWT_ALG = "HS256"
JWT_EXPIRES_HOURS = int(os.getenv("WT_EXPIRES_HOURS", "24")) # durata del token

def jwt_token(user_id: str | None, email: str | None, action, user: Dict[str, Any] | None, name: str | None):
    # funzione principale: crea token + lo setta nei cookie

    uid = user_id or (user["id"] if user else None)
    token = create_token(str(uid), email, name)

    payload = {"action": action}
    if user:
        payload["user"] = jsonable_encoder(user)

    resp = JSONResponse(content=payload)
    resp.set_cookie(key="token", value=token, httponly=True, samesite="lax", secure=False, max_age=60 * 60 * 24)
    return resp

def create_token(user_id: str, email: str, name: str) -> str:
    # token jwt

    now = datetime.now(timezone(timedelta(hours=1)))
    payload = {
        "sub": user_id, # sub = id utente
        "email": email,
        "name": name,
        "iat": int(now.timestamp()),    # iat = quando il token è stato creato
        "exp": int((now + timedelta(hours=JWT_EXPIRES_HOURS)).timestamp()) # exp = quando scade il token
    }

    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def decode_token(token: str):
    # decoda il token

    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])