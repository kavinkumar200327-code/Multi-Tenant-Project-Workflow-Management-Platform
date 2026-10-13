import os
import uuid
from pathlib import Path


def generate_unique_filename(original_filename: str) -> str:

    extension = Path(original_filename).suffix.lower()

    unique_name = f"{uuid.uuid4()}{extension}"

    return unique_name


def get_file_extension(filename: str) -> str:

    return Path(filename).suffix.lower()


def get_file_size(file_path: str | Path) -> int:

    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(
            f"File not found: {file_path}"
        )

    return path.stat().st_size


def is_allowed_file_type(
    filename: str,
    allowed_extensions: set[str],
) -> bool:

    extension = get_file_extension(filename)

    allowed_extensions = {
        ext.lower()
        if ext.startswith(".")
        else f".{ext.lower()}"
        for ext in allowed_extensions
    }

    return extension in allowed_extensions


def ensure_directory_exists(directory: str | Path) -> Path:

    path = Path(directory)

    path.mkdir(
        parents=True,
        exist_ok=True,
    )

    return path


def delete_file(file_path: str | Path) -> bool:

    path = Path(file_path)

    if not path.exists():
        return False

    if not path.is_file():
        return False

    path.unlink()

    return True