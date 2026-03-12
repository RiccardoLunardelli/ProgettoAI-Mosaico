from pydantic import BaseModel, UUID4

class UpdateRoleAdmin(BaseModel):
    role: int
    user_id: UUID4

class DropArtifactAdmin(BaseModel):
    id: UUID4

class DeleteUserAdmin(BaseModel):
    user_id: UUID4