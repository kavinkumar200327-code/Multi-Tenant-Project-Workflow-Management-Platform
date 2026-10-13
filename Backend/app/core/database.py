# Compatibility shim: re-export get_db from the canonical location
from app.db.session import get_db

__all__ = ["get_db"]