from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard_service import DashboardService


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get(
    "/{organization_id}",
    response_model=DashboardResponse,
)
def get_dashboard(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get dashboard summary for an organization."""
    # Fixed: was calling get_project_summary() instead of get_dashboard()
    return DashboardService.get_dashboard(
        db=db,
        organization_id=organization_id,
    )