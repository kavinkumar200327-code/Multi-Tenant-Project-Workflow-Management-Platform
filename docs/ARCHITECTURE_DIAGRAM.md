# System Architecture Diagram

This document illustrates the end-to-end system architecture, security perimeter, tenant isolation mechanisms, and role-based access control (RBAC) flow of the **Multi-Tenant Project & Workflow Management Platform**.

---

## 1. High-Level System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer ["1. Frontend Presentation Layer (React 18 + Vite + TypeScript)"]
        UI["SPA Client: React 18, Tailwind CSS, Lucide Icons"]
        Router["React Router v6 (Protected & Splat Routes)"]
        StateStore["State Management: Zustand (AuthStore, NotificationStore, OrgStore)"]
        AxiosInt["Axios HTTP Client + JWT Interceptors (Auto Token Refresh)"]
        UI --> Router
        Router --> StateStore
        StateStore --> AxiosInt
    end

    subgraph APILayer ["2. Gateway & Application Layer (FastAPI + Uvicorn)"]
        CORS["CORS Middleware (Configured Allowed Origins)"]
        APIRouter["FastAPI APIRouter (/api/v1)"]
        JWTAuth["JWT Authentication Dependency (Bearer HS256)"]
        RBAC["Scoped RBAC & Tenant Verification Dependencies"]

        CORS --> APIRouter
        APIRouter --> JWTAuth
        JWTAuth --> RBAC
    end

    subgraph ServiceLayer ["3. Business Domain Services"]
        AuthSvc["AuthService (Bcrypt, JWT Rotate, Revoke)"]
        OrgSvc["OrganizationService (Multi-Tenancy Scoping)"]
        ProjSvc["ProjectService (Tenant-Bounded CRUD)"]
        TaskSvc["Task & Workflow Service (Kanban, Dependencies)"]
        NotifSvc["NotificationService (Tenant-Isolated Events)"]
        AttachSvc["AttachmentService (Disk/Multipart Upload)"]
    end

    subgraph DataLayer ["4. Persistence & Storage Layer"]
        ORM["SQLAlchemy 2.0 ORM"]
        Alembic["Alembic Database Migrations"]
        Postgres[(PostgreSQL 16 Database)]
        LocalStorage["Local / Cloud File Storage (Uploads)"]

        ORM --> Postgres
        Alembic --> Postgres
        AttachSvc --> LocalStorage
    end

    AxiosInt -->|"HTTP REST + Bearer Token"| CORS
    RBAC --> ServiceLayer
    ServiceLayer --> ORM
```

---

## 2. Multi-Tenant Request Isolation Flow

Each request operates strictly within the context of an authenticated user and an active organization workspace.

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Browser
    participant Client as React SPA (Axios)
    participant AuthDep as FastAPI Auth Dependency
    participant RBACDep as Permission & Tenant Checker
    participant Service as Domain Service
    participant DB as PostgreSQL 16

    User->>Client: Navigate to Organization Workspace (ID: 1)
    Client->>AuthDep: GET /api/v1/projects/1 [Header: Authorization: Bearer <Token>]
    AuthDep->>AuthDep: Validate JWT Signature & Expiration
    AuthDep-->>RBACDep: Current User Object (User ID: 2)
    RBACDep->>DB: Query organization_members WHERE user_id = 2 AND org_id = 1
    alt User is Not an Active Member
        DB-->>RBACDep: No record found
        RBACDep-->>Client: 403 Forbidden ("User is not a member of this organization")
    else User is Active Member
        DB-->>RBACDep: Member (Role: admin)
        RBACDep-->>Service: Proceed with authorized org context
        Service->>DB: SELECT * FROM projects WHERE organization_id = 1
        DB-->>Service: Tenant-Scoped Projects List
        Service-->>Client: 200 OK [Projects Array]
        Client-->>User: Render Kanban & Project Dashboard
    end
```

---

## 3. Role-Based Access Control (RBAC) Hierarchy

The platform implements a 5-tier role hierarchy enforced at both the API dependency layer and UI conditional components:

```mermaid
graph TD
    Owner["Owner (Tier 1)"] --> Admin["Admin (Tier 2)"]
    Admin --> PM["Project Manager (Tier 3)"]
    PM --> Member["Member / Contributor (Tier 4)"]
    Member --> Viewer["Viewer (Tier 5)"]

    classDef owner fill:#e11d48,stroke:#9f1239,stroke-width:2px,color:#fff;
    classDef admin fill:#7c3aed,stroke:#5b21b6,stroke-width:2px,color:#fff;
    classDef pm fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef member fill:#059669,stroke:#047857,stroke-width:2px,color:#fff;
    classDef viewer fill:#64748b,stroke:#475569,stroke-width:2px,color:#fff;

    class Owner owner;
    class Admin admin;
    class PM pm;
    class Member member;
    class Viewer viewer;
```

### RBAC Permission Matrix

| Capability | Owner | Admin | Project Manager | Member / Contributor | Viewer |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Manage Org Settings & Delete Org** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Invite & Modify Member Roles** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Create & Delete Projects** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Update Project Details** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Create Tasks & Assign Members** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Update Any Task & Status** | ✅ | ✅ | ✅ | Self-assigned only | ❌ |
| **Delete Tasks** | ✅ | ✅ | ✅ | Self-created only | ❌ |
| **Add Comments & Upload Attachments** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Read Projects, Tasks, Comments, Files** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Scoped Workspace Notifications** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 4. Tenant-Scoped Notification Pipeline

To prevent cross-tenant notification leakage, every lifecycle event tags notifications with `organization_id`:

```mermaid
flowchart LR
    Event["Workspace Event (Project Created / Task Assigned / Comment)"] --> Lookup["Lookup Project & Task organization_id"]
    Lookup --> CreateNotif["NotificationService.create_notification(organization_id=X)"]
    CreateNotif --> DB[(PostgreSQL notifications Table)]
    DB --> ClientQuery["GET /api/v1/notifications/?organization_id=X"]
    ClientQuery --> UI["Workspace Notification Feed (Strictly Isolated)"]
```
