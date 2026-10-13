from pydantic import BaseModel, ConfigDict, Field

from app.core.constants import OrganizationRole

class OrganizationCreate(BaseModel):

    name: str = Field(min_length = 2, max_length = 150)

    slug: str = Field(
        min_length = 2,
        max_length = 100,
        pattern = r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
    )

class OrganizationResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes = True,
    )

    id: int
    name: str
    slug: str
    role: OrganizationRole | None = None

class OrganizationMemberResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes = True,
    )

    id: int
    organization_id: int
    user_id: int
    role: OrganizationRole

class OrganizationMemberDetailResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes = True,
    )

    id: int
    organization_id: int
    user_id: int
    role: OrganizationRole
    status: str
    user_full_name: str | None = None
    user_email: str | None = None

class UpdateMemberRoleRequest(BaseModel):
    role: OrganizationRole