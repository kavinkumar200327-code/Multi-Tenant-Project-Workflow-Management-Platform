from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.constants import OrganizationRole
from app.core.exceptions import forbidden
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.permissions import (
    check_comment_create_permission,
    get_user_org_membership,
)
from app.models.project import Project
from app.models.task import Task
from app.models.user import User
from app.schemas.comment import (
    CommentCreate,
    CommentResponse,
    CommentUpdate,
)
from app.services.comment_service import CommentService


router = APIRouter(
    prefix="/comments",
    tags=["Comments"],
)


@router.post(
    "/",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_comment(
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Enforce RBAC: Viewers cannot create comments
    check_comment_create_permission(db, current_user, comment_data.task_id)

    return CommentService.create_comment(
        db=db,
        comment_data=comment_data,
        user_id=current_user.id,
    )


@router.get(
    "/task/{task_id}",
    response_model=list[CommentResponse],
)
def get_task_comments(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    project = db.get(Project, task.project_id)
    if project:
        get_user_org_membership(db, current_user.id, project.organization_id)

    return CommentService.get_task_comments(
        db=db,
        task_id=task_id,
    )


@router.put(
    "/{comment_id}",
    response_model=CommentResponse,
)
def update_comment(
    comment_id: int,
    comment_data: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = CommentService.get_comment_by_id(
        db=db,
        comment_id=comment_id,
    )

    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found.",
        )

    if comment.user_id != current_user.id:
        raise forbidden("You can only edit your own comments.")

    return CommentService.update_comment(
        db=db,
        comment=comment,
        comment_data=comment_data,
    )


@router.delete(
    "/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = CommentService.get_comment_by_id(
        db=db,
        comment_id=comment_id,
    )

    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found.",
        )

    task = db.get(Task, comment.task_id)
    if task:
        project = db.get(Project, task.project_id)
        if project:
            membership = get_user_org_membership(db, current_user.id, project.organization_id)
            # Owner, Admin, PM can delete any comment; Members can delete their own
            if membership.role not in {OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.PROJECT_MANAGER}:
                if comment.user_id != current_user.id:
                    raise forbidden("You can only delete your own comments.")

    CommentService.delete_comment(
        db=db,
        comment=comment,
    )

    return None