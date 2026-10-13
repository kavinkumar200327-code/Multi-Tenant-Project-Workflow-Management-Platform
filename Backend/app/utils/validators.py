import re


def validate_email(email: str) -> bool:

    pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    return bool(re.match(pattern, email))


def validate_password(password: str) -> bool:

    if len(password) < 8:
        return False

    if not re.search(r"[A-Z]", password):
        return False

    if not re.search(r"[a-z]", password):
        return False

    if not re.search(r"\d", password):
        return False

    return True


def validate_name(name: str) -> bool:

    if not name:
        return False

    name = name.strip()

    if len(name) < 2:
        return False

    return True


def validate_slug(slug: str) -> bool:

    pattern = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"
    return bool(re.match(pattern, slug))


def validate_positive_integer(value: int) -> bool:

    return value > 0