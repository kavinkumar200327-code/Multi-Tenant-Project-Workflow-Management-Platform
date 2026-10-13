from datetime import datetime, timezone


def utc_now() -> datetime:

    return datetime.now(timezone.utc)


def ensure_utc(value: datetime) -> datetime:

    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


def datetime_to_iso(value: datetime) -> str:

    return ensure_utc(value).isoformat()


def is_expired(value: datetime) -> bool:

    return ensure_utc(value) <= utc_now()


def is_future(value: datetime) -> bool:

    return ensure_utc(value) > utc_now()