from fastapi import APIRouter, Depends, HTTPException
from src.intermediateLayer.postgres_repository import UsersRepository, ArtifactRepository, Clients, Stores
from backend_api.schemas.admin import UpdateRoleAdmin, DropArtifactAdmin, DeleteUserAdmin, InsertClientAdmin, DeleteClientAdmin, UpsertStoreAdmin, UpdateUser, DeleteStoreAdmin, UpdateClientAdmin, \
    UpdateStoreAdmin
from backend_api.utils.deps import require_admin
from uuid import UUID

router = APIRouter(prefix="/api", tags=["admin"], dependencies=[Depends(require_admin)])

dsn = "dbname=semantic_ai_mapper user=semantic_user password=semantic_password host=localhost port=5432"
userClass = UsersRepository(dsn)
artifactClass = ArtifactRepository(dsn)
clientClass = Clients(dsn)
storeClass = Stores(dsn)

# -------CHECK---------
def check_user(id):
    # controlla se user è presente nel db
    return userClass.get_user_by_id(id)

def check_artifact(ids: list[str] | None, name: str | None):
    if ids:
        requested = {str(x) for x in ids}
        found_rows = artifactClass.get_artifacts_by_ids_or_name(ids=ids, name=None)
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

        return name

    raise HTTPException(status_code=400, detail="provide ids or name")

def check_client(name):
    # controlla se un cliente è gia presente nel db
    return clientClass.client_exists(name)

def check_store(name):
    # controlla se uno store è gia presente nel db
    check = storeClass.store_exists(name)
    return check

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

def store_operation(id: UUID | None, client_id: UUID | None, name: str | None, new_name: str | None, content: dict | None, type_op: str):
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
    ids = check_artifact(payload.ids, None)
    return artifactClass.drop_artifact(ids)

@router.get("/artifact_content")
def get_artifact_content(name: str, user = Depends(require_admin)):
    name = check_artifact(None, name)
    return artifactClass.get_artifact_content(name)

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
def update_store(payload: UpdateStoreAdmin):
    return store_operation(payload.id, payload.client_id, payload.name, payload.new_name, None, "update")

@router.post("/delete_store")
def delete_store(payload: DeleteStoreAdmin, user = Depends(require_admin)):
    return store_operation(None, None,payload.name, None, None, "delete")


#--DEVICES--