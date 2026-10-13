# Entity Relationship (ER) Diagram

This document models the relational schema for the **Multi-Tenant Project & Workflow Management Platform**, implemented with PostgreSQL and SQLAlchemy 2.0.

---

## 1. Mermaid Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ REFRESH_TOKENS : "issues"
    USERS ||--o{ ORGANIZATION_MEMBERS : "belongs to"
    USERS ||--o{ PROJECTS : "owns"
    USERS ||--o{ PROJECT_MEMBERS : "participates in"
    USERS ||--o{ TASKS : "creates"
    USERS ||--o{ TASKS : "assigned to"
    USERS ||--o{ COMMENTS : "authors"
    USERS ||--o{ ATTACHMENTS : "uploads"
    USERS ||--o{ NOTIFICATIONS : "receives"

    ORGANIZATIONS ||--o{ ORGANIZATION_MEMBERS : "contains"
    ORGANIZATIONS ||--o{ PROJECTS : "tenants"
    ORGANIZATIONS ||--o{ NOTIFICATIONS : "scopes"

    PROJECTS ||--o{ PROJECT_MEMBERS : "includes"
    PROJECTS ||--o{ TASKS : "contains"

    TASKS ||--o{ TASK_DEPENDENCIES : "has dependent"
    TASKS ||--o{ TASK_DEPENDENCIES : "depends on"
    TASKS ||--o{ COMMENTS : "contains"
    TASKS ||--o{ ATTACHMENTS : "contains"

    USERS {
        int id PK
        string full_name
        string email UK
        string password_hash
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    REFRESH_TOKENS {
        int id PK
        int user_id FK
        string token_hash UK
        datetime expires_at
        boolean revoked
        datetime created_at
    }

    ORGANIZATIONS {
        int id PK
        string name
        string slug UK
        datetime created_at
        datetime updated_at
    }

    ORGANIZATION_MEMBERS {
        int id PK
        int organization_id FK
        int user_id FK
        string role "owner | admin | project_manager | member | viewer"
        string status "active | invited | suspended"
        datetime joined_at
    }

    PROJECTS {
        int id PK
        int organization_id FK
        int owner_id FK
        string name
        text description
        string status "planning | active | on_hold | completed | archived"
        datetime created_at
        datetime updated_at
    }

    PROJECT_MEMBERS {
        int id PK
        int project_id FK
        int user_id FK
        string role
        string status
        datetime joined_at
    }

    TASKS {
        int id PK
        int project_id FK
        int created_by_id FK
        int assigned_to_id FK "nullable"
        string title
        text description
        string priority "low | medium | high | urgent"
        string status "todo | in_progress | review | done | blocked"
        datetime due_date "nullable"
        datetime created_at
        datetime updated_at
    }

    TASK_DEPENDENCIES {
        int id PK
        int task_id FK
        int depends_on_task_id FK
        datetime created_at
    }

    COMMENTS {
        int id PK
        int task_id FK
        int user_id FK
        text content
        datetime created_at
        datetime updated_at
    }

    ATTACHMENTS {
        int id PK
        int task_id FK
        int user_id FK
        string file_name
        string file_path
        int file_size
        string content_type
        datetime created_at
    }

    NOTIFICATIONS {
        int id PK
        int user_id FK
        int organization_id FK "nullable, indexed for tenant isolation"
        string title
        text message
        string type "system | organization | project | task | comment"
        boolean is_read
        datetime created_at
    }
```

---

## 2. Table Specifications & Constraints

### 2.1 `users`
- **Primary Key**: `id` (`SERIAL` / `INTEGER`)
- **Indexes**: `email` (`UNIQUE INDEX`), `created_at`
- **Cascade Rules**: Deleting a user cascades to refresh tokens and notification subscriptions.

### 2.2 `organizations`
- **Primary Key**: `id` (`SERIAL` / `INTEGER`)
- **Indexes**: `slug` (`UNIQUE INDEX`)
- **Description**: Top-level tenant container. All projects, tasks, workflows, and workspace notifications are partitioned under an organization.

### 2.3 `organization_members`
- **Primary Key**: `id` (`SERIAL` / `INTEGER`)
- **Foreign Keys**:
  - `organization_id` $\rightarrow$ `organizations(id)` (`ON DELETE CASCADE`)
  - `user_id` $\rightarrow$ `users(id)` (`ON DELETE CASCADE`)
- **Unique Constraint**: `UNIQUE(organization_id, user_id)`
- **Roles**:
  - `owner`: Full administrative rights, organization billing, transfer, member role assignments, deletion.
  - `admin`: Member invitations, role management, project creation, task management.
  - `project_manager`: Project creation, workflow modification, task assignment, status updates.
  - `member`: Task creation, self-assigned task workflow updates, commenting, file attachments.
  - `viewer`: Read-only access to projects, tasks, dependencies, comments, and attachments.

### 2.4 `projects`
- **Primary Key**: `id` (`SERIAL` / `INTEGER`)
- **Foreign Keys**:
  - `organization_id` $\rightarrow$ `organizations(id)` (`ON DELETE CASCADE`)
  - `owner_id` $\rightarrow$ `users(id)` (`ON DELETE RESTRICT`)
- **Indexes**: `(organization_id, created_at)`

### 2.5 `tasks`
- **Primary Key**: `id` (`SERIAL` / `INTEGER`)
- **Foreign Keys**:
  - `project_id` $\rightarrow$ `projects(id)` (`ON DELETE CASCADE`)
  - `created_by_id` $\rightarrow$ `users(id)` (`ON DELETE RESTRICT`)
  - `assigned_to_id` $\rightarrow$ `users(id)` (`ON DELETE SET NULL`, nullable)
- **Indexes**: `(project_id, status)`, `(project_id, priority)`, `assigned_to_id`

### 2.6 `task_dependencies`
- **Primary Key**: `id` (`SERIAL` / `INTEGER`)
- **Foreign Keys**:
  - `task_id` $\rightarrow$ `tasks(id)` (`ON DELETE CASCADE`)
  - `depends_on_task_id` $\rightarrow$ `tasks(id)` (`ON DELETE CASCADE`)
- **Unique Constraint**: `UNIQUE(task_id, depends_on_task_id)`

### 2.7 `notifications`
- **Primary Key**: `id` (`SERIAL` / `INTEGER`)
- **Foreign Keys**:
  - `user_id` $\rightarrow$ `users(id)` (`ON DELETE CASCADE`)
  - `organization_id` $\rightarrow$ `organizations(id)` (`ON DELETE CASCADE`, nullable)
- **Indexes**: `(user_id, organization_id, is_read)`, `organization_id`
- **Tenant Scoping Guarantee**: Notifications emitted by project creations, task assignments, and organization events store `organization_id`. Frontend queries filter strictly with `?organization_id=:currentOrgId`, guaranteeing zero cross-tenant notification leaks.
