from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from uuid import uuid4
from datetime import datetime, timezone, timedelta
from pathlib import Path
import json

from src.intermediateLayer.postgres_repository import RunRepository, UsersRepository, BatchesRepository

class SignupRequest(BaseModel):
    email: str
    name: str

class LoginRequest(BaseModel):
    email: str

app = FastAPI()

TEMPLATE_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/pv_datas/templates")
DICTIONARIES_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/data/dictionaries")
KB_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/data/kb")
TEMPLATE_BASE_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/data/template_base")

dsn = "dbname=semantic_ai_mapper user=semantic_user password=semantic_password host=localhost port=5432"
runClass = RunRepository(dsn)
userClass = UsersRepository(dsn)
batchClass = BatchesRepository(dsn)

def list_artifact(artifact, artifact_dir):
    # restituisce lista dei file presenti in una cartella

    if not artifact_dir.exists():
        raise HTTPException(status_code=404, detail=f"{artifact} directory not found !")
    files = sorted([p.name for p in artifact_dir.glob("*.json")])
    return {f"{artifact}": files}

def get_file_of_artifact(name: str, artifact, artifact_dir):
    # ritorna contenuto file

    path = artifact_dir / name
    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail=f"{artifact} not found!")
    with open(path, "r", encoding="utf-8") as f:
        content = json.load(f)
    return {"name": name, "content": content}

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

# get templates
@app.get("/templates")
def list_templates():
    return list_artifact("template", TEMPLATE_DIR)

# preview template
@app.get("/templates/{name}")
def get_template(name: str):
    return get_file_of_artifact(name, "template", TEMPLATE_DIR)

# get dizionari
@app.get("/dictionaries")
def list_dictionaries():
    return list_artifact("dictionary", DICTIONARIES_DIR)

# preview dizionario
@app.get("/dictionaries/{name}")
def get_dictionary(name: str):
    return get_file_of_artifact(name, "dictionary", DICTIONARIES_DIR)

# get kb
@app.get("/kb")
def list_kb():
    return list_artifact("kb", KB_DIR)

# preview kb
@app.get("/kb/{name}")
def get_kb(name: str):
    return get_file_of_artifact(name, "kb", KB_DIR)

# get template base
@app.get("/template_base")
def list_template_base():
    return list_artifact("template_base", TEMPLATE_BASE_DIR)

@app.get("/template_base/{name}")
def get_template_base(name: str):
    return get_file_of_artifact(name, "template_base", TEMPLATE_BASE_DIR)