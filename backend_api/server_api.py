from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from uuid import uuid4
from datetime import datetime, timezone, timedelta

from src.intermediateLayer.postgres_repository import RunRepository, UsersRepository, BatchesRepository

class SignupRequest(BaseModel):
    email: str
    name: str

class LoginRequest(BaseModel):
    email: str

app = FastAPI()

dsn = "dbname=semantic_ai_mapper user=semantic_user password=semantic_password host=localhost port=5432"
runClass = RunRepository(dsn)
userClass = UsersRepository(dsn)
batchClass = BatchesRepository(dsn)

#-----ENDOPOINT-------
@app.get("/")
def root():
    return {"message": "ok"}

# signup
@app.post("/signup")
def signup(payload: SignupRequest):
    try:
        _ = userClass.get_user_by_email(payload.email)
        raise HTTPException(status_code=409, detail="email already exists!")
    except KeyError:
        pass
    user_id = uuid4()
    created_at = datetime.now(timezone(timedelta(hours=1))).isoformat()
    userClass.create_user(user_id=user_id, email=payload.email, name=payload.name, created_at=created_at)
    return {"id": str(user_id), "emai": payload.email, "name": payload.name, "created_at": created_at}

# login
@app.post("/login")
def login(payload: LoginRequest):
    try:
        user = userClass.get_user_by_email(payload.email)
    except KeyError:
        raise HTTPException(status_code=404, detail="User not found!")
    return user

# get lista run db
@app.get("/runs/ids")
def get_run_ids():
    return {"run_ids": runClass.get_all_run_ids()}

# get run specifica
@app.get("/run_id/{run_id}")
def get_run(run_id: str):
    try:
        query = runClass.get_run(run_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="run not found!")
    return query
