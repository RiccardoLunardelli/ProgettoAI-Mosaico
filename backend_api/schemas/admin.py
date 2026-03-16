from pydantic import BaseModel, UUID4, EmailStr, field_validator
from typing import Any

#----ROLE-----
class UpdateRoleAdmin(BaseModel):
    role: int
    user_id: UUID4

#-----USER------
class UpdateUser(BaseModel):
    user_id: UUID4
    email: EmailStr | None = None 
    name: str | None = None 
    password: str | None = None
    role: int | None = None

class DeleteUserAdmin(BaseModel):
    user_id: UUID4

#----ARTIFACT-----
class GetArtifact(BaseModel):
    id: UUID4

class InsertArtifactAdmin(BaseModel):
    type: str 
    name: str 
    version: str 
    content: dict 

class DropArtifactAdmin(BaseModel):
    ids: list[UUID4]

#----CLIENT-----
class InsertClientAdmin(BaseModel):
    name: str

class UpdateClientAdmin(BaseModel):
    name: str
    new_name: str

class DeleteClientAdmin(BaseModel):
    name: str

#---STORE----
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

#---DEVICE-----
class UpdateDeviceAdmin(BaseModel):
    id: UUID4
    store_id: UUID4 | None 
    description: str | None 
    hd_plc: str | None 
    id_template: UUID4 | None

    @field_validator("store_id", "id_template", mode="before")
    @classmethod
    def empty_to_none(cls, v):
        if v == "":
            return None
        return v

class InsertDeviceAdmin(BaseModel):
    store_id: UUID4
    description: str
    hd_plc: str | None
    id_template: UUID4 | None

class DeleteDeviceAdmin(BaseModel):
    id: UUID4