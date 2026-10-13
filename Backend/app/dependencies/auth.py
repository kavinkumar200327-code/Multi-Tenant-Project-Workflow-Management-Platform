from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.exceptions import unauthorized
from app.core.security import decode_access_token
from app.models.user import User
from app.repositories.user_repository import get_by_id

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login"
)


def get_current_user(
        token: str = Depends(oauth2_scheme),
        db: Session = Depends(get_db),
) -> User:

    try:
        payload = decode_access_token(token)
        user_id = int(payload["sub"])

    except (ValueError, TypeError, KeyError):
        raise unauthorized("Invalid or expired access token")

    user = get_by_id(db, user_id)

    if not user:
        raise unauthorized("User not found")

    if not user.is_active:
        raise unauthorized("User account is inactive")

    return user
