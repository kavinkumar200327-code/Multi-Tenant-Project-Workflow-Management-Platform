"""
Database Seed Script
Populates the multi-tenant workflow database with default role-based users,
organizations, projects, tasks, and comments for full platform testing.
"""
import sys
import os

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
os.chdir(BACKEND_DIR)

from sqlalchemy import select
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.core.security import hash_password
from app.core.constants import OrganizationRole, MembershipStatus
from app.models.user import User
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.task import Task
from app.models.comment import Comment
from app.models.notification import Notification

def seed():
    print("Ensuring all database tables exist...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Define Users with Roles
        users_data = [
            {
                "full_name": "Alice Owner",
                "email": "owner@example.com",
                "password": "Password@123",
                "org_role": OrganizationRole.OWNER,
            },
            {
                "full_name": "Bob Admin",
                "email": "admin@example.com",
                "password": "Password@123",
                "org_role": OrganizationRole.ADMIN,
            },
            {
                "full_name": "Charlie Manager",
                "email": "manager@example.com",
                "password": "Password@123",
                "org_role": OrganizationRole.PROJECT_MANAGER,
            },
            {
                "full_name": "David Member",
                "email": "member@example.com",
                "password": "Password@123",
                "org_role": OrganizationRole.MEMBER,
            },
            {
                "full_name": "Eve Viewer",
                "email": "viewer@example.com",
                "password": "Password@123",
                "org_role": OrganizationRole.VIEWER,
            },
            {
                "full_name": "Test User",
                "email": "testuser@example.com",
                "password": "Test@12345",
                "org_role": OrganizationRole.ADMIN,
            },
            {
                "full_name": "Second User",
                "email": "seconduser@example.com",
                "password": "Test@12345",
                "org_role": OrganizationRole.MEMBER,
            },
        ]

        created_users = {}
        for u in users_data:
            existing = db.scalar(select(User).where(User.email == u["email"].lower()))
            if not existing:
                user = User(
                    full_name=u["full_name"],
                    email=u["email"].lower(),
                    password_hash=hash_password(u["password"]),
                    is_active=True,
                )
                db.add(user)
                db.flush()
                created_users[u["email"]] = (user, u["org_role"])
                print(f"Created user: {u['email']} ({u['full_name']})")
            else:
                existing.password_hash = hash_password(u["password"])
                existing.is_active = True
                created_users[u["email"]] = (existing, u["org_role"])
                print(f"Updated user password: {u['email']}")
        
        db.commit()

        # 2. Seed Default Organization
        owner_user, _ = created_users["owner@example.com"]
        org_slug = "acme-corp"
        org = db.scalar(select(Organization).where(Organization.slug == org_slug))
        if not org:
            org = Organization(
                name="Acme Corporation",
                slug=org_slug,
            )
            db.add(org)
            db.flush()
            print(f"Created organization: {org.name} (/{org.slug})")

        # 3. Create/Update Organization Memberships
        for email, (user, role) in created_users.items():
            membership = db.scalar(
                select(OrganizationMember).where(
                    OrganizationMember.organization_id == org.id,
                    OrganizationMember.user_id == user.id,
                )
            )
            if not membership:
                membership = OrganizationMember(
                    organization_id=org.id,
                    user_id=user.id,
                    role=role,
                    status=MembershipStatus.ACTIVE,
                )
                db.add(membership)
                print(f"Assigned {email} role: {role.value} in {org.name}")
            else:
                membership.role = role
                membership.status = MembershipStatus.ACTIVE
        
        db.commit()

        # 4. Seed Default Projects
        project_data = [
            {
                "name": "Alpha Workflow System",
                "description": "Multi-tenant project management and orchestration platform.",
                "status": "active",
            },
            {
                "name": "Cloud Infrastructure Migration",
                "description": "Migrating core services to hybrid cloud architecture.",
                "status": "active",
            },
            {
                "name": "Mobile App V2",
                "description": "Next generation iOS and Android applications.",
                "status": "planning",
            }
        ]

        created_projects = []
        for p in project_data:
            existing_p = db.scalar(
                select(Project).where(
                    Project.organization_id == org.id,
                    Project.name == p["name"],
                )
            )
            if not existing_p:
                proj = Project(
                    organization_id=org.id,
                    owner_id=owner_user.id,
                    name=p["name"],
                    description=p["description"],
                    status=p["status"],
                )
                db.add(proj)
                db.flush()
                created_projects.append(proj)
                print(f"Created project: {proj.name}")
            else:
                created_projects.append(existing_p)

        db.commit()

        # 5. Add Project Memberships
        main_project = created_projects[0]
        for email, (user, _) in created_users.items():
            pm = db.scalar(
                select(ProjectMember).where(
                    ProjectMember.project_id == main_project.id,
                    ProjectMember.user_id == user.id,
                )
            )
            if not pm:
                pm = ProjectMember(
                    project_id=main_project.id,
                    user_id=user.id,
                    role="member",
                    status="active",
                )
                db.add(pm)

        db.commit()

        # 6. Seed Sample Tasks
        member_user, _ = created_users["member@example.com"]
        manager_user, _ = created_users["manager@example.com"]

        tasks_data = [
            {
                "title": "Setup PostgreSQL and Alembic migrations",
                "description": "Initialize database schema, tables, and relationships.",
                "status": "done",
                "priority": "urgent",
                "assigned_to_id": member_user.id,
                "created_by_id": owner_user.id,
            },
            {
                "title": "Implement JWT Auth & RBAC Middleware",
                "description": "Create token generation, refresh rotation, and role check dependencies.",
                "status": "done",
                "priority": "high",
                "assigned_to_id": manager_user.id,
                "created_by_id": owner_user.id,
            },
            {
                "title": "Design Kanban board and status workflow",
                "description": "Allow drag-and-drop state transitions with dependency validation.",
                "status": "in_progress",
                "priority": "high",
                "assigned_to_id": member_user.id,
                "created_by_id": manager_user.id,
            },
            {
                "title": "Add analytics and metrics dashboard",
                "description": "Aggregate project summaries, task distribution, and completion rates.",
                "status": "review",
                "priority": "medium",
                "assigned_to_id": member_user.id,
                "created_by_id": manager_user.id,
            },
            {
                "title": "Configure email notifications for task assignment",
                "description": "Notify users when assigned to tasks or when comments are posted.",
                "status": "todo",
                "priority": "low",
                "assigned_to_id": member_user.id,
                "created_by_id": manager_user.id,
            },
            {
                "title": "Implement automated end-to-end test suite",
                "description": "Validate cross-tenant data isolation and role boundaries.",
                "status": "backlog",
                "priority": "medium",
                "assigned_to_id": None,
                "created_by_id": owner_user.id,
            },
        ]

        for t in tasks_data:
            existing_t = db.scalar(
                select(Task).where(
                    Task.project_id == main_project.id,
                    Task.title == t["title"],
                )
            )
            if not existing_t:
                task = Task(
                    project_id=main_project.id,
                    title=t["title"],
                    description=t["description"],
                    status=t["status"],
                    priority=t["priority"],
                    assigned_to_id=t["assigned_to_id"],
                    created_by_id=t["created_by_id"],
                )
                db.add(task)
                db.flush()
                
                # Add sample comment
                comment = Comment(
                    task_id=task.id,
                    user_id=owner_user.id,
                    content=f"Initial update on task '{t['title']}'. Everything is on track.",
                )
                db.add(comment)
                print(f"Created task: {task.title} [{task.status}]")

        # 7. Seed Sample Notifications
        for email, (user, _) in created_users.items():
            existing_n = db.scalar(
                select(Notification).where(
                    Notification.user_id == user.id,
                )
            )
            if not existing_n:
                notif = Notification(
                    user_id=user.id,
                    title="Welcome to WorkflowPro",
                    message="You have been added to Acme Corporation workspace. Explore your projects and tasks!",
                    notification_type="system",
                    is_read=False,
                )
                db.add(notif)

        db.commit()
        print("\n--> SEEDING COMPLETED SUCCESSFULLY! <--\n")

    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed()
