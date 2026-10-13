from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TaskBase(BaseModel):
    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
    )

    description: str | None = None

    status: str = Field(
        default="todo",
        max_length=30,
    )

    priority: str = Field(
        default="medium",
        max_length=30,
    )

    due_date: datetime | None = None


class TaskCreate(TaskBase):
    project_id: int
    assigned_to_id: int | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )

    description: str | None = None

    status: str | None = Field(
        default=None,
        max_length=30,
    )

    priority: str | None = Field(
        default=None,
        max_length=30,
    )

    assigned_to_id: int | None = None

    due_date: datetime | None = None

    position: int | None = None


class TaskResponse(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    created_by_id: int
    assigned_to_id: int | None
    position: int
    created_at: datetime
    updated_at: datetime
    project_name: str | None = None


class TaskDependencyCreate(BaseModel):
    depends_on_task_id: int


class TaskDependencyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    depends_on_task_id: int
    created_at: datetime