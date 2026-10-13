from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.notification import NotificationResponse
from app.services.notification_service import NotificationService


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


@router.get(
    "",
    response_model=list[NotificationResponse],
)
@router.get(
    "/",
    response_model=list[NotificationResponse],
    include_in_schema=False,
)
def get_my_notifications(
    organization_id: int | None = Query(default=None),
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return NotificationService.get_user_notifications(
        db=db,
        user_id=current_user.id,
        organization_id=organization_id,
        unread_only=unread_only,
    )


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = NotificationService.get_notification_by_id(
        db=db,
        notification_id=notification_id,
        user_id=current_user.id,
    )

    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )

    return NotificationService.mark_as_read(
        db=db,
        notification=notification,
    )


@router.patch(
    "/read-all",
    status_code=status.HTTP_200_OK,
)
def mark_all_notifications_as_read(
    organization_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = NotificationService.mark_all_as_read(
        db=db,
        user_id=current_user.id,
        organization_id=organization_id,
    )
    return {"message": f"{count} notifications marked as read."}


@router.delete(
    "/{notification_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = NotificationService.get_notification_by_id(
        db=db,
        notification_id=notification_id,
        user_id=current_user.id,
    )
    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )
    db.delete(notification)
    db.commit()
    return None