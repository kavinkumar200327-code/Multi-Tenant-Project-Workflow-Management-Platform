# Multi-Tenant Project & Workflow Management Platform

An enterprise-grade, multi-tenant project and workflow management system featuring strictly isolated organizational workspaces, fine-grained Role-Based Access Control (RBAC), interactive Kanban task boards, workflow automation, and organization-scoped real-time notifications.

---

## 🎯 Deliverables Checklist

All required project deliverables are completed and located within this repository:

| # | Deliverable | Location | Status |
| :---: | :--- | :--- | :---: |
| 1 | **GitHub Repository** | Root Git repository initialized with clean commits | ✅ Complete |
| 2 | **Complete React Source Code** | [`Frontend/`](Frontend/) (React 18, Vite, TypeScript, TailwindCSS) | ✅ Complete |
| 3 | **Complete FastAPI Source Code** | [`Backend/`](Backend/) (FastAPI, SQLAlchemy 2.0, Pydantic v2) | ✅ Complete |
| 4 | **PostgreSQL Database Models** | [`Backend/app/models/`](Backend/app/models/) | ✅ Complete |
| 5 | **Alembic Migrations** | [`Backend/alembic/versions/`](Backend/alembic/versions/) | ✅ Complete |
| 6 | **.env.example** | [`.env.example`](.env.example), [`Backend/.env.example`](Backend/.env.example) | ✅ Complete |
| 7 | **Postman Collection** | [`postman_collection.json`](postman_collection.json) | ✅ Complete |
| 8 | **Automated Tests** | [`Backend/tests/`](Backend/tests/) (37/37 passing) | ✅ Complete |
| 9 | **ER Diagram** | [`docs/ER_DIAGRAM.md`](docs/ER_DIAGRAM.md) | ✅ Complete |
| 10 | **Architecture Diagram** | [`docs/ARCHITECTURE_DIAGRAM.md`](docs/ARCHITECTURE_DIAGRAM.md) | ✅ Complete |
| 11 | **README** | [`README.md`](README.md) | ✅ Complete |
| 12 | **API Documentation** | [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) | ✅ Complete |
| 13 | **Setup Instructions** | [`docs/SETUP_INSTRUCTIONS.md`](docs/SETUP_INSTRUCTIONS.md) | ✅ Complete |

---

## 🚀 Key Features

- **Multi-Tenant Scoping**: Complete database and API query isolation per organization. Users switching between organizations only view assets and notifications belonging to the active workspace.
- **5-Tier Role-Based Access Control (RBAC)**:
  - **Owner**: Full administrative organization control, billing, member deletion, transfer.
  - **Admin**: User invitations, role modification, project creation, task management.
  - **Project Manager**: Project planning, workflow updates, task assignment, status updates.
  - **Member / Contributor**: Task creation, self-assigned task completion, comments, file attachments.
  - **Viewer**: Read-only access across projects, tasks, comments, and attachments.
- **Tenant-Scoped Notifications**:
  - Notifications emitted by projects, tasks, comments, or memberships are tagged with `organization_id`.
  - Zero cross-tenant notification leakage.
  - Interactive notification detail modal with top-right exit `✕` button and one-click read status.
- **Workflow & Task Engine**:
  - Interactive Kanban board with status drag-and-drop (`todo`, `in_progress`, `review`, `done`, `blocked`).
  - Task dependency graph prevention.
  - Priority levels (`low`, `medium`, `high`, `urgent`).
- **File Attachments & Collaboration**:
  - Multipart file uploads per task with download streaming.
  - Nested markdown comments and user attribution.

---

## 📊 Automated Test Suite

The test suite validates authentication, user registration, multi-tenant isolation, project boundaries, RBAC permissions, task workflows, comments, and attachments:

```bash
cd Backend
pytest -v
```

**Status**: `37 passed, 100% success rate`.

---

## 🔑 Default Login Credentials

All demo accounts use password: `Password@123`

| Role | Email | Password | Primary Organization |
| :--- | :--- | :--- | :--- |
| **Owner** | `owner@example.com` | `Password@123` | Acme Corporation (Owner) |
| **Admin** | `admin@example.com` | `Password@123` | Acme Corp (Admin) & RK Developers (Owner) |
| **Project Manager** | `manager@example.com` | `Password@123` | Acme Corporation |
| **Member / Contributor** | `member@example.com` | `Password@123` | Acme Corporation |
| **Viewer** | `viewer@example.com` | `Password@123` | Acme Corporation |

---

## ⚡ Quickstart

### Backend (FastAPI)
```bash
cd Backend
python -m venv .venv
# Activate: .\.venv\Scripts\activate (Windows) or source .venv/bin/activate (Linux/Mac)
pip install -r requirements.txt
alembic upgrade head
python seed_data.py
python -m uvicorn app.main:app --reload
```

### Frontend (React + Vite)
```bash
cd Frontend
npm install
npm run dev
```

- Web UI: `http://localhost:5173`
- API & Swagger Docs: `http://localhost:8000/docs`

---

## 📚 Technical Documentation Links

- [Entity Relationship Diagram & Database Schema](docs/ER_DIAGRAM.md)
- [System Architecture & Multi-Tenancy Flow](docs/ARCHITECTURE_DIAGRAM.md)
- [REST API Endpoint Catalog](docs/API_DOCUMENTATION.md)
- [Full Setup & Troubleshooting Instructions](docs/SETUP_INSTRUCTIONS.md)
- [Postman API Collection](postman_collection.json)
