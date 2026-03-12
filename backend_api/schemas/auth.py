from pydantic import BaseModel, EmailStr

class SignupRequest(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: int = 2

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
