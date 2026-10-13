from datetime import datetime, timezone, timedelta
import hashlib
import secrets

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


def hash_password(password: str) -> str:
    # bcrypt requires bytes; truncate to 72 bytes if needed
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(
        plain_password: str,
        hashed_password: str,
) -> bool:
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        return bcrypt.checkpw(pwd_bytes, hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub" : subject,
        "type" : "access",
        "exp" : expire,
    }

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm = settings.ALGORITHM,
    )

def create_refresh_token() -> str:
    return secrets.token_urlsafe(64)

def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()

def decode_access_token(token: str) -> dict:

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms = [settings.ALGORITHM],
        )

        if payload.get("type") != "access":
            raise JWTError("Invalid token type")

        if not payload.get("sub"):
            raise JWTError("Missing subject token")

        return payload

    except JWTError as exc:

        raise ValueError(
            "Invalid or expired access token"
        ) from exc