from pydantic import BaseModel, ConfigDict, EmailStr, Field

class RegisterRequest(BaseModel):

    full_name: str = Field(min_length = 2, max_length = 150)
    email: EmailStr
    password: str = Field(min_length = 8, max_length = 200)

class LoginRequest(BaseModel):

    email: EmailStr
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: str

class UserResponce(BaseModel):

    model_config = ConfigDict(
        from_attributes = True
    )

    id: int
    full_name: str
    email: EmailStr
    is_active: bool

class TokenResponse(BaseModel):

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponce | None = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length = 8, max_length = 200)