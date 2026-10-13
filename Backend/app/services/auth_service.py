from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.repositories import user_repository


def register_user(
        db: Session,
        *,
        full_name: str,
        email: str,
        password: str,
) -> User:

    existing = user_repository.get_by_email(db, email)

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    return user_repository.create(
        db,
        full_name=full_name,
        email=email,
        password_hash=hash_password(password),
    )


def authenticate_user(
        db: Session,
        *,
        email: str,
        password: str,
) -> User:

    user = user_repository.get_by_email(db, email)

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return user


def issue_token(
        db: Session,
        user: User,
) -> dict:

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token()

    refresh_record = RefreshToken(
        user_id=user.id,
        token_hash=hash_refresh_token(refresh_token),
        expires_at=datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        ),
    )

    db.add(refresh_record)
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user,
    }


def rotate_refresh_token(
        db: Session,
        raw_token: str,
) -> dict:

    token_hash = hash_refresh_token(raw_token)

    record = db.scalar(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked.is_(False),
        )
    )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    now = datetime.now(timezone.utc)

    if record.expires_at <= now:
        record.revoked = True
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired",
        )

    record.revoked = True
    db.commit()

    return issue_token(db, record.user)


def revoke_refresh_token(
        db: Session,
        raw_token: str,
) -> None:

    token_hash = hash_refresh_token(raw_token)

    record = db.scalar(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash
        )
    )

    if record:
        record.revoked = True
        db.commit()


def change_user_password(
        db: Session,
        user: User,
        *,
        current_password: str,
        new_password: str,
) -> None:

    if not verify_password(current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password does not match",
        )

    user.password_hash = hash_password(new_password)
    db.commit()
