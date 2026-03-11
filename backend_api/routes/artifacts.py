from fastapi import APIRouter, HTTPException, Depends
from pathlib import Path
import json

from backend_api.schemas.artifacts import DictionaryEditRequest, KbEditRequest, TemplateBaseEditRequest
from mcp_server.tools.dictionary_tool import _next_versioned_path, _extract_version_from_path
from mcp_server.core import MCPContext

from src.intermediateLayer.postgres_repository import RunRepository
from backend_api.utils.deps import get_current_user
from scripts.config.config import RUNS_ROOT, generate_run_id
from scripts.report.report import build_run_report
from scripts.summarize_diff.diff import summarize_dictionary_diff, summarize_kb_diff, summarize_template_base_diff

router = APIRouter(prefix="/api")
dsn = "dbname=semantic_ai_mapper user=semantic_user password=semantic_password host=localhost port=5432"
runClass = RunRepository(dsn)

TEMPLATE_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/pv_datas/templates")
DICTIONARIES_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/data/dictionaries")
KB_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/data/kb")
TEMPLATE_BASE_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/data/template_base")
PVS_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/pv_datas/pvs")

def list_artifact(artifact, artifact_dir):
    # restituisce lista dei file presenti in una cartella

    if not artifact_dir.exists():
        raise HTTPException(status_code=404, detail=f"{artifact} directory not found !")

    # artifact = {template_base, dictionary, kb, template}
    if artifact not in ["device_list", "enrich_device_list"]:
        files = sorted([p.name for p in artifact_dir.glob("*.json")])
        return files
    
    # artifact = device_list
    elif artifact == "device_list":
        items = []
        for store_dir in sorted(artifact_dir.iterdir()):
            if not store_dir.is_dir():
                continue
            files = "device_list.json"
            if files:
                items.append({"store": store_dir.name, "file":  files })
        return {"device_list": items}
    
    # artifact = enrich_device_list
    else:
        items = []
        for store_dir in sorted(artifact_dir.iterdir()):
            if not store_dir.is_dir():
                continue
            files = list(store_dir.glob("device_list_context_*.json"))
            for f in files:
                items.append({"store": store_dir.name,"file": f.name})

        if not items:
            raise HTTPException(status_code=404, detail=f"{artifact} not exists")

        return {"enriched_device_list": items}

def get_file_of_artifact(name: str | None, store: str | None, dl: str | None,  artifact, artifact_dir):
    # ritorna contenuto file

    path = artifact_dir / name if name is not None else artifact_dir / store / dl

    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail=f"{artifact} not found!")
    
    with open(path, "r", encoding="utf-8") as f:
        content = json.load(f)

    if store: 
        return {"store": store, "name": dl, "content": content}
    
    return content

def editor_json_inline(file_name, file_json, file_dir, artifact, user_id):
    # modifica json direttamente da editor

    input_path = file_dir / file_name

    if not input_path.exists():
        raise HTTPException(status_code=404, detail=f"{artifact} file not exists!")
    
    old_payload = json.loads(input_path.read_text(encoding="utf-8"))

    new_path = _next_versioned_path(input_path)
    new_version = _extract_version_from_path(new_path)
    
    # validazione 
    ctx = MCPContext(repo_root=".")
    try:
        if artifact == "dictionary":
            ctx.schema_validate("dictionary", file_json)
            file_json["dictionary_version"] = new_version
        elif artifact == "kb":
            ctx.schema_validate("kb", file_json)
            file_json["kb_version"] = new_version
        elif artifact == "template_base":
            ctx.schema_validate("template_base", file_json)
            file_json["template_base_version"] = new_version
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Payload not valid: {e}!")

    # build run report e salvataggio in db
    run_id = generate_run_id()
    run_dir = RUNS_ROOT / run_id 
    run_dir.mkdir(parents=True, exist_ok=True)

    if artifact == "dictionary":
        diff = summarize_dictionary_diff(old_payload, file_json)
        schema_versions = {"dictionary_version": file_json.get("dictionary_version")}
        dictionary_payload = file_json
        kb_payload = None
        template_base_path = None
        template_base_version = None

    elif artifact == "kb":
        diff = summarize_kb_diff(old_payload, file_json)
        schema_versions = {"kb_version": file_json.get("kb_version")}
        dictionary_payload = None
        kb_payload = file_json
        template_base_path = None
        template_base_version = None

    # template_base
    else:  
        diff = summarize_template_base_diff(old_payload, file_json)
        schema_versions = {"template_base_version": file_json.get("template_base_version")}
        dictionary_payload = None
        kb_payload = None
        template_base_path = str(new_path)
        template_base_version = file_json.get("template_base_version")

    run_report = build_run_report(
        cfg={},
        run_id=run_id,
        artifact_type=artifact,
        input_path=str(input_path),
        output_path=str(new_path),
        diff=diff,
        schema_versions=schema_versions,
        committed=True,
        status="success",
        validation_block={"status": "ok", "errors": [], "warnings": []},
        mr=None,
        dictionary_payload=dictionary_payload,
        kb_payload=kb_payload,
        template_base_path=template_base_path,
        template_base_version=template_base_version,
        llm_attempt=None,
        actions_payload=None
    )

    report_path = run_dir / "run_report.json"
    diff_report = run_report.get("diff_summary").get("changed_paths")

    # controlla se ci sono differenze
    if len(diff_report) > 0:
        new_path.write_text(json.dumps(file_json, ensure_ascii=False, indent=2), encoding="utf-8")
    else:
        new_path = input_path

    # scrive run report
    report_path.write_text(json.dumps(run_report, ensure_ascii=False, indent=2), encoding="utf-8")

    # salva nel db
    runClass.save_run(run_report, user_id)

    return {"status": "ok", "new_file": str(new_path), "run_id": run_id, "report_path": str(report_path), "diff": diff_report}

#----LIST & PREVIEW----
@router.get("/templates")
def list_templates(user = Depends(get_current_user)):
    return list_artifact("template", TEMPLATE_DIR)

@router.get("/templates/{name}")
def get_template(name: str, user = Depends(get_current_user)):
    return get_file_of_artifact(name, None, None, "template", TEMPLATE_DIR)

@router.get("/dictionaries")
def list_dictionaries(user = Depends(get_current_user)):
    return list_artifact("dictionary", DICTIONARIES_DIR)

@router.get("/dictionaries/{name}")
def get_dictionary(name: str, user = Depends(get_current_user)):
    return get_file_of_artifact(name, None, None, "dictionary", DICTIONARIES_DIR)

@router.get("/kb")
def list_kb(user = Depends(get_current_user)):
    return list_artifact("kb", KB_DIR)

@router.get("/kb/{name}")
def get_kb(name: str, user = Depends(get_current_user)):
    return get_file_of_artifact(name, None, None, "kb", KB_DIR)

@router.get("/template_base")
def list_template_base(user = Depends(get_current_user)):
    return list_artifact("template_base", TEMPLATE_BASE_DIR)

@router.get("/template_base/{name}")
def get_template_base(name: str, user = Depends(get_current_user)):
    return get_file_of_artifact(name, None, None, "template_base", TEMPLATE_BASE_DIR)

@router.get("/device_list")
def list_device_list(user = Depends(get_current_user)):
    return list_artifact("device_list", PVS_DIR) 

@router.get("/device_list/{store}/{dl}")
def get_device_list(store: str, dl: str, user = Depends(get_current_user)):
    return get_file_of_artifact(None, store, dl, "device_list", PVS_DIR)

@router.get("/enrich_device_list")
def list_enrich_device_list(user = Depends(get_current_user)):
    return list_artifact("enrich_device_list", PVS_DIR)

@router.get("/enrich/device_list/{store}/{dl}")
def get_enrich_device_list(store: str, dl: str, user = Depends(get_current_user)):
    return get_file_of_artifact(None, store, dl, "enrich_device_list", PVS_DIR)

#----EDIT----
@router.post("/dictionary/edit")
def edit_dictionary(payload: DictionaryEditRequest, user = Depends(get_current_user)):
    return editor_json_inline(payload.dictionary_name, payload.dictionary_json, DICTIONARIES_DIR, "dictionary", user["sub"])

@router.post("/kb/edit")
def edit_kb(payload: KbEditRequest, user = Depends(get_current_user)):
    return editor_json_inline(payload.kb_name, payload.kb_json, KB_DIR, "kb", user["sub"])

@router.post("/template_base/edit")
def edit_template_base(payload: TemplateBaseEditRequest, user = Depends(get_current_user)):
    return editor_json_inline(payload.template_base_name, payload.template_base_json, TEMPLATE_BASE_DIR, "template_base", user["sub"])