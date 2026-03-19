from fastapi import APIRouter, HTTPException, Depends
from pathlib import Path
import json
import yaml
from uuid import UUID

from backend_api.schemas.artifacts import DictionaryEditRequest, KbEditRequest, TemplateBaseEditRequest
from mcp_server.tools.dictionary_tool import _next_versioned_path, _extract_version_from_path
from mcp_server.core import MCPContext

from src.intermediateLayer.postgres_repository import RunRepository, ArtifactRepository, Stores, Template
from backend_api.routes.runs import _register_artifact_from_path
from backend_api.utils.deps import get_current_user
from scripts.config.config import RUNS_ROOT, generate_run_id
from scripts.report.report import build_run_report
from scripts.summarize_diff.diff import summarize_dictionary_diff, summarize_kb_diff, summarize_template_base_diff

router = APIRouter(prefix="/api")
dsn = "dbname=semantic_ai_mapper user=semantic_user password=semantic_password host=localhost port=5432"
runClass = RunRepository(dsn)
artifactClass = ArtifactRepository(dsn)
storeClass = Stores(dsn)
templateClass = Template(dsn)

TEMPLATE_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/pv_datas/templates")
DICTIONARIES_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/data/dictionaries")
KB_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/data/kb")
TEMPLATE_BASE_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/data/template_base")
PVS_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/pv_datas/pvs")
CONFIG_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/config")

"""
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
"""

"""
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
"""
    
def editor_json_inline(id: str, file: str | dict, file_dir, artifact: str, user_id: str):
    # modifica json direttamente da editor

    file_name = artifactClass.get_artifact_name_by_id(id)
    input_path = file_dir / file_name

    if not input_path.exists():
        raise HTTPException(status_code=404, detail=f"{artifact} file not exists!")
    
    # old_payload
    if artifact == "config":
        old_payload = yaml.safe_load(input_path.read_text(encoding="utf-8")) or {}
    else:
        old_payload = json.loads(input_path.read_text(encoding="utf-8"))


    new_path = _next_versioned_path(input_path)
    new_version = _extract_version_from_path(new_path)
    
    # validazione 
    ctx = MCPContext(repo_root=".")
    try:
        if artifact == "dictionary":
            ctx.schema_validate("dictionary", file)
            file["dictionary_version"] = new_version
        elif artifact == "kb":
            ctx.schema_validate("kb", file)
            file["kb_version"] = new_version
        elif artifact == "template_base":
            ctx.schema_validate("template_base", file)
            file["template_base_version"] = new_version
        elif artifact == "config":
            if not isinstance(file, str):
                raise HTTPException(status_code=400, detail="config payload must be yaml string")
        try:
            file = yaml.safe_load(file) or {}
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"invalid yaml: {e}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Payload not valid: {e}!")

    # build run report e salvataggio in db
    run_id = generate_run_id()
    run_dir = RUNS_ROOT / run_id 
    run_dir.mkdir(parents=True, exist_ok=True)

    if artifact == "dictionary":
        diff = summarize_dictionary_diff(old_payload, file)
        schema_versions = {"dictionary_version": file.get("dictionary_version")}
        dictionary_payload = file
        kb_payload = None
        template_base_path = None
        template_base_version = None

    # kb
    elif artifact == "kb":
        diff = summarize_kb_diff(old_payload, file)
        schema_versions = {"kb_version": file.get("kb_version")}
        dictionary_payload = None
        kb_payload = file
        template_base_path = None
        template_base_version = None

    # template_base
    elif artifact == "template_base":  
        diff = summarize_template_base_diff(old_payload, file)
        schema_versions = {"template_base_version": file.get("template_base_version")}
        dictionary_payload = None
        kb_payload = None
        template_base_path = str(new_path)
        template_base_version = file.get("template_base_version")

    #config
    elif artifact == "config":
        # diff semplice su struttura yaml
        diff = [] if old_payload == file else ["config_changed"]
        schema_versions = {"config_version": new_version}
        dictionary_payload = None
        kb_payload = None
        template_base_path = None
        template_base_version = None
    else:
        raise HTTPException(status_code=400, detail=f"unsupported artifact: {artifact}")

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
        if artifact == "config":
            new_path.write_text(
                yaml.safe_dump(file, sort_keys=False, allow_unicode=True),encoding="utf-8")
        else:
            new_path.write_text(json.dumps(file, ensure_ascii=False, indent=2), encoding="utf-8")
    else:
        new_path = input_path

    # scrive run report
    report_path.write_text(json.dumps(run_report, ensure_ascii=False, indent=2), encoding="utf-8")

    # salva nel db
    artifact_id = _register_artifact_from_path(str(new_path), artifact)
    runClass.save_run(run_report, user_id, artifact_id)

    return {"status": "ok", "new_file": str(new_path), "run_id": run_id, "report_path": str(report_path), "diff": diff_report}

#----LIST & PREVIEW----
@router.get("/templates")
def list_templates(user = Depends(get_current_user)):
    return artifactClass.list_artifact("template")

@router.get("/templates/{id}")
def get_template(id: str, user = Depends(get_current_user)):
    return artifactClass.get_artifact_content(id, "template")

@router.get("/template_usage/{id}")
def get_template_usage(id: str, user = Depends(get_current_user)):
    return templateClass.get_template_usage(id)

@router.get("/dictionaries")
def list_dictionaries(user = Depends(get_current_user)):
    return artifactClass.list_artifact("dictionary")

@router.get("/dictionaries/{id}")
def get_dictionary(id: str, user = Depends(get_current_user)):
    return artifactClass.get_artifact_content(id, "dictionary")

@router.get("/dictionary/{version}/score")
def get_dictionary_score(version: str, user = Depends(get_current_user)):
    return runClass.get_dictionary_templates_scores(version)

@router.get("/kb")
def list_kb(user = Depends(get_current_user)):
    return artifactClass.list_artifact("kb")

@router.get("/kb/{id}")
def get_kb(id: str, user = Depends(get_current_user)):
    return artifactClass.get_artifact_content(id, "kb")

@router.get("/template_base")
def list_template_base(user = Depends(get_current_user)):
    return artifactClass.list_artifact("template_base")

@router.get("/template_base/{id}")
def get_template_base(id: str, user = Depends(get_current_user)):
    return artifactClass.get_artifact_content(id, "template_base")

@router.get("/device_list")
def list_device_list(user = Depends(get_current_user)):
    dl = artifactClass.list_artifact("device_list")
    store_dl = []
    for row in dl:
        name = row["name"]
        if "/" in name:
            store, file = name.split("/", 1)
        store_dl.append({
            "id": row["id"],
            "store": store,
            "file": file
        })
    return {"device_list": store_dl}

@router.get("/device_list/{store}/{dl}")
def get_device_list(store: str, dl: str, user = Depends(get_current_user)):
    return artifactClass.get_artifact_content(f"{store}/{dl}", "device_list")

@router.get("/enrich_device_list")
def list_enrich_device_list(user = Depends(get_current_user)):
    dl = artifactClass.list_artifact("device_list_context")
    store_dl = []
    for row in dl:
        name = row["name"]
        if "/" in name:
            store, file = name.split("/", 1)
        store_dl.append({
            "id": row["id"],
            "store": store,
            "file": file
        })
    return {"enriched_device_list": store_dl}

@router.get("/enrich/device_list/{store}/{dl}")
def get_enrich_device_list(store: str, dl: str, user = Depends(get_current_user)):
    return artifactClass.get_artifact_content(f"{store}/{dl}", "device_list_context")

#----EDIT----
@router.post("/dictionary/edit")
def edit_dictionary(payload: DictionaryEditRequest, user = Depends(get_current_user)):
    return editor_json_inline(payload.id, payload.dictionary_json, DICTIONARIES_DIR, "dictionary", user["sub"])

@router.post("/kb/edit")
def edit_kb(payload: KbEditRequest, user = Depends(get_current_user)):
    return editor_json_inline(payload.id, payload.kb_json, KB_DIR, "kb", user["sub"])

@router.post("/template_base/edit")
def edit_template_base(payload: TemplateBaseEditRequest, user = Depends(get_current_user)):
    return editor_json_inline(payload.id, payload.template_base_json, TEMPLATE_BASE_DIR, "template_base", user["sub"])