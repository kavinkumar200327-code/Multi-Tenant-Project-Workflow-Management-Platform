from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProjectBase(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=150,
    )

    description: str | None = None


class ProjectCreate(ProjectBase):
    organization_id: int | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )

    description: str | None = None

    status: str | None = Field(
        default=None,
        max_length=30,
    )


class ProjectResponse(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    owner_id: int
    status: str
    created_at: datetime
    updated_at: datetime


class ProjectMemberCreate(BaseModel):
    user_id: int
    role: str = Field(
        default="member",
        max_length=30,
    )


class ProjectMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    user_id: int
    role: str
    status: str
    joined_at: datetime