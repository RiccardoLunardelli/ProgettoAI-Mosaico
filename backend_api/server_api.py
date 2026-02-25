from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from uuid import uuid4
from datetime import datetime, timezone, timedelta
from pathlib import Path
import json

from scripts.run_local import run_patch, ARTIFACTS, summarize_template_real_diff, template_apply_patch
from src.validator.validator import load_json
from src.intermediateLayer.postgres_repository import RunRepository, UsersRepository, BatchesRepository

class SignupRequest(BaseModel):
    email: str
    name: str

class LoginRequest(BaseModel):
    email: str

class RunTemplateRequest(BaseModel):
    template_name: str
    validate_only: bool = True

app = FastAPI()

TEMPLATE_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/pv_datas/templates")
DICTIONARIES_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/data/dictionaries")
KB_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/data/kb")
TEMPLATE_BASE_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/data/template_base")
PVS_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/pv_datas/pvs")

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

def get_file_of_artifact(name: str | None, store: str | None, dl: str | None,  artifact, artifact_dir):
    # ritorna contenuto file

    path = artifact_dir / name if name is not None else artifact_dir / store / dl
    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail=f"{artifact} not found!")
    with open(path, "r", encoding="utf-8") as f:
        content = json.load(f)
    if store: 
        return {"store": store, "name": dl, "content": content}
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
    return {"id": str(user_id), "email": payload.email, "name": payload.name, "created_at": created_at}

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
    return get_file_of_artifact(name, None, None, "template", TEMPLATE_DIR)

# get dizionari
@app.get("/dictionaries")
def list_dictionaries():
    return list_artifact("dictionary", DICTIONARIES_DIR)

# preview dizionario
@app.get("/dictionaries/{name}")
def get_dictionary(name: str):
    return get_file_of_artifact(name, None, None, "dictionary", DICTIONARIES_DIR)

# get kb
@app.get("/kb")
def list_kb():
    return list_artifact("kb", KB_DIR)

# preview kb
@app.get("/kb/{name}")
def get_kb(name: str):
    return get_file_of_artifact(name, None, None, "kb", KB_DIR)

# get template base
@app.get("/template_base")
def list_template_base():
    return list_artifact("template_base", TEMPLATE_BASE_DIR)

# preview template base
@app.get("/template_base/{name}")
def get_template_base(name: str):
    return get_file_of_artifact(name, None, None, "template_base", TEMPLATE_BASE_DIR)

# get device_list
@app.get("/device_list")
def list_device_list():
    if not PVS_DIR.exists():
        raise HTTPException(status_code=404, detail="pvs directory not found!")
    items = []
    for store_dir in sorted(PVS_DIR.iterdir()):
        if not store_dir.is_dir():
            continue
        dl = store_dir / "device_list.json"
        if dl.exists():
            items.append({"store": store_dir.name, "path": str(dl.name)})
    return {"device_list": items}

# preview device_list
@app.get("/device_list/{store}/{dl}")
def get_device_list(store: str, dl: str):
    return get_file_of_artifact(None, store, dl, "device_list", PVS_DIR)
    
@app.post("/run/template")
def run_template(payload: RunTemplateRequest):
    input_path = TEMPLATE_DIR / payload.template_name
    if not input_path.exists():
        raise HTTPException(status_code=404, detail="Template not found")
    
    cfg = dict(ARTIFACTS["template"])
    cfg["input_path"] = str(input_path)
    cfg["use_llm"] = False

    report_path = run_patch(cfg, "template", template_apply_patch, summarize_template_real_diff, payload.validate_only)
    report = load_json(report_path)
    ambiguous_count = report.get("metrics", {}).get("ambiguous_count", 0)

    return {
        "status": "ok",
        "run_id": report.get("run_id"),
        "report_path": str(report_path),
        "has_ambiguous": ambiguous_count > 0,
        "ambiguous_count": ambiguous_count
    }
