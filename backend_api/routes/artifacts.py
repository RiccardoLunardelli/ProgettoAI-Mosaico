from fastapi import APIRouter, HTTPException
from pathlib import Path
import json

from backend_api.schemas.artifacts import DictionaryEditRequest, KbEditRequest, TemplateBaseEditRequest
from mcp_server.tools.dictionary_tool import _next_versioned_path, _extract_version_from_path
from mcp_server.core import MCPContext

router = APIRouter()

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
    

    new_path.write_text(json.dumps(file_json, ensure_ascii=False, indent=2), encoding="utf-8")

    return {"status": "ok", "new_file": str(new_path)}

#----LIST & PREVIEW----
@router.get("/templates")
def list_templates():
    return list_artifact("template", TEMPLATE_DIR)

@router.get("/templates/{name}")
def get_template(name: str):
    return get_file_of_artifact(name, None, None, "template", TEMPLATE_DIR)

@router.get("/dictionaries")
def list_dictionaries():
    return list_artifact("dictionary", DICTIONARIES_DIR)

@router.get("/dictionaries/{name}")
def get_dictionary(name: str):
    return get_file_of_artifact(name, None, None, "dictionary", DICTIONARIES_DIR)

@router.get("/kb")
def list_kb():
    return list_artifact("kb", KB_DIR)

@router.get("/kb/{name}")
def get_kb(name: str):
    return get_file_of_artifact(name, None, None, "kb", KB_DIR)

@router.get("/template_base")
def list_template_base():
    return list_artifact("template_base", TEMPLATE_BASE_DIR)

@router.get("/template_base/{name}")
def get_template_base(name: str):
    return get_file_of_artifact(name, None, None, "template_base", TEMPLATE_BASE_DIR)

@router.get("/device_list")
def list_device_list():
    return list_artifact("device_list", PVS_DIR) 

@router.get("/device_list/{store}/{dl}")
def get_device_list(store: str, dl: str):
    return get_file_of_artifact(None, store, dl, "device_list", PVS_DIR)

#----EDIT----
@router.post("/dictionary/edit")
def edit_dictionary(payload: DictionaryEditRequest):
    return editor_json_inline(payload.dictionary_name, payload.dictionary_json, DICTIONARIES_DIR, "dictionary")

@router.post("/kb/edit")
def edit_kb(payload: KbEditRequest):
    return editor_json_inline(payload.kb_name, payload.kb_json, KB_DIR, "kb")

@router.post("/template_base/edit")
def edit_template_base(payload: TemplateBaseEditRequest):
    return editor_json_inline(payload.template_base_name, payload.template_base_json, TEMPLATE_BASE_DIR, "template_base")