from fastapi import HTTPException, status


def unauthorized(
        message: str = "Authentication required.",
) -> HTTPException:

    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=message,
        headers={"WWW-Authenticate": "Bearer"},
    )


def forbidden(
        message: str = "You do not have permission to perform this action.",
) -> HTTPException:

    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=message,
    )


def not_found(
        message: str = "Resource not found.",
) -> HTTPException:

    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=message,
    )


def conflict(
        message: str = "Resource already exists.",
) -> HTTPException:

    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=message,
    )
