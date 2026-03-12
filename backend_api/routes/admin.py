from fastapi import APIRouter, Depends, HTTPException
from src.intermediateLayer.postgres_repository import UsersRepository, ArtifactRepository
from backend_api.schemas.admin import UpdateRoleAdmin, DropArtifactAdmin, DeleteUserAdmin


router = APIRouter(prefix="/api")

dsn = "dbname=semantic_ai_mapper user=semantic_user password=semantic_password host=localhost port=5432"
userClass = UsersRepository(dsn)
artifactClass = ArtifactRepository(dsn)

@router.get("/users")
def get_all_users():
    return userClass.get_users()

@router.post("/update_role")
def update_role(payload: UpdateRoleAdmin):
    return userClass.update_user_role(payload.role, payload.user_id)

@router.get("/artifacts")
def get_all_artifacts():
    return artifactClass.get_artifacts()

@router.post("/drop_artifact")
def drop_artifact(payload: DropArtifactAdmin):
    return artifactClass.drop_artifact(payload.id)

@router.post("/delete_user")
def delete_user(payload: DeleteUserAdmin):
    return userClass.delete_user(payload.user_id)