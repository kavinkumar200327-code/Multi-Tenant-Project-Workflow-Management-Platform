# REST API Documentation

Comprehensive endpoint specification for the **Multi-Tenant Project & Workflow Management Platform** (`v1.0.0`).

- **Base URL**: `http://localhost:8000/api/v1`
- **Interactive OpenAPI Docs**: `http://localhost:8000/docs` (Swagger UI) / `http://localhost:8000/redoc` (ReDoc)
- **Authentication**: Bearer Token in `Authorization` header (`Bearer <access_token>`).

---

## 1. Authentication Endpoints

### 1.1 User Registration
- **Route**: `POST /auth/register`
- **Auth**: Public
- **Request Body**:
```json
{
  "full_name": "Alice Owner",
  "email": "owner@example.com",
  "password": "Password@123"
}
```
- **Response**: `201 Created`
```json
{
  "id": 1,
  "full_name": "Alice Owner",
  "email": "owner@example.com",
  "is_active": true,
  "created_at": "2026-10-13T10:00:00Z",
  "updated_at": "2026-10-13T10:00:00Z"
}
```

### 1.2 User Login
- **Route**: `POST /auth/login`
- **Auth**: Public
- **Accepts**: JSON body or `application/x-www-form-urlencoded`
- **Request Body**:
```json
{
  "email": "owner@example.com",
  "password": "Password@123"
}
```
- **Response**: `200 OK`
```json
{
  "access_token": "eyJhbGciOi...",
  "refresh_token": "eyJhbGciOi...",
  "token_type": "bearer"
}
```

### 1.3 Refresh Access Token
- **Route**: `POST /auth/refresh`
- **Auth**: Public
- **Request Body**:
```json
{
  "refresh_token": "eyJhbGciOi..."
}
```
- **Response**: `200 OK` (Rotated tokens)

### 1.4 User Logout
- **Route**: `POST /auth/logout`
- **Auth**: Bearer Token
- **Request Body**: `{"refresh_token": "..."}`
- **Response**: `200 OK`

---

## 2. User Profile Endpoints

### 2.1 Get Current User
- **Route**: `GET /users/me`
- **Auth**: Bearer Token
- **Response**: `200 OK`

---

## 3. Organization Endpoints

### 3.1 List Organizations
- **Route**: `GET /organization/`
- **Auth**: Bearer Token
- **Response**: `200 OK` (Array of organizations the user belongs to, including active role)

### 3.2 Create Organization
- **Route**: `POST /organization/`
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "name": "Acme Corporation",
  "slug": "acme-corporation"
}
```
- **Response**: `201 Created` (Creator is automatically assigned as `owner`)

### 3.3 Get Organization Details
- **Route**: `GET /organization/{organization_id}`
- **Auth**: Bearer Token (Must be active member)
- **Response**: `200 OK`

### 3.4 List Organization Members
- **Route**: `GET /organization/{organization_id}/members`
- **Auth**: Bearer Token (Must be active member)
- **Response**: `200 OK` (List of members with roles: `owner`, `admin`, `project_manager`, `member`, `viewer`)

### 3.5 Add Member to Organization
- **Route**: `POST /organization/{organization_id}/members`
- **Auth**: Bearer Token (`owner` or `admin`)
- **Request Body**:
```json
{
  "user_id": 4,
  "role": "member"
}
```
- **Response**: `201 Created`

### 3.6 Update Member Role (RBAC)
- **Route**: `PUT /organization/{organization_id}/members/{user_id}`
- **Auth**: Bearer Token (`owner` or `admin`)
- **Request Body**:
```json
{
  "role": "project_manager"
}
```
- **Response**: `200 OK`

---

## 4. Project Endpoints

### 4.1 List Projects by Organization
- **Route**: `GET /projects/{organization_id}`
- **Auth**: Bearer Token (Must be active member of organization)
- **Response**: `200 OK`

### 4.2 Create Project
- **Route**: `POST /projects/{organization_id}`
- **Auth**: Bearer Token (`owner`, `admin`, or `project_manager`)
- **Request Body**:
```json
{
  "name": "Backend Refactoring",
  "description": "Improve database connection pooling and query efficiency"
}
```
- **Response**: `201 Created`

### 4.3 Get Project by ID
- **Route**: `GET /projects/item/{project_id}`
- **Auth**: Bearer Token (Must be member of project's organization)
- **Response**: `200 OK`

### 4.4 Update Project
- **Route**: `PUT /projects/item/{project_id}`
- **Auth**: Bearer Token (`owner`, `admin`, or `project_manager`)
- **Request Body**:
```json
{
  "name": "Backend Refactoring v2",
  "status": "active"
}
```
- **Response**: `200 OK`

### 4.5 Delete Project
- **Route**: `DELETE /projects/item/{project_id}` (or `DELETE /projects/{project_id}`)
- **Auth**: Bearer Token (`owner` or `admin` only)
- **Response**: `204 No Content`

---

## 5. Task & Workflow Endpoints

### 5.1 List Tasks by Project
- **Route**: `GET /tasks/project/{project_id}`
- **Auth**: Bearer Token
- **Query Parameters**:
  - `offset`: int (default `0`)
  - `limit`: int (default `50`)
  - `search`: string (optional)
  - `status`: string (optional filter: `todo`, `in_progress`, `review`, `done`, `blocked`)
  - `priority`: string (optional filter: `low`, `medium`, `high`, `urgent`)
  - `assigned_to_id`: int (optional filter)
- **Response**: `200 OK`

### 5.2 Create Task
- **Route**: `POST /tasks/`
- **Auth**: Bearer Token (`owner`, `admin`, `project_manager`, `member`)
- **Request Body**:
```json
{
  "project_id": 1,
  "title": "Build Auth Middleware",
  "description": "Implement JWT and tenant verification dependencies",
  "priority": "high",
  "status": "todo",
  "assigned_to_id": 3
}
```
- **Response**: `201 Created`

### 5.3 Update Task
- **Route**: `PUT /tasks/{task_id}`
- **Auth**: Bearer Token (PM/Admin/Owner can update any; Member can update self-assigned)
- **Response**: `200 OK`

### 5.4 Update Task Workflow Status
- **Route**: `PATCH /tasks/{task_id}/status`
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "status": "in_progress"
}
```
- **Response**: `200 OK`

### 5.5 Assign Task to Member
- **Route**: `PATCH /tasks/{task_id}/assign`
- **Auth**: Bearer Token (`owner`, `admin`, `project_manager`)
- **Request Body**:
```json
{
  "assigned_to_id": 4
}
```
- **Response**: `200 OK`

### 5.6 Delete Task
- **Route**: `DELETE /tasks/{task_id}`
- **Auth**: Bearer Token (`owner`, `admin`, `project_manager`, or creator)
- **Response**: `204 No Content`

### 5.7 Add Task Dependency
- **Route**: `POST /tasks/{task_id}/dependencies`
- **Auth**: Bearer Token
- **Request Body**: `{"depends_on_task_id": 2}`
- **Response**: `201 Created`

---

## 6. Comments & Attachments

### 6.1 Create Comment
- **Route**: `POST /comments/`
- **Auth**: Bearer Token (Viewers excluded)
- **Request Body**: `{"task_id": 1, "content": "Reviewing implementation."}`
- **Response**: `201 Created`

### 6.2 Get Comments for Task
- **Route**: `GET /comments/task/{task_id}`
- **Auth**: Bearer Token
- **Response**: `200 OK`

### 6.3 Upload File Attachment
- **Route**: `POST /attachments/task/{task_id}` (or `POST /attachments/`)
- **Auth**: Bearer Token (Viewers excluded)
- **Content-Type**: `multipart/form-data`
- **Form Data**: `file` (File), `task_id` (int)
- **Response**: `201 Created`

---

## 7. Tenant-Scoped Notifications

### 7.1 List User Notifications (Filtered by Organization)
- **Route**: `GET /notifications/?organization_id={organization_id}`
- **Auth**: Bearer Token
- **Query Parameters**:
  - `organization_id`: int (Scopes list strictly to active organization workspace)
  - `unread_only`: bool (default `false`)
- **Response**: `200 OK`

### 7.2 Mark Notification as Read
- **Route**: `PATCH /notifications/{notification_id}/read`
- **Auth**: Bearer Token
- **Response**: `200 OK`

### 7.3 Mark All Read for Organization
- **Route**: `PATCH /notifications/read-all?organization_id={organization_id}`
- **Auth**: Bearer Token
- **Response**: `200 OK`

### 7.4 Delete Notification
- **Route**: `DELETE /notifications/{notification_id}`
- **Auth**: Bearer Token
- **Response**: `204 No Content`

---

## 8. Dashboard Analytics

### 8.1 Organization Summary Metrics
- **Route**: `GET /dashboard/summary/{organization_id}`
- **Auth**: Bearer Token (Must be active member)
- **Response**: `200 OK`
```json
{
  "total_projects": 3,
  "total_tasks": 18,
  "completed_tasks": 7,
  "in_progress_tasks": 5,
  "pending_tasks": 6,
  "total_members": 5
}
```
