from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.constants import MembershipStatus, OrganizationRole
from app.core.exceptions import forbidden, not_found
from app.models.organization_member import OrganizationMember
from app.models.project import Project
from app.models.task import Task
from app.models.user import User


def get_user_org_membership(
    db: Session,
    user_id: int,
    organization_id: int,
) -> OrganizationMember:
    membership = db.scalar(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == user_id,
            OrganizationMember.status == MembershipStatus.ACTIVE,
        )
    )
    if not membership:
        raise forbidden("You are not an active member of this organization")
    return membership


def check_organization_create_permission(
    db: Session,
    user: User,
) -> None:
    memberships = list(
        db.scalars(
            select(OrganizationMember).where(
                OrganizationMember.user_id == user.id,
                OrganizationMember.status == MembershipStatus.ACTIVE,
            )
        ).all()
    )
    if memberships:
        has_admin_role = any(
            m.role in {OrganizationRole.OWNER, OrganizationRole.ADMIN}
            for m in memberships
        )
        if not has_admin_role:
            raise forbidden(
                "Permission denied: Viewers, Members, and Project Managers cannot create new organizations. Only Organization Owners and Admins can create organizations."
            )


def check_project_create_permission(
    db: Session,
    user: User,
    organization_id: int,
) -> OrganizationMember:
    membership = get_user_org_membership(db, user.id, organization_id)
    allowed_roles = {
        OrganizationRole.OWNER,
        OrganizationRole.ADMIN,
        OrganizationRole.PROJECT_MANAGER,
    }
    if membership.role not in allowed_roles:
        raise forbidden(
            f"Permission denied: {membership.role.replace('_', ' ').title()}s cannot create projects. Required role: Owner, Admin, or Project Manager."
        )
    return membership


def check_project_update_permission(
    db: Session,
    user: User,
    project: Project,
) -> OrganizationMember:
    membership = get_user_org_membership(db, user.id, project.organization_id)
    allowed_roles = {
        OrganizationRole.OWNER,
        OrganizationRole.ADMIN,
        OrganizationRole.PROJECT_MANAGER,
    }
    if membership.role not in allowed_roles:
        raise forbidden(
            f"Permission denied: {membership.role.replace('_', ' ').title()}s cannot edit projects. Required role: Owner, Admin, or Project Manager."
        )
    return membership


def check_project_delete_permission(
    db: Session,
    user: User,
    project: Project,
) -> OrganizationMember:
    membership = get_user_org_membership(db, user.id, project.organization_id)
    allowed_roles = {
        OrganizationRole.OWNER,
        OrganizationRole.ADMIN,
    }
    if membership.role not in allowed_roles:
        raise forbidden(
            f"Permission denied: {membership.role.replace('_', ' ').title()}s cannot delete projects. Only Organization Owners and Admins can delete projects."
        )
    return membership


def check_task_create_permission(
    db: Session,
    user: User,
    project_id: int,
) -> tuple[Project, OrganizationMember]:
    project = db.get(Project, project_id)
    if not project:
        raise not_found("Project not found")

    membership = get_user_org_membership(db, user.id, project.organization_id)
    if membership.role == OrganizationRole.VIEWER:
        raise forbidden("Permission denied: Viewers have read-only access and cannot create tasks.")
    return project, membership


def check_task_update_permission(
    db: Session,
    user: User,
    task: Task,
) -> OrganizationMember:
    project = db.get(Project, task.project_id)
    if not project:
        raise not_found("Project not found")

    membership = get_user_org_membership(db, user.id, project.organization_id)
    if membership.role == OrganizationRole.VIEWER:
        raise forbidden("Permission denied: Viewers have read-only access and cannot update tasks.")
    return membership


def check_task_delete_permission(
    db: Session,
    user: User,
    task: Task,
) -> OrganizationMember:
    project = db.get(Project, task.project_id)
    if not project:
        raise not_found("Project not found")

    membership = get_user_org_membership(db, user.id, project.organization_id)
    if membership.role == OrganizationRole.VIEWER:
        raise forbidden("Permission denied: Viewers cannot delete tasks.")

    if membership.role == OrganizationRole.MEMBER and task.created_by_id != user.id:
        raise forbidden("Permission denied: Members can only delete tasks they created. Contact a Project Manager or Admin.")

    return membership


def check_comment_create_permission(
    db: Session,
    user: User,
    task_id: int,
) -> OrganizationMember:
    task = db.get(Task, task_id)
    if not task:
        raise not_found("Task not found")

    project = db.get(Project, task.project_id)
    if not project:
        raise not_found("Project not found")

    membership = get_user_org_membership(db, user.id, project.organization_id)
    if membership.role == OrganizationRole.VIEWER:
        raise forbidden("Permission denied: Viewers have read-only access and cannot post comments.")
    return membership


def check_attachment_upload_permission(
    db: Session,
    user: User,
    task_id: int,
) -> OrganizationMember:
    task = db.get(Task, task_id)
    if not task:
        raise not_found("Task not found")

    project = db.get(Project, task.project_id)
    if not project:
        raise not_found("Project not found")

    membership = get_user_org_membership(db, user.id, project.organization_id)
    if membership.role == OrganizationRole.VIEWER:
        raise forbidden("Permission denied: Viewers have read-only access and cannot upload attachments.")
    return membership