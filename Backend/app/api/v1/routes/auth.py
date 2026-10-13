from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User

from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    RefreshRequest,
    LogoutRequest,
    ChangePasswordRequest,
    TokenResponse,
    UserResponce,
)

from app.services.auth_service import (
    register_user,
    authenticate_user,
    issue_token,
    rotate_refresh_token,
    revoke_refresh_token,
    change_user_password,
)

router = APIRouter()

@router.post(
    "/register",
    response_model = UserResponce,
    status_code = 201,
)

def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
):

    return register_user(
        db,
        full_name = payload.full_name,
        email = payload.email,
        password = payload.password,
    )

@router.post(
    "/login",
    response_model = TokenResponse,
)

async def login(
    request: Request,
    db: Session = Depends(get_db),
):
    content_type = request.headers.get("content-type", "")
    if "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
        form = await request.form()
        email = form.get("username") or form.get("email")
        password = form.get("password")
    else:
        try:
            body = await request.json()
            email = body.get("email") or body.get("username")
            password = body.get("password")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid request body",
            )

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required",
        )

    user = authenticate_user(
        db,
        email=str(email),
        password=str(password),
    )

    return issue_token(
        db,
        user,
    )

@router.post(
    "/refresh",
    response_model = TokenResponse,
)

def refresh(
    payload: RefreshRequest,
    db: Session = Depends(get_db),
):

    return rotate_refresh_token(
        db,
        payload.refresh_token,
    )

@router.post("/logout")

def logout(
    payload: LogoutRequest,
    db:Session = Depends(get_db),
):

    revoke_refresh_token(
        db,
        payload.refresh_token,
    )

    return {
        "message" : "Your Logged Out Successfully..."
    }

@router.get(
    "/me",
    response_model = UserResponce,
)

def me(
    current_user: User = Depends(get_current_user),
):

    return current_user

@router.post(
    "/change-password",
)
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    change_user_password(
        db,
        current_user,
        current_password=payload.current_password,
        new_password=payload.new_password,
    )
    return {"message": "Password changed successfully"}
