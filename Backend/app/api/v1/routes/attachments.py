import os
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.constants import OrganizationRole
from app.core.exceptions import forbidden
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.permissions import (
    check_attachment_upload_permission,
    get_user_org_membership,
)
from app.models.attachment import Attachment
from app.models.project import Project
from app.models.task import Task
from app.models.user import User
from app.schemas.attachment import AttachmentResponse
from app.services.attachment_service import AttachmentService


router = APIRouter(
    prefix="/attachments",
    tags=["Attachments"],
)


@router.get(
    "",
    response_model=list[AttachmentResponse],
)
@router.get(
    "/",
    response_model=list[AttachmentResponse],
)
def list_attachments_root(
    task_id: int = Query(...),
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

    return AttachmentService.get_task_attachments(
        db=db,
        task_id=task_id,
    )



@router.post(
    "",
    response_model=AttachmentResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
@router.post(
    "/",
    response_model=AttachmentResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
def upload_attachment_root(
    task_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Enforce RBAC: Viewers cannot upload attachments
    check_attachment_upload_permission(db, current_user, task_id)

    return AttachmentService.create_attachment(
        db=db,
        task_id=task_id,
        user=current_user,
        filename=file.filename or "uploaded_file",
        content_type=file.content_type or "application/octet-stream",
        file=file,
    )


@router.post(
    "/task/{task_id}",
    response_model=AttachmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload_attachment(
    task_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Enforce RBAC: Viewers cannot upload attachments
    check_attachment_upload_permission(db, current_user, task_id)

    return AttachmentService.create_attachment(
        db=db,
        task_id=task_id,
        user=current_user,
        filename=file.filename or "uploaded_file",
        content_type=file.content_type or "application/octet-stream",
        file=file,
    )


@router.get(
    "/task/{task_id}",
    response_model=list[AttachmentResponse],
)
def get_task_attachments(
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

    return AttachmentService.get_task_attachments(
        db=db,
        task_id=task_id,
    )


@router.delete(
    "/{attachment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attachment = AttachmentService.get_attachment_by_id(
        db=db,
        attachment_id=attachment_id,
    )

    if attachment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found.",
        )

    task = db.get(Task, attachment.task_id)
    if task:
        project = db.get(Project, task.project_id)
        if project:
            membership = get_user_org_membership(db, current_user.id, project.organization_id)
            if membership.role not in {OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.PROJECT_MANAGER}:
                if attachment.uploaded_by_id != current_user.id:
                    raise forbidden("You can only delete your own attachments.")

    AttachmentService.delete_attachment(
        db=db,
        attachment=attachment,
    )

    return None


@router.get(
    "/{attachment_id}/download",
)
def download_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attachment = AttachmentService.get_attachment_by_id(
        db=db,
        attachment_id=attachment_id,
    )

    if attachment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found.",
        )

    task = db.get(Task, attachment.task_id)
    if task:
        project = db.get(Project, task.project_id)
        if project:
            get_user_org_membership(db, current_user.id, project.organization_id)

    if attachment.file_path and os.path.exists(attachment.file_path):
        return FileResponse(
            path=attachment.file_path,
            filename=attachment.file_name,
            media_type=attachment.file_type or "application/octet-stream",
        )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Attachment file content not found on server.",
    )