from fastapi import APIRouter

from app.schemas.common import HealthResponse

router = APIRouter()  # Fixed: was `router = APIRouter` (missing parentheses)


@router.get(
    "/health",
    response_model=HealthResponse,
)
def health_check():

    return {"status": "healthy"}
