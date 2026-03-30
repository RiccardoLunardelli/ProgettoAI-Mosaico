from fastapi import APIRouter, Depends, HTTPException
from src.intermediateLayer.postgres_repository import UsersRepository, ArtifactRepository, Clients, Stores, Devices, RunRepository, Template, Schema
from backend_api.schemas.admin import UpdateRoleAdmin, DropArtifactAdmin, DeleteUserAdmin, InsertClientAdmin, DeleteClientAdmin, UpsertStoreAdmin, UpdateUser, DeleteStoreAdmin, UpdateClientAdmin, \
    UpdateStoreAdmin, UpdateDeviceAdmin, InsertDeviceAdmin, DeleteDeviceAdmin, InsertArtifactAdmin, EditConfigAdmin, CreateTemplateAdmin

from backend_api.routes.admin.template_builder import DefaultTemplateBuilder
from backend_api.utils.deps import require_admin
from uuid import UUID
import yaml
from scripts.config.config import TIMEZONE, generate_run_id, RUNS_ROOT
import re
import json
from scripts.report.report import build_run_report
from scripts.summarize_diff.diff import summarize_config_diff
from pathlib import Path

router = APIRouter(prefix="/api", tags=["admin"], dependencies=[Depends(require_admin)])

dsn = "dbname=semantic_ai_mapper user=semantic_user password=semantic_password host=localhost port=5432"
userClass = UsersRepository(dsn)
artifactClass = ArtifactRepository(dsn)
clientClass = Clients(dsn)
storeClass = Stores(dsn)
deviceClass = Devices(dsn)
runClass = RunRepository(dsn)
templateClass = Template(dsn)
schemaClass = Schema(dsn)

# -------CHECK---------
def check_user(id):
    # controlla se user è presente nel db
    return userClass.get_user_by_id(id)

def check_artifact(id: str | None, ids: list[str] | None, name: str | None):

    if id:
        rows = artifactClass.get_artifacts_by_ids_or_name(id, None, None)
        if not rows:
            raise HTTPException(status_code=404, detail={"message": "Artifact not found", "id": id})
        row = rows[0]
        return {"artifact": row["id"], "name": row["name"]}


    if ids:
        requested = {str(x) for x in ids}
        found_rows = artifactClass.get_artifacts_by_ids_or_name(None, ids=ids, name=None)
        found_ids = {row["id"] for row in found_rows}

        missing = sorted(requested - found_ids)
        if missing:
            raise HTTPException(
                status_code=404,
                detail={"message": "Artifact not found", "missing_ids": missing}
            )

        return ids

    if name:
        found_rows = artifactClass.get_artifacts_by_ids_or_name(ids=None, name=name)
        if not found_rows:
            raise HTTPException(
                status_code=404,
                detail={"message": "Artifact not found", "name": name}
            )

        return {"artifact": name} if name else {}

    raise HTTPException(status_code=400, detail="provide ids or name")

def check_client(name):
    # controlla se un cliente è gia presente nel db
    return clientClass.client_exists(name)

def check_store(name):
    # controlla se uno store è gia presente nel db
    check = storeClass.store_exists(name)
    return check

def check_device(id):
    check = deviceClass.device_exist(id)
    return check

#------OPERATION------
def user_operation(id, type, role: int | None, email: str | None, name: str | None, password: str | None):
    check = check_user(id)
    if len(check) > 0:
        if type == "delete":
            return userClass.delete_user(id)
        elif type == "update_user":
            return userClass.update_user(id, email, name, password, role)
    else:
        raise HTTPException(status_code=404, detail="User not found")

def client_operation(name: str, type_op: str, new_name: str | None):
    check = check_client(name)
    if len(check) > 0:
        if type_op == "insert":
            raise HTTPException(status_code=409, detail=f"Client {name} already exist!")
        elif type_op == "delete":
            return clientClass.delete_client(name)
        elif type_op == "update":
            return clientClass.update_name(new_name, name)
    else:
        if type_op == "insert":
            return  clientClass.upsert_client(name)
        elif type_op == "delete" or type_op == "update":
            return HTTPException(status_code=404, detail="Client not exists!")

def store_operation(id: UUID | None, client_id: UUID | None, name: str | None, new_name: str | None, content: list[dict] | None, type_op: str):
    check = check_store(name)
    if len(check) > 0:
        if type_op == "insert":
            raise HTTPException(status_code=409, detail=f"store {name} already exists!")
        elif type_op == "delete":
            return storeClass.delete_store(name)
        elif type_op == "update":
            return storeClass.update_store(id, client_id, new_name)
    else:
        if type_op == "insert":
            return storeClass.upsert_store(client_id, name, content)
        elif type_op == "delete" or type_op == "update":
            raise HTTPException(status_code=404, detail=f"store {name} not found")

def device_operation(id: UUID | None, store_id: UUID | None, description: str | None, hd_plc: str | None, id_template: UUID | None, type_op: str):
    
    if type_op == "insert":
        return deviceClass.insert_device(store_id, description, hd_plc, id_template)
    
    check = check_device(id)
    if len(check) > 0:
        if type_op == "update":
            return deviceClass.update_device(id, store_id, description, hd_plc, id_template)
        elif type_op == "delete":
            return deviceClass.delete_device(id)
    else:
        if type_op == "update" or type_op == "delete":
            raise HTTPException(status_code=404, detail="Device not found")

#---EDITOR CONFIG-----
def editor_config_json_inline(artifact_id: str, yaml_text: str, user_id: str):
    # editor inline di config

    old_name = artifactClass.get_artifact_name_by_id(artifact_id)
    old_content = artifactClass.get_artifact_content(artifact_id, "config")

    # old content da DB
    if isinstance(old_content, str):
        old_obj = yaml.safe_load(old_content) or {}
    else:
        old_obj = old_content or {}

    try:
        new_obj = yaml.safe_load(yaml_text) or {}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"invalid yaml: {e}")

    # calcola diff
    diff = summarize_config_diff(old_obj, new_obj)
    if not diff:
        return {"status": "ok", "changed": False, "name": old_name}

    new_name, new_version = _next_versioned_name(old_name)

    # salvataggio YAML come stringa nel JSONB
    new_artifact_id = artifactClass.upsert_artifact(artifact_type="config", name=new_name, version=new_version, content=new_obj, schema_id=None)

    run_id = generate_run_id()
    run_dir = RUNS_ROOT / str(user_id) / run_id
    run_dir.mkdir(parents=True, exist_ok=True)
    report_path = run_dir / "run_report.json"

    run_report = build_run_report(
        cfg={},
        run_id=run_id,
        artifact_type="config",
        input_path=old_name,
        output_path=new_name,
        diff=diff,
        schema_versions={"config_version": new_version},
        committed=True,
        status="success",
        validation_block={"status": "ok", "errors": [], "warnings": []},
        mr=None,
        dictionary_payload=None,
        kb_payload=None,
        template_base_path=None,
        template_base_version=None,
        llm_attempt=None,
        actions_payload=None,
    )


    report_path.write_text(json.dumps(run_report, ensure_ascii=False, indent=2), encoding="utf-8")
    runClass.save_run(run_report, user_id, new_artifact_id)

    return {
        "status": "ok",
        "changed": True,
        "run_id": run_id,
        "artifact_id": new_artifact_id,
        "name": new_name,
        "version": new_version,
        "diff": diff
    }

def _next_versioned_name(name: str) -> tuple[str, str]:
    m = re.search(r"_v(\d+)\.(\d+)\.(ya?ml|json)$", name)
    if not m:
        base, ext = name.rsplit(".", 1)
        return f"{base}_v0.1.{ext}", "0.1"

    major, minor, ext = int(m.group(1)), int(m.group(2)), m.group(3)
    if minor >= 9:
        major += 1
        minor = 0
    else:
        minor += 1

    new_v = f"{major}.{minor}"
    old = f"_v{m.group(1)}.{m.group(2)}.{ext}"
    return name.replace(old, f"_v{new_v}.{ext}"), new_v

#------HELPER CREAZIONE TEMPLATE-------
def build_template(payload: CreateTemplateAdmin) -> dict:
    # costruisce template

    return DefaultTemplateBuilder().build(payload)

# ------ENDPOINT--------

#--USER--
@router.get("/users")
def get_all_users(user = Depends(require_admin)):
    return userClass.get_users()

@router.post("/delete_user")
def delete_user(payload: DeleteUserAdmin, user = Depends(require_admin)):
    return user_operation(payload.user_id, "delete", None, None, None, None)

@router.post("/update_user")
def update_user(payload: UpdateUser, user = Depends(require_admin)):
    return user_operation(payload.user_id, "update_user", payload.role, payload.email, payload.name, payload.password)

#--ARTIFACTS--
@router.get("/artifacts")
def get_all_artifacts(user = Depends(require_admin)):
    return artifactClass.get_artifacts()

@router.post("/drop_artifact")
def drop_artifact(payload: DropArtifactAdmin, user = Depends(require_admin)):
    ids = check_artifact(None, payload.ids, None)
    return artifactClass.drop_artifact(ids)

@router.get("/artifact_content/{id}")
def artifact_content(id: str, user = Depends(require_admin)):
    check = check_artifact(id, None, None)
    if len(check) > 0:
        return artifactClass.get_artifact_content(id, "artifact")
    else:
        raise HTTPException(status_code=404, detail="Not found")

@router.post("/insert_artifact")
def insert_artifact(payload: InsertArtifactAdmin, user = Depends(require_admin)):
    check = artifactClass.get_artifacts_by_ids_or_name(None, None, payload.name)
    if len(check) > 0:
        raise HTTPException(status_code=409, detail="Artifact already exists!")

    return artifactClass.upsert_artifact(payload.type, payload.name, payload.version, payload.content, None)


#--CLIENTS--
@router.get("/clients")
def get_clients(user = Depends(require_admin)):
    return clientClass.list_clients()

@router.post("/insert_client")
def insert_client(payload: InsertClientAdmin, user = Depends(require_admin)):
    return client_operation(payload.name, "insert", None)

@router.post("/update_client")
def update_client(payload: UpdateClientAdmin, user = Depends(require_admin)):
    return client_operation(payload.name, "update", payload.new_name)

@router.post("/delete_client")
def delete_client(payload: DeleteClientAdmin, user = Depends(require_admin)):
    return client_operation(payload.name, "delete", None)

#--STORES--
@router.get("/list_store")
def list_store(user = Depends(require_admin)):
    return storeClass.list_store()

@router.post("/upsert_store")
def upsert_store(payload: UpsertStoreAdmin, user = Depends(require_admin)):
    return store_operation(None, payload.client_id, payload.store, None, payload.content, "insert")

@router.post("/update_store")
def update_store(payload: UpdateStoreAdmin, user = Depends(require_admin)):
    return store_operation(payload.id, payload.client_id, payload.name, payload.new_name, None, "update")

@router.post("/delete_store")
def delete_store(payload: DeleteStoreAdmin, user = Depends(require_admin)):
    return store_operation(None, None,payload.name, None, None, "delete")

#--DEVICES--
@router.get("/devices")
def get_devices(user = Depends(require_admin)):
    return deviceClass.list_devices()

@router.post("/insert_device")
def insert_device(payload: InsertDeviceAdmin, user = Depends(require_admin)):
    return device_operation(None, payload.store_id, payload.description, payload.hd_plc, payload.id_template, "insert")

@router.post("/update_device")
def update_device(payload: UpdateDeviceAdmin, user = Depends(require_admin)):
    return device_operation(payload.id, payload.store_id, payload.description, payload.hd_plc, payload.id_template, "update")

@router.post("/delete_device")
def delete_device(payload: DeleteDeviceAdmin, user = Depends(require_admin)):
    return device_operation(payload.id, None, None, None, None, "delete")

#----CONFIG-----
@router.post("/edit/config")
def edit_config_inline(payload: EditConfigAdmin, user = Depends(require_admin)):
    return editor_config_json_inline(payload.id, payload.file, user["sub"])

#---CREATE TEMPLATE------
@router.post("/create_template")
def create_template(payload: CreateTemplateAdmin, user = Depends(require_admin)):
    template_json = build_template(payload.Template) # template
    schema_id = payload.Schema_id # schema id

    # salvataggio template in artifacts
    artifact_name = f"{payload.Template.TemplateInfo.TemplateName}.json"
    artifact_version = payload.Template.TemplateInfo.Version
    artifact_id = artifactClass.upsert_artifact(artifact_type="template", name=artifact_name, version=artifact_version, content=template_json, schema_id=schema_id)

    # salvataggio metadata template in templates
    author = payload.Template.TemplateInfo.Author
    category = payload.Template.TemplateInfo.Category
    name = payload.Template.TemplateInfo.TemplateName
    product = payload.Template.TemplateInfo.Product
    version = payload.Template.TemplateInfo.Version
    content = payload.Template.model_dump()
    templateClass.insert_templates_metadata(artifact_id=artifact_id, author=author, category=category, name=name, product=product, version=version, content=content)
    return {"status": "ok", "artifact_id": artifact_id}

#---SCHEMA TEMPLATE-----
@router.get("/get_schema_template")
def get_schema_template(user = Depends(require_admin)):
    path_schema = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/schema_template.json")
    with open(path_schema, "r", encoding="utf-8") as f:
        return json.load(f)

#--SCHEMA NORMALIZER TEMPLATE---
@router.get("/list_schemas")
def get_list_schemas(user = Depends(require_admin)):
    return schemaClass.list_schemas()