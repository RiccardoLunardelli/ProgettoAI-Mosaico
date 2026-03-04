from fastapi import APIRouter, HTTPException, FastAPI
from uuid import uuid4
from datetime import datetime, timezone, timedelta

from backend_api.schemas.auth import SignupRequest, LoginRequest
from src.intermediateLayer.postgres_repository import UsersRepository


router = APIRouter()


dsn = "dbname=semantic_ai_mapper user=semantic_user password=semantic_password host=localhost port=5432"
userClass = UsersRepository(dsn)

@router.post("/signup")
def signup(payload: SignupRequest):
    try:
        _ = userClass.get_user_by_email(payload.email)
        raise HTTPException(status_code=409, detail="email already exists!")
    except KeyError:
        pass
    user_id = uuid4()
    created_at = datetime.now(timezone(timedelta(hours=1)))
    userClass.create_user(user_id=user_id, email=payload.email, name=payload.name, password=payload.password, created_at=created_at)
    return {"id": str(user_id), "email": payload.email, "name": payload.name, "created_at": created_at.isoformat()}

@router.post("/login")
def login(payload: LoginRequest):
    user = userClass.verify_user_password(payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="invalid credentials")

    return {"user": user}

