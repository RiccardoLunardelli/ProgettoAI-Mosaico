from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, UUID4
from uuid import uuid4
from datetime import datetime, timezone, timedelta
from pathlib import Path
import json

from scripts.orchestrator import run_template_pipeline, run_patch, ARTIFACTS, summarize_dictionary_diff, build_dictionary_patch_from_run_report, build_dictionary_suggestions_from_run_report, dictionary_upsert, kb_upsert_mapping, summarize_kb_diff
from src.validator.validator import load_json
from src.intermediateLayer.postgres_repository import RunRepository, UsersRepository, BatchesRepository
from mcp_server.tools.dictionary_tool import _next_versioned_path

class SignupRequest(BaseModel):
    email: str
    name: str

class LoginRequest(BaseModel):
    email: str

class BatchesRequest(BaseModel):
    user_id: UUID4
    total_runs: int

class RunTemplateRequest(BaseModel):
    template_name: str
    validate_only: bool = True

class RunDictionaryRequest(BaseModel):
    dictionary_name: str
    validate_only: bool = True 
    mode: str # run_report / manual
    run_id: str | None = None
    manual_mode: str | None = None
    #dictionary_json: dict | None = None
    patch_json: dict | None = None 

class DictionaryEditRequest(BaseModel):
    dictionary_name: str 
    dictionary_json: dict

class RunKbRequest(BaseModel):
    kb_name: str 
    validate_only: bool = True 
    patch_json: dict


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

user_id = None
batch_id = None

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
    global user_id
    try:
        user = userClass.get_user_by_email(payload.email)
        user_id = user.get("id")
    except KeyError:
        raise HTTPException(status_code=404, detail="User not found!")
    return user

# crea batch
@app.post("/create_batch")
def batches(payload: BatchesRequest):
    global batch_id
    batch_id = uuid4()
    created_at = datetime.now(timezone(timedelta(hours=1))).isoformat()
    status = batchClass._validate_and_status(total_runs=payload.total_runs, completed_runs=0)
    batchClass.create_batch(batch_id, user_id, created_at, status, payload.total_runs, completed_runs=0)
    return {"batch_id": str(batch_id)}

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

# get runs da user id
@app.get("/runs/{user_id}")
def get_runId_by_userId(user_id: str):
    try:
        query = runClass.get_run_id_by_user_id(user_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="user not found!")
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

# run template
@app.post("/run/template")
def run_template(payload: RunTemplateRequest):
    input_path = TEMPLATE_DIR / payload.template_name
    if not input_path.exists():
        raise HTTPException(status_code=404, detail="Template not found")
    
    if not user_id or not batch_id:
        raise HTTPException(status_code=404, detail="user_id or batch_id not exists!")
    
    report_path = run_template_pipeline(template_path=str(input_path), validate_only=payload.validate_only, use_llm=False)
    report = load_json(report_path)
    runClass.save_run(report, user_id, batch_id)
    batchClass.increment_completed_runs(batch_id)
    ambiguous_count = report.get("metrics", {}).get("ambiguous_count", 0)

    return {
        "status": "ok",
        "run_id": report.get("run_id"),
        "report_path": str(report_path),
        "has_ambiguous": ambiguous_count > 0,
        "ambiguous_count": ambiguous_count
    }

# run dizionario
@app.post("/run/dictionary")
def run_dictionary(payload: RunDictionaryRequest):
    input_path = DICTIONARIES_DIR / payload.dictionary_name
    if not input_path.exists():
        raise HTTPException(status_code=404, detail="dictionary file not found")
    
    cfg = dict(ARTIFACTS["dictionary"])
    cfg["input_path"] = str(input_path)

    out_dir = Path("output_dir")
    out_dir.mkdir(parents=True, exist_ok=True)

    # modalità run_report
    if payload.mode == "run_report":
        if not payload.run_id:
            raise HTTPException(status_code=400, detail="run_id required for run_report mode")
        run_report = get_run(payload.run_id)

        # salva report temporaneo
        rr_path = out_dir / "run_report_tmp.json"
        rr_path.write_text(json.dumps(run_report, ensure_ascii=False, indent=2), encoding="utf-8")

        patch = build_dictionary_patch_from_run_report([str(rr_path)], str(input_path))
        patch_path = out_dir / "dictionary_patch.json"
        patch_path.write_text(json.dumps(patch, ensure_ascii=False, indent=2), encoding="utf-8")
        cfg["patch_path"] = str(patch_path)

        suggestions = build_dictionary_suggestions_from_run_report([str(rr_path)], str(input_path))
        suggestions_path = out_dir / "dictionary_suggestions.json"
        suggestions_path.write_text(json.dumps(suggestions, ensure_ascii=False, indent=2), encoding="utf-8")

        report_path = run_patch(cfg, "dictionary", dictionary_upsert, summarize_dictionary_diff, payload.validate_only)

        return {
            "status": "ok",
            "run_id": run_report.get("run_id"),
            "report_path": str(report_path),
            "suggestions_path": str(suggestions_path)
        }

    elif payload.mode == "manual":
        if payload.manual_mode != "patch":
            raise HTTPException(status_code=400, detail="manual mode must be patch")
        if not payload.patch_json:
            raise HTTPException(status_code=400, detail="patch json required")
        
        patch_path = out_dir / "dictionary_patch.json"
        patch_path.write_text(json.dumps(payload.patch_json, ensure_ascii=False, indent=2), encoding="utf-8")
        cfg["patch_path"] = str(patch_path)

        report_path = run_patch(cfg, "dictionary", dictionary_upsert, summarize_dictionary_diff, payload.validate_only)

        return {
            "status": "ok",
            "report_path": str(report_path)
        }

    else:
        raise HTTPException(status_code=400, detail="mode must be run_report or manual")

# modifica json editor inline dizionario
@app.post("/dictionary/edit")
def edit_dictionary(payload: DictionaryEditRequest):
    input_path = DICTIONARIES_DIR / payload.dictionary_name
    if not input_path.exists():
        raise HTTPException(status_code=404, detail="dictionary not found!")

    old_path = input_path
    new_path = _next_versioned_path(old_path)

    new_path.write_text(json.dumps(payload.dictionary_json, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"status": "ok", "new_file": str(new_path)}   

# run kb
@app.post("/run/kb")
def run_kb(payload: RunKbRequest):
    input_path = KB_DIR / payload.kb_name
    if not input_path.exists():
        raise HTTPException(status_code=404, detail="Kb file not exists!")

    cfg = dict(ARTIFACTS["kb"])
    cfg["input_path"] = str(input_path)

    out_dir = Path("output_dir")
    out_dir.mkdir(parents=True, exist_ok=True)

    patch_path = out_dir / "kb_patch.json"
    patch_path.write_text(json.dumps(payload.patch_json, ensure_ascii=False, indent=2), encoding="utf-8")
    cfg["patch_path"] = str(patch_path)

    report_path = run_patch(cfg, "kb", kb_upsert_mapping, summarize_kb_diff, payload.validate_only)

    report = load_json(str(report_path))
    return {
        "status": "ok",
        "run_id": report.get("run_id"),
        "report_path": str(report_path)
    }

