from pydantic import BaseModel, UUID4, EmailStr
from typing import Any

class UpdateRoleAdmin(BaseModel):
    role: int
    user_id: UUID4

class UpdateUser(BaseModel):
    user_id: UUID4
    email: EmailStr | None = None 
    name: str | None = None 
    password: str | None = None
    role: int | None = None

class DropArtifactAdmin(BaseModel):
    ids: list[UUID4]

class DeleteUserAdmin(BaseModel):
    user_id: UUID4

class InsertClientAdmin(BaseModel):
    name: str

class UpdateClientAdmin(BaseModel):
    name: str
    new_name: str

class GetArtifact(BaseModel):
    id: UUID4

class DeleteClientAdmin(BaseModel):
    name: str

class UpsertStoreAdmin(BaseModel):
    client_id: UUID4
    store: str
    content: list[dict[str, Any]]

class UpdateStoreAdmin(BaseModel):
    id: UUID4 
    client_id: UUID4 | None
    name: str | None
    new_name: str | None

class DeleteStoreAdmin(BaseModel):
    name: str

class UpdateDeviceAdmin(BaseModel):
    id: UUID4