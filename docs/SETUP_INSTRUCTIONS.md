# Platform Setup & Installation Instructions

This guide provides complete, step-by-step instructions for running the **Multi-Tenant Project & Workflow Management Platform** on Windows, macOS, or Linux.

---

## 1. Prerequisites

Ensure you have the following installed on your machine:
- **Python**: `3.11+` (Python 3.12, 3.13, 3.14 compatible)
- **Node.js**: `18.0.0+` (with `npm` or `pnpm`)
- **PostgreSQL**: `15.0+` running locally on port `5432`
- **Git**: `2.30+`

---

## 2. Clone the Repository

```bash
git clone <your-repository-url>
cd "Multi-Tenant Project & Workflow Management Platform"
```

---

## 3. Database Setup (PostgreSQL)

Using `psql` or your PostgreSQL GUI (e.g., pgAdmin, DBeaver):

```sql
CREATE DATABASE multi_tenant_workflow_db;
```

Verify your credentials (default: username `postgres`, password `postgres`, port `5432`).

---

## 4. Backend Setup (FastAPI)

### 4.1 Create & Activate Virtual Environment

**Windows (PowerShell / Command Prompt)**:
```powershell
cd Backend
python -m venv .venv
.\.venv\Scripts\activate
```

**macOS / Linux**:
```bash
cd Backend
python3 -m venv .venv
source .venv/bin/activate
```

### 4.2 Install Python Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4.3 Configure Environment Variables

Create `Backend/.env` based on `Backend/.env.example`:

```ini
PROJECT_NAME="Multi-Tenant Project & Workflow Management Platform"
VERSION="1.0.0"
API_V1_PREFIX="/api/v1"

DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5432/multi_tenant_workflow_db"

SECRET_KEY="super_secret_jwt_key_at_least_32_characters_long"
ALGORITHM="HS256"

ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]
```

### 4.4 Run Database Migrations

Apply database schemas using Alembic:

```bash
alembic upgrade head
```

### 4.5 Seed Demo Roles & Initial Data

Populate the database with pre-configured organizations, projects, workflows, and role-based test users:

```bash
python seed_data.py
```

### 4.6 Verify with Automated Tests

Execute the automated test suite to confirm all 37 tests pass:

```bash
pytest -v
```

### 4.7 Start the Backend Server

```bash
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- Backend API will be live at: `http://127.0.0.1:8000`
- Swagger UI Documentation: `http://127.0.0.1:8000/docs`

---

## 5. Frontend Setup (React + Vite)

Open a new terminal window:

### 5.1 Install Node Dependencies

```bash
cd Frontend
npm install
```

### 5.2 Configure Frontend Environment

Create `Frontend/.env`:

```ini
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 5.3 Start Frontend Development Server

```bash
npm run dev
```
- Frontend application will be live at: `http://localhost:5173`

---

## 6. Default Role-Based Login Credentials

All seed accounts use the password: `Password@123`

| Role | Email | Password | Primary Workspace Role |
| :--- | :--- | :--- | :--- |
| **Owner** | `owner@example.com` | `Password@123` | Owner (Acme Corporation) |
| **Admin** | `admin@example.com` | `Password@123` | Admin (Acme Corp) & Owner (RK Developers) |
| **Project Manager** | `manager@example.com` | `Password@123` | Project Manager (Acme Corporation) |
| **Member / Contributor** | `member@example.com` | `Password@123` | Member / Contributor (Acme Corporation) |
| **Viewer** | `viewer@example.com` | `Password@123` | Viewer (Acme Corporation) |

---

## 7. Troubleshooting & FAQs

### CORS Error in Browser Console
- Check `Backend/.env`: Ensure `CORS_ORIGINS` contains your frontend port (e.g. `["http://localhost:5173","http://127.0.0.1:5173"]`).

### Database Authentication Error
- Ensure PostgreSQL is running.
- Verify username and password in `DATABASE_URL` in `Backend/.env`.

### Alembic Migration Out-of-Sync
- To stamp current database state:
```bash
alembic stamp head
```
