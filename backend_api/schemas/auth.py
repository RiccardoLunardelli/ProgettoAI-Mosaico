from pydantic import BaseModel

class SignupRequest(BaseModel):
    email: str
    name: str

class LoginRequest(BaseModel):
    email: str
