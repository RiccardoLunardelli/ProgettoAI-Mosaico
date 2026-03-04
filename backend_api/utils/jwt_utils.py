import os 
import jwt
from datetime import datetime, timezone, timedelta

JWT_SECRET = os.getenv("JWT_SECRET", "i9Y2@8gqw^C$%SfBia9ZUl!c^r9yM@Y4&z6T&4by@0%jgr0ZpmEsuthA#3X8Fu!c!bu") # firma del token
JWT_ALG = "HS256"
JWT_EXPIRES_HOURS = int(os.getenv("WT_EXPIRES_HOURS", "24")) # durata del token

def create_token(user_id: str, email: str) -> str:
    # crea token jwt

    now = datetime.now(timezone(timedelta(hours=1)))
    payload = {
        "sub": user_id, # sub = id utente
        "email": email,
        "iat": int(now.timestamp()),    # iat = quando il token è stato creato
        "exp": int((now + timedelta(hours=JWT_EXPIRES_HOURS)).timestamp()) # exp = quando scade il token
    }

    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def decode_token(token: str):
    # decoda il token

    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])