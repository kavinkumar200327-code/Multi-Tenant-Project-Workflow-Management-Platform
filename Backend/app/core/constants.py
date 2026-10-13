from enum import Enum

class OrganizationRole(str, Enum):

    OWNER = "owner"
    ADMIN = "admin"
    PROJECT_MANAGER = "project_manager"
    MEMBER = "member"
    VIEWER = "viewer"

class MembershipStatus(str, Enum):

    ACTIVE = "active"
    INVITED = "invited"
    SUSPENDED = "suspended"

