from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.permissions import (
    check_project_create_permission,
    check_project_delete_permission,
    check_project_update_permission,
    get_user_org_membership,
)
from app.models.user import User
from app.schemas.project import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from app.services.project_service import ProjectService


router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
)


@router.get(
    "",
    response_model=list[ProjectResponse],
    include_in_schema=False,
)
@router.get(
    "/",
    response_model=list[ProjectResponse],
    include_in_schema=False,
)
def get_projects_root(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.organization_member import OrganizationMember
    from app.models.project import Project
    from sqlalchemy import select

    statement = (
        select(Project)
        .join(OrganizationMember, OrganizationMember.organization_id == Project.organization_id)
        .where(
            OrganizationMember.user_id == current_user.id,
            OrganizationMember.status == "active",
        )
        .order_by(Project.created_at.desc())
    )
    return list(db.scalars(statement).all())


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
@router.post(
    "/",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
def create_project_root(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_id = project_data.organization_id
    if not org_id:
        from app.models.organization_member import OrganizationMember
        from sqlalchemy import select
        m = db.scalars(
            select(OrganizationMember).where(
                OrganizationMember.user_id == current_user.id,
                OrganizationMember.status == "active",
            )
        ).first()
        if not m:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active organization found.")
        org_id = m.organization_id
        project_data.organization_id = org_id

    check_project_create_permission(db, current_user, org_id)
    return ProjectService.create_project(
        db=db,
        project_data=project_data,
        owner_id=current_user.id,
    )


@router.post(
    "/{organization_id}",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_project(
    organization_id: int,
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Enforce RBAC: Owner, Admin, Project Manager only
    check_project_create_permission(db, current_user, organization_id)
    project_data.organization_id = organization_id

    return ProjectService.create_project(
        db=db,
        project_data=project_data,
        owner_id=current_user.id,
    )


@router.get(
    "/{organization_id}",
    response_model=list[ProjectResponse],
)
def get_organization_projects(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify active membership in the organization
    get_user_org_membership(db, current_user.id, organization_id)

    return ProjectService.get_projects_by_organization(
        db=db,
        organization_id=organization_id,
    )


@router.get(
    "/item/{project_id}",
    response_model=ProjectResponse,
)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = ProjectService.get_project_by_id(
        db=db,
        project_id=project_id,
    )

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Verify active membership in the project's organization
    get_user_org_membership(db, current_user.id, project.organization_id)

    return project


@router.put(
    "/item/{project_id}",
    response_model=ProjectResponse,
)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = ProjectService.get_project_by_id(
        db=db,
        project_id=project_id,
    )

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    # Enforce RBAC: Owner, Admin, Project Manager only
    check_project_update_permission(db, current_user, project)

    return ProjectService.update_project(
        db=db,
        project=project,
        project_data=project_data,
    )


@router.delete(
    "/item/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    include_in_schema=False,
)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = ProjectService.get_project_by_id(
        db=db,
        project_id=project_id,
    )

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    # Enforce RBAC: Owner and Admin only
    check_project_delete_permission(db, current_user, project)

    ProjectService.delete_project(
        db=db,
        project=project,
    )

    return None