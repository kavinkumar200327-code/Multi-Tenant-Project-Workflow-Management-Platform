from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.pagination import PaginationParams, get_pagination
from app.dependencies.permissions import (
    check_task_create_permission,
    check_task_delete_permission,
    check_task_update_permission,
    get_user_org_membership,
)
from app.models.project import Project
from app.models.user import User
from app.schemas.task import (
    TaskCreate,
    TaskDependencyCreate,
    TaskDependencyResponse,
    TaskResponse,
    TaskUpdate,
)
from app.services.task_service import TaskService


router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"],
)


@router.get(
    "",
    response_model=list[TaskResponse],
    include_in_schema=False,
)
@router.get(
    "/",
    response_model=list[TaskResponse],
    include_in_schema=False,
)
def get_tasks_root(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return []


@router.post(
    "/",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Enforce RBAC: Viewers cannot create tasks
    check_task_create_permission(db, current_user, task_data.project_id)

    return TaskService.create_task(
        db=db,
        task_data=task_data,
        created_by_id=current_user.id,
    )


@router.get(
    "/project/{project_id}",
    response_model=list[TaskResponse],
)
def get_project_tasks(
    project_id: int,
    pagination: PaginationParams = Depends(get_pagination),
    search: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    priority: str | None = Query(default=None),
    assigned_to_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Verify active organization membership
    get_user_org_membership(db, current_user.id, project.organization_id)

    return TaskService.get_tasks_by_project(
        db=db,
        project_id=project_id,
        offset=pagination.offset,
        limit=pagination.limit,
        search=search,
        status=status_filter,
        priority=priority,
        assigned_to_id=assigned_to_id,
    )


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = TaskService.get_task_by_id(db=db, task_id=task_id)

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    project = db.get(Project, task.project_id)
    if project:
        get_user_org_membership(db, current_user.id, project.organization_id)

    return task


@router.put(
    "/{task_id}",
    response_model=TaskResponse,
)
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = TaskService.get_task_by_id(db=db, task_id=task_id)

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    # Enforce RBAC: Viewers cannot update tasks
    check_task_update_permission(db, current_user, task)

    return TaskService.update_task(db=db, task=task, task_data=task_data)


@router.patch(
    "/{task_id}/status",
    response_model=TaskResponse,
)
def update_task_status_endpoint(
    task_id: int,
    status_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = TaskService.get_task_by_id(db=db, task_id=task_id)
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    check_task_update_permission(db, current_user, task)
    return TaskService.update_task(
        db=db,
        task=task,
        task_data=TaskUpdate(status=status_data.get("status")),
    )


@router.patch(
    "/{task_id}/assign",
    response_model=TaskResponse,
)
def update_task_assign_endpoint(
    task_id: int,
    assign_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = TaskService.get_task_by_id(db=db, task_id=task_id)
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    check_task_update_permission(db, current_user, task)
    return TaskService.update_task(
        db=db,
        task=task,
        task_data=TaskUpdate(assigned_to_id=assign_data.get("assigned_to_id")),
    )


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = TaskService.get_task_by_id(db=db, task_id=task_id)

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found.",
        )

    # Enforce RBAC: Viewers cannot delete tasks; Members can only delete own tasks; Owner/Admin/PM can delete any
    check_task_delete_permission(db, current_user, task)

    TaskService.delete_task(db=db, task=task)
    return None


@router.post(
    "/{task_id}/dependencies",
    response_model=TaskDependencyResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_task_dependency(
    task_id: int,
    dependency_data: TaskDependencyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = TaskService.get_task_by_id(db=db, task_id=task_id)
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    # Enforce RBAC: Viewers cannot create dependencies
    check_task_update_permission(db, current_user, task)

    return TaskService.create_dependency(
        db=db,
        task_id=task_id,
        depends_on_task_id=dependency_data.depends_on_task_id,
    )


@router.delete(
    "/{task_id}/dependencies/{dependency_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_task_dependency(
    task_id: int,
    dependency_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = TaskService.get_task_by_id(db=db, task_id=task_id)
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    # Enforce RBAC: Viewers cannot delete dependencies
    check_task_update_permission(db, current_user, task)

    TaskService.delete_dependency(db=db, dependency_id=dependency_id)
    return None