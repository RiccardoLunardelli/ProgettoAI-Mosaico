from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, UUID4
from uuid import uuid4
from datetime import datetime, timezone, timedelta
from pathlib import Path
import json
from  typing import Any

from scripts.orchestrator import run_template_pipeline, run_patch, ARTIFACTS, summarize_dictionary_diff, build_dictionary_patch_from_run_report, build_dictionary_suggestions_from_run_report, dictionary_upsert, kb_upsert_mapping, summarize_kb_diff, template_apply_patch, summarize_template_base_diff, run_device_list
from src.validator.validator import load_json
from src.intermediateLayer.postgres_repository import RunRepository, UsersRepository, BatchesRepository
from mcp_server.tools.dictionary_tool import _next_versioned_path
from mcp_server.core import MCPContext

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

class KbEditRequest(BaseModel):
    kb_name: str
    kb_json: dict

class RunTemplateBaseRequest(BaseModel):
    template_base_name: str 
    validate_only: bool = True 
    patch_json: dict

class TemplateBaseEditRequest(BaseModel):
    template_base_name: str 
    template_base_json: dict

class RunDeviceListRequest(BaseModel):
    store: str
    device_list_name: str
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
user_id = None
batch_id = None

def list_artifact(artifact, artifact_dir):
    # restituisce lista dei file presenti in una cartella

    if not artifact_dir.exists():
            raise HTTPException(status_code=404, detail=f"{artifact} directory not found !")

    # artifact = {template_base, dictionary, kb, template}
    if artifact != "device_list":
        files = sorted([p.name for p in artifact_dir.glob("*.json")])
        return {f"{artifact}": files}
    # artifact = device_list
    else:
        items = []
        for store_dir in sorted(artifact_dir.iterdir()):
            if not store_dir.is_dir():
                continue
            dl = store_dir / "device_list.json"
            if dl.exists():
                items.append({"store": store_dir.name, "path": str(dl.name)})
        return {"device_list": items}

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

def editor_json_inline(file_name, file_json, file_dir, artifact):
    # modifica json direttamente da editor

    input_path = file_dir / file_name

    if not input_path.exists():
        raise HTTPException(status_code=404, detail=f"{artifact} file not exists!")
    
    old_path = input_path
    new_path = _next_versioned_path(old_path)

    # validazione 
    ctx = MCPContext(repo_root=".")
    try:
        if artifact == "dictionary":
            ctx.schema_validate("dictionary", file_json)
        elif artifact == "kb":
            ctx.schema_validate("kb", file_json)
        elif artifact == "template_base":
            ctx.schema_validate("template_base", file_json)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Payload not valid: {e}!")
    

    new_path.write_text(json.dumps(file_json, ensure_ascii=False, indent=2), encoding="utf-8")

    return {"status": "ok", "new_file": str(new_path)}

def apply_patch(input_path: str | None, file_name: str | None, patch_json: dict | None, upsert: Any | None, summarize: Any | None, artifact: str, patch_file_name: str | None, validate_only: bool, run_id: str | None, mode: str | None, manual_mode: str | None):
    # applica le patch, genera report e salva nel db

    if not input_path.exists():
        raise HTTPException(status_code=404, detail=f"{file_name} file not exists!")
        
    if not user_id or not batch_id:
        raise HTTPException(status_code=404, detail="user_id or batch_id not exists!")
        
    cfg = dict(ARTIFACTS[artifact])
    cfg["input_path"] = str(input_path)
    
    # artifact = template_base || kb || dictionary
    if artifact != "device_list" and artifact != "template":
        out_dir = Path("output_dir")
        out_dir.mkdir(parents=True, exist_ok=True)

        if artifact == "dictionary":
            # modalità run_report
            if mode == "run_report":
                if not run_id:
                    raise HTTPException(status_code=400, detail="run_id required for run_report mode")
                run_report = get_run(run_id)

                # salva report temporaneo
                rr_path = out_dir / "run_report_tmp.json"
                rr_path.write_text(json.dumps(run_report, ensure_ascii=False, indent=2), encoding="utf-8")

                # crea patch per dizionario da run report
                patch = build_dictionary_patch_from_run_report([str(rr_path)], str(input_path))
                patch_path = out_dir / "dictionary_patch.json"
                patch_path.write_text(json.dumps(patch, ensure_ascii=False, indent=2), encoding="utf-8")
                cfg["patch_path"] = str(patch_path)

                # crea suggerimenti concetti per run report
                suggestions = build_dictionary_suggestions_from_run_report([str(rr_path)], str(input_path))
                suggestions_path = out_dir / "dictionary_suggestions.json"
                suggestions_path.write_text(json.dumps(suggestions, ensure_ascii=False, indent=2), encoding="utf-8")

                report_path = run_patch(cfg, "dictionary", dictionary_upsert, summarize_dictionary_diff, validate_only)
                report = load_json(str(report_path))
                
                # salvataggio nel db
                runClass.save_run(report, user_id, batch_id) # run
                batchClass.increment_completed_runs(batch_id) # incrementa batch

                return {
                    "status": "ok",
                    "run_id": run_report.get("run_id"),
                    "report_path": str(report_path),
                    "suggestions_path": str(suggestions_path)
                }

            elif mode == "manual":
                if manual_mode != "patch":
                    raise HTTPException(status_code=400, detail="manual mode must be patch")
                if not patch_json:
                    raise HTTPException(status_code=400, detail="patch json required")
                
                patch_path = out_dir / "dictionary_patch.json"
                patch_path.write_text(json.dumps(patch_json, ensure_ascii=False, indent=2), encoding="utf-8")
                cfg["patch_path"] = str(patch_path)

                report_path = run_patch(cfg, "dictionary", dictionary_upsert, summarize_dictionary_diff, validate_only)
                report = load_json(str(report_path))

                runClass.save_run(report, user_id, batch_id)
                batchClass.increment_completed_runs(batch_id)

                return {
                    "status": "ok",
                    "report_path": str(report_path)
                }

            else:
                raise HTTPException(status_code=400, detail="mode must be run_report or manual")


        # scrive patch file
        patch_path = out_dir / patch_file_name
        patch_path.write_text(json.dumps(patch_json, ensure_ascii=False, indent=2), encoding="utf-8")
        cfg["patch_path"] = str(patch_path)

        report_path = run_patch(cfg, artifact, upsert, summarize, validate_only)
        report = load_json(str(report_path))

        # salvataggio nel db
        runClass.save_run(report, user_id, batch_id)
        batchClass.increment_completed_runs(batch_id)

        return {"status": "ok", "run_id": report.get("run_id"), "report_path": str(report_path)}
    
    # artifact = template
    elif artifact == "template":
        report_path = run_template_pipeline(template_path=str(input_path), validate_only=validate_only, use_llm=False)
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
    
    # artifact = device_list
    else:
        report_path = run_device_list(cfg, validate_only)
        report = load_json(str(report_path))

        # salvataggio nel db
        runClass.save_run(report, user_id, batch_id)
        batchClass.increment_completed_runs(batch_id)

        return {"status": "ok", "run_id": report.get("run_id"), "report_path": str(report_path), "warning": report.get("validation", {}).get("warnings")}


#-----ENDPOINT-------
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
    userClass.create_user(user_id=user_id, email=payload.email, name=payload.name, created_at=created_at) # crea user nel db
    return {"id": str(user_id), "email": payload.email, "name": payload.name, "created_at": created_at}

# login
@app.post("/login")
def login(payload: LoginRequest):
    global user_id
    try:
        user = userClass.get_user_by_email(payload.email) # recupera user da db con email
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
    batchClass.create_batch(batch_id, payload.user_id, created_at, status, payload.total_runs, completed_runs=0) # crea batch nel db
    return {"batch_id": str(batch_id)}

# get lista run db
@app.get("/runs/ids")
def get_run_ids():
    return {"run_ids": runClass.get_all_run_ids()}  # recupera tutte le run dal dbs

# get run specifica
@app.get("/run_id/{run_id}")
def get_run(run_id: str):
    try:
        query = runClass.get_run(run_id) # preview di una run
    except KeyError:
        raise HTTPException(status_code=404, detail="run not found!")
    return query

# get runs da user id
@app.get("/runs/{user_id}")
def get_runId_by_userId(user_id: str):
    try:
        query = runClass.get_run_id_by_user_id(user_id) # ottiene le run di user specifico
    except KeyError:
        raise HTTPException(status_code=404, detail="user not found!")
    return query

# get templates
@app.get("/templates")
def list_templates():
    return list_artifact("template", TEMPLATE_DIR) # lista dei template in pvs/templates

# preview template
@app.get("/templates/{name}")
def get_template(name: str):
    return get_file_of_artifact(name, None, None, "template", TEMPLATE_DIR) # preview del template

# get dizionari
@app.get("/dictionaries")
def list_dictionaries():
    return list_artifact("dictionary", DICTIONARIES_DIR)    # lista dei dizionari da /data/dictionaries

# preview dizionario
@app.get("/dictionaries/{name}")
def get_dictionary(name: str):
    return get_file_of_artifact(name, None, None, "dictionary", DICTIONARIES_DIR) # preview del dizionario

# get kb
@app.get("/kb")
def list_kb():
    return list_artifact("kb", KB_DIR) # lista kb da data/kb/

# preview kb
@app.get("/kb/{name}")
def get_kb(name: str):
    return get_file_of_artifact(name, None, None, "kb", KB_DIR) # preview kb

# get template base
@app.get("/template_base")
def list_template_base():
    return list_artifact("template_base", TEMPLATE_BASE_DIR) # lista template base da data/template_base

# preview template base
@app.get("/template_base/{name}")
def get_template_base(name: str):
    return get_file_of_artifact(name, None, None, "template_base", TEMPLATE_BASE_DIR) # preview template base

# get device_list
@app.get("/device_list")
def list_device_list():
    return list_artifact("device_list", PVS_DIR)    # lista store

# preview device_list
@app.get("/device_list/{store}/{dl}")
def get_device_list(store: str, dl: str):
    return get_file_of_artifact(None, store, dl, "device_list", PVS_DIR) # preview device_list

# run template
@app.post("/run/template")
def run_template(payload: RunTemplateRequest):
    input_path = TEMPLATE_DIR / payload.template_name
    return apply_patch(input_path, payload.template_name, None, None, None, "template", None, payload.validate_only, None, None, None)

# run dizionario
@app.post("/run/dictionary")
def run_dictionary(payload: RunDictionaryRequest):
    input_path = DICTIONARIES_DIR / payload.dictionary_name
    return apply_patch(input_path, payload.dictionary_name, payload.patch_json, dictionary_upsert, summarize_dictionary_diff, "dictionary", "dictionary_patch.json", payload.validate_only, payload.run_id, payload.mode, payload.manual_mode) 

# modifica json editor inline dizionario
@app.post("/dictionary/edit")
def edit_dictionary(payload: DictionaryEditRequest):
    return editor_json_inline(payload.dictionary_name, payload.dictionary_json, DICTIONARIES_DIR, "dictionary")  # editor inline dizionario

# run kb
@app.post("/run/kb")
def run_kb(payload: RunKbRequest):
    input_path = KB_DIR / payload.kb_name
    return apply_patch(input_path, payload.kb_name, payload.patch_json, kb_upsert_mapping, summarize_kb_diff, "kb", "kb_patch.json", payload.validate_only, None, None, None)

# modifica json editor inline kb
@app.post("/kb/edit")
def edit_kb(payload: KbEditRequest):
    return editor_json_inline(payload.kb_name, payload.kb_json, KB_DIR, "kb")

# run template base
@app.post("/run/template_base")
def run_template_base(payload: RunTemplateBaseRequest):
    input_path = TEMPLATE_BASE_DIR / payload.template_base_name
    return apply_patch(input_path, payload.template_base_name, payload.patch_json, template_apply_patch, summarize_template_base_diff, "template_base", "template_base_patch.json", payload.validate_only, None, None, None)

# modifica json editor inline template base
@app.post("/template_base/edit")
def edit_template_base(payload: TemplateBaseEditRequest):
    return editor_json_inline(payload.template_base_name, payload.template_base_json, TEMPLATE_BASE_DIR, "template_base")

# run device list
@app.post("/run/device_list")
def run_deviceList(payload: RunDeviceListRequest):
    input_path = PVS_DIR / payload.store / payload.device_list_name
    return apply_patch(input_path, payload.device_list_name, None, None, None, "device_list", None, payload.validate_only, None, None, None)