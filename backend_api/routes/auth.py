from fastapi import APIRouter, HTTPException, Response, Depends
from uuid import uuid4
from datetime import datetime, timezone, timedelta

from backend_api.schemas.auth import SignupRequest, LoginRequest
from src.intermediateLayer.postgres_repository import UsersRepository
from backend_api.utils.jwt_utils import jwt_token
from backend_api.utils.deps import get_current_user

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

    # creazione token
    token = jwt_token(str(user_id), payload.email, "signup", None)

    userClass.create_user(user_id=user_id, email=payload.email, name=payload.name, password=payload.password, created_at=created_at)
    return token

@router.post("/login")
def login(payload: LoginRequest):
    try:
        user = userClass.verify_user_password(payload.email, payload.password)
        if not user:
            raise HTTPException(status_code=401, detail="invalid credentials")

        token = jwt_token(None, payload.email, "login", user)
    except KeyError as error:
        print(error)

    return token

@router.post("/logout")
def logout(user = Depends(get_current_user)):
    resp = Response(content='{"status":"ok"}', media_type="application/json")
    resp.delete_cookie("token")
    return resp

@router.get("/checkauth")
def checkAuth(user = Depends(get_current_user)):
    # controlla token
    return {"detail": True}


    

