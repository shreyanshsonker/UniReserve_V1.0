# UniReserve

UniReserve is a full-stack campus facility reservation platform. It allows students to browse campus spaces, check availability, reserve time slots, and manage upcoming bookings. It also includes manager/admin workflows for approval-based facilities, notifications, waitlists, analytics, and feedback at the API level.

This repository is organized as a monorepo with:

- `unireserve-backend/` for the Django + Django REST Framework API
- `unireserve-frontend/` for the React + Vite client

This README documents the current codebase as it exists today, how the pieces fit together, and how to run the project from scratch on both macOS and Windows.

## Root-Level Planning And Reference Files

At the repository root you will also see:

- `PLAN.md`
  - implementation plan / project roadmap
- `UniReserve_PRD.txt`
  - product requirements reference
- `UniReserve_SAD.txt`
  - software architecture/design reference
- `UniReserve_PRD.docx` and `UniReserve_SAD.docx`
  - document-format copies of the same planning material

These are useful for understanding intended scope and architecture, but the codebase should always be treated as the source of truth for what is actually implemented right now.

## Current Status

The project currently:

- runs locally with Django and Vite
- supports login, registration, profile bootstrap, facility browsing, facility detail + availability, booking creation, manager approval actions, and seeded demo data
- includes backend APIs for waitlists, notifications, analytics, and feedback
- supports SQLite for the easiest local setup
- supports MySQL when the database environment variables are supplied
- has Celery + Redis wiring for async tasks, but they are optional for the simplest local run

Verified locally in this workspace:

- `python3 --version` -> `Python 3.14.2`
- `node -v` -> `v24.13.0`
- backend checks pass
- backend tests pass
- frontend lint passes
- frontend production build passes

## Demo Accounts

After seeding demo data, you can use:

- Student: `student@unireserve.local` / `Password123!`
- Manager: `manager@unireserve.local` / `Password123!`
- Admin: `admin@unireserve.local` / `Password123!`

## Monorepo Layout

```text
.
├── PLAN.md
├── UniReserve_PRD.txt
├── UniReserve_SAD.txt
├── README.md
├── unireserve-backend/
│   ├── manage.py
│   ├── db.sqlite3
│   ├── setup.db
│   ├── connection.py
│   ├── .env.example
│   ├── requirements/
│   │   ├── base.txt
│   │   ├── development.txt
│   │   └── production.txt
│   ├── unireserve/
│   │   ├── __init__.py
│   │   ├── asgi.py
│   │   ├── celery.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── settings/
│   │       ├── base.py
│   │       ├── development.py
│   │       └── production.py
│   └── apps/
│       ├── core/
│       ├── accounts/
│       ├── facilities/
│       ├── bookings/
│       ├── notifications/
│       └── analytics/
└── unireserve-frontend/
    ├── package.json
    ├── package-lock.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── tsconfig.json
    ├── index.html
    ├── public/
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── api/
        ├── assets/
        ├── components/
        ├── layouts/
        ├── pages/
        ├── router/
        ├── stores/
        ├── types/
        └── utils/
```

## High-Level Architecture

At a high level, the flow is:

1. The React frontend renders the login/dashboard/facility pages.
2. It talks to the Django API under `/api/v1`.
3. Django views call serializers and service-layer functions.
4. Service-layer code performs business logic and database writes.
5. Celery tasks handle async side effects like notifications, waitlist promotion, and reminders.
6. The frontend uses a Zustand auth store plus an Axios client that automatically refreshes access tokens using the refresh cookie.

### Runtime Components

- Frontend: React 19, React Router, Axios, Zustand, Tailwind CSS 4, Vite
- Backend: Django 4.2, Django REST Framework, SimpleJWT, django-environ, django-cors-headers
- Async: Celery + Redis
- Database:
  - easiest local mode: SQLite fallback
  - full documented mode: MySQL via `DB_*` environment variables

## Important Current-State Notes

These are important if you are onboarding or debugging:

- The easiest local setup is SQLite, not MySQL.
- The backend only switches to MySQL if `DB_NAME` is present in the environment.
- If you copy `.env.example` exactly as-is, the backend will try to use MySQL.
- For a simple first run, create a minimal `.env` and do not include `DB_NAME`.
- Celery/Redis are configured, but you do not need them just to open the app, register, log in, browse facilities, and create bookings.
- In development/testing, registration currently auto-activates users so local sign-up is usable without email verification.
- Some backend capabilities are scaffolded at the API/task level even though there is not yet a dedicated frontend screen for them.
- There are a few empty scaffold directories in the frontend such as `src/pages/auth`, `src/pages/manager`, `src/pages/student`, and `src/components/ui`.
- `unireserve-backend/apps/node_modules/` appears to be leftover/generated noise and is not part of the Django runtime.

## Backend Walkthrough

### Backend Entry Points

- `unireserve-backend/manage.py`
  - standard Django command entry point
  - defaults to `unireserve.settings.development`

- `unireserve-backend/unireserve/urls.py`
  - root router for all API modules
  - also exposes:
    - `/api/schema/`
    - `/api/docs/`

- `unireserve-backend/unireserve/settings/base.py`
  - shared settings
  - custom user model
  - REST framework defaults
  - response envelope renderer
  - custom exception handling
  - SQLite fallback / MySQL conditional setup
  - JWT settings
  - Celery broker/result backend

- `unireserve-backend/unireserve/settings/development.py`
  - turns on development-friendly defaults
  - allows all CORS origins
  - uses console email backend if no external email backend is configured

### Other Backend Files At The Root

- `unireserve-backend/connection.py`
  - helper/bootstrap-oriented database script artifact from the original plan
  - not part of the normal Django request flow

- `unireserve-backend/setup.db`
  - planning/bootstrap artifact related to the original database setup concept
  - not the live SQLite app database used by the verified local setup

- `unireserve-backend/db.sqlite3`
  - the local SQLite development database used in the simple setup path

### Backend App Structure

#### `apps/core`

Core shared infrastructure used by the rest of the backend.

Key files:

- `apps/core/models.py`
  - `UUIDModel`
  - `TimeStampedModel`
  - soft-delete support via `SoftDeleteManager`

- `apps/core/permissions.py`
  - role-based permissions:
    - `IsStudent`
    - `IsManager`
    - `IsAdmin`
    - `IsOwnerOrAdmin`

- `apps/core/renderers.py`
  - wraps successful responses in a consistent envelope:
    - `success`
    - `data`
    - `message`

- `apps/core/exceptions.py`
  - custom business exceptions
  - error response formatting

- `apps/core/management/commands/seed_demo_data.py`
  - seeds demo users, facilities, and slots for local development

#### `apps/accounts`

Handles authentication, registration, user profiles, admin user management, and manager approvals.

Key files:

- `apps/accounts/models.py`
  - custom `User` model
  - `EmailVerification`
  - `ManagerApprovalRequest`

- `apps/accounts/serializers/auth.py`
  - login payload
  - password reset payloads

- `apps/accounts/serializers/registration.py`
  - student registration
  - manager registration

- `apps/accounts/serializers/profile.py`
  - profile serialization for `/users/me/`
  - admin-facing user serializer

- `apps/accounts/views/auth.py`
  - login
  - logout
  - token refresh
  - password reset request/confirm

- `apps/accounts/views/registration.py`
  - student signup
  - manager signup
  - email verification endpoint

- `apps/accounts/views/user.py`
  - current-user profile endpoint
  - admin user management viewset

- `apps/accounts/services/user_service.py`
  - email verification preparation
  - manager approval preparation
  - password reset flow
  - development/test-mode auto-activation shortcut

- `apps/accounts/urls_auth.py`
  - routes under `/api/v1/auth/`

- `apps/accounts/urls_users.py`
  - routes under `/api/v1/users/`

Current behavior:

- Login uses email + password.
- Access token is returned in the response body.
- Refresh token is stored in an HTTP-only cookie.
- The frontend never needs to read the refresh token directly.
- In development/testing, signup is immediately usable.

#### `apps/facilities`

Handles facilities, slots, and availability.

Key files:

- `apps/facilities/models.py`
  - `Facility`
  - `FacilitySlot`
  - `BookingRule`

- `apps/facilities/serializers/facility.py`
  - list serializer for the facility browser
  - full serializer for detail/admin operations

- `apps/facilities/serializers/slot.py`
  - slot serialization
  - availability serializer with status/color hints

- `apps/facilities/views/facility.py`
  - facility CRUD/list/detail

- `apps/facilities/views/slot.py`
  - slot CRUD
  - slot generation endpoint
  - slot block/unblock endpoint

- `apps/facilities/views/availability.py`
  - `/facilities/<facility_id>/availability/?date=YYYY-MM-DD`

- `apps/facilities/services/slot_generator.py`
  - generates contiguous slots
  - current default operating window is 08:00 to 22:00

Current behavior:

- Students can browse active facilities.
- Availability is loaded by facility + date.
- Slots can be generated programmatically.
- Approval-required facilities are supported.

#### `apps/bookings`

Handles booking creation, cancellations, approvals, waitlists, and booking-related background jobs.

Key files:

- `apps/bookings/models.py`
  - `Booking`
  - `Waitlist`

- `apps/bookings/serializers/booking.py`
  - booking create serializer
  - enriched booking response serializer used by the frontend

- `apps/bookings/serializers/waitlist.py`
  - waitlist list/create serialization

- `apps/bookings/views/booking.py`
  - list bookings
  - create booking
  - cancel booking
  - approve/reject booking
  - check in

- `apps/bookings/views/waitlist.py`
  - join waitlist
  - leave waitlist

- `apps/bookings/services/booking_service.py`
  - atomic booking create/cancel/approval/check-in logic
  - slot capacity updates

- `apps/bookings/services/waitlist_service.py`
  - waitlist position management
  - waitlist expiry timestamp generation

- `apps/bookings/tasks.py`
  - waitlist promotion
  - no-show detection
  - waitlist expiry
  - reminder dispatch

Current behavior:

- Booking creation is atomic.
- Slot capacity is incremented/decremented at the service layer.
- Approval-required facilities create `PENDING` bookings.
- Non-approval facilities become `CONFIRMED` immediately.
- Cancellation can trigger waitlist promotion via Celery.

Known limitation:

- `BookingRuleEngine.validate_rules()` is still a placeholder, so advanced booking-rule enforcement is not fully implemented yet.

#### `apps/notifications`

Notification storage, read state, and email dispatch.

Key files:

- `apps/notifications/models.py`
  - `Notification`

- `apps/notifications/serializers/notification.py`
  - notification payloads

- `apps/notifications/views/notification.py`
  - list notifications
  - mark one as read
  - mark all as read

- `apps/notifications/tasks.py`
  - create notification
  - send email notification

Current behavior:

- Notification APIs exist and work at the backend level.
- Email sending is task-based.
- There is no dedicated frontend notifications page yet.

#### `apps/analytics`

Analytics, audit logs, and feedback.

Key files:

- `apps/analytics/models.py`
  - `Feedback`
  - `AuditLog`
  - `AnalyticsDailySnapshot`

- `apps/analytics/serializers/feedback.py`
  - feedback create/list payloads

- `apps/analytics/serializers/analytics.py`
  - snapshot and audit log payloads

- `apps/analytics/views/feedback.py`
  - students can create feedback for completed bookings
  - managers/admin can list feedback

- `apps/analytics/views/analytics.py`
  - read-only analytics snapshots
  - read-only audit logs

Current behavior:

- Feedback APIs exist.
- Analytics and audit log read APIs exist.
- Frontend coverage for these APIs is still limited.

### Backend API Map

Primary routes:

| Area | Example routes |
| --- | --- |
| Auth | `/api/v1/auth/register/student/`, `/api/v1/auth/login/`, `/api/v1/auth/logout/`, `/api/v1/auth/token/refresh/` |
| Users | `/api/v1/users/me/`, `/api/v1/users/` |
| Facilities | `/api/v1/facilities/`, `/api/v1/facilities/<id>/`, `/api/v1/facilities/<id>/availability/`, `/api/v1/facilities/slots/` |
| Bookings | `/api/v1/bookings/`, `/api/v1/bookings/<id>/cancel/`, `/api/v1/bookings/<id>/approve/`, `/api/v1/bookings/<id>/reject/` |
| Waitlist | `/api/v1/waitlist/`, `/api/v1/waitlist/<id>/leave/` |
| Notifications | `/api/v1/notifications/`, `/api/v1/notifications/<id>/mark_read/`, `/api/v1/notifications/mark_all_read/` |
| Analytics | `/api/v1/analytics/feedback/`, `/api/v1/analytics/snapshots/`, `/api/v1/analytics/audit-logs/` |
| Docs | `/api/docs/`, `/api/schema/` |

## Frontend Walkthrough

### Frontend Entry Points

- `unireserve-frontend/src/main.tsx`
  - React bootstrap

- `unireserve-frontend/src/App.tsx`
  - initializes auth on app load
  - fetches `/users/me/`
  - marks auth store as initialized

### Frontend Core Modules

#### `src/api/client.ts`

Central Axios client.

Responsibilities:

- sets `baseURL` to `http://localhost:8000/api/v1` by default
- adds `Authorization: Bearer <token>` when an access token exists
- on `401`, tries `/auth/token/refresh/` using the HTTP-only refresh cookie
- retries the original request after refreshing

#### `src/stores/authStore.ts`

Zustand auth store.

Stores:

- `user`
- `accessToken`
- `isAuthenticated`
- `isInitialized`

Methods:

- `setUser`
- `setAccessToken`
- `setInitialized`
- `logout`

#### `src/router/index.tsx`

Application routes:

- `/auth/login`
- `/auth/register`
- `/dashboard`
- `/facilities`
- `/facilities/:id`
- `/manager`

#### `src/components/ProtectedRoute.tsx`

Protects routes until:

- auth state has initialized
- user is authenticated
- role matches when required

#### `src/layouts/AuthLayout.tsx`

Wrapper for auth pages.

#### `src/layouts/MainLayout.tsx`

Main signed-in shell.

Responsibilities:

- top navigation
- logout behavior
- manager-only navigation item visibility
- route outlet rendering

### Frontend Pages

#### `src/pages/Login.tsx`

- email/password sign-in
- calls `/auth/login/`
- stores access token
- loads `/users/me/`
- redirects to `/dashboard`

#### `src/pages/Register.tsx`

- student registration form
- calls `/auth/register/student/`
- redirects to login on success

#### `src/pages/Dashboard.tsx`

- loads the authenticated user's bookings from `/bookings/`
- shows basic booking stats
- renders upcoming bookings list

#### `src/pages/FacilityBrowser.tsx`

- loads `/facilities/`
- client-side facility search
- links each facility card to its detail page

#### `src/pages/FacilityDetail.tsx`

- loads facility detail
- loads date-based availability
- allows booking submission
- handles approval-required vs instant-book facilities

#### `src/pages/ManagerDashboard.tsx`

- loads bookings
- filters pending ones
- provides approve/reject buttons

### Frontend Supporting Files

- `src/types/api.ts`
  - shared frontend types for:
    - API envelope
    - auth payloads
    - users
    - facilities
    - slots
    - bookings

- `src/utils/api.ts`
  - extracts readable error messages from API responses

- `src/utils/dateTime.ts`
  - slot date/time formatting helpers

- `src/index.css`
  - app-wide styling
  - Tailwind utilities + custom CSS component classes

- `tailwind.config.js`
  - custom colors and fonts

- `postcss.config.js`
  - Tailwind PostCSS integration

- `unireserve-frontend/README.md`
  - leftover generic Vite template README
  - this root `README.md` is the authoritative project guide

## End-to-End Runtime Flow

### Login Flow

1. User submits email + password on the frontend.
2. Frontend calls `POST /api/v1/auth/login/`.
3. Backend authenticates using the custom email-based user model.
4. Backend returns:
   - access token in JSON
   - refresh token in HTTP-only cookie
5. Frontend stores the access token in Zustand.
6. Frontend calls `GET /api/v1/users/me/`.
7. App becomes authenticated and routes unlock.

### Booking Flow

1. User opens `/facilities/:id`.
2. Frontend loads:
   - facility detail
   - availability for the selected date
3. User selects a slot and clicks book.
4. Frontend posts to `POST /api/v1/bookings/`.
5. Backend service:
   - locks the slot
   - checks capacity
   - updates `booked_count`
   - creates booking
6. If facility requires approval:
   - booking status is `PENDING`
7. Otherwise:
   - booking status is `CONFIRMED`

### Token Refresh Flow

1. Access token expires.
2. API call returns `401`.
3. Axios interceptor sends `POST /api/v1/auth/token/refresh/`.
4. Backend reads refresh cookie and returns a new access token.
5. Frontend retries the original request automatically.

## Local Setup Overview

There are two practical ways to run this project:

### Option A: Basic Local Run

Use:

- SQLite
- no Redis required
- no MySQL required
- no Celery worker required

This is the recommended first run.

### Option B: Full Local Stack

Use:

- MySQL
- Redis
- Celery worker
- Celery beat

This is closer to the original architecture documents and is better for testing background jobs and full async behavior.

## Environment Files

### Backend: Minimal `.env` For Basic SQLite Setup

Create `unireserve-backend/.env` with the following:

```env
SECRET_KEY=django-insecure-local-dev-key-please-change-me
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost
FRONTEND_URL=http://localhost:5173
REDIS_URL=redis://127.0.0.1:6379/0
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=15
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7
```

Important:

- Do not add `DB_NAME` if you want SQLite fallback.
- If `DB_NAME` is present, the backend will try to connect to MySQL.

### Backend: Full MySQL Setup

If you want MySQL, start from `unireserve-backend/.env.example` and create `unireserve-backend/.env` with valid values.

In MySQL mode you should define:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

### Frontend Environment

The frontend works without a `.env` file because it defaults to:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

If you want a custom backend URL, create `unireserve-frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

## macOS Setup From Scratch

### 1. Install prerequisites

Recommended with Homebrew:

```bash
brew install python node
```

Optional for full async/full-stack mode:

```bash
brew install redis mysql
```

### 2. Open the project

```bash
cd "/Users/shrey/Desktop/Shrey/Pyhton/Python PBL MVP"
```

### 3. Create and activate the backend virtual environment

```bash
python3 -m venv unireserve-backend/venv
source unireserve-backend/venv/bin/activate
python -m pip install --upgrade pip
pip install -r unireserve-backend/requirements/development.txt
```

### 4. Install frontend dependencies

```bash
cd unireserve-frontend
npm install
cd ..
```

### 5. Create the backend `.env`

Create `unireserve-backend/.env` using the minimal SQLite example shown earlier.

### 6. Apply migrations

```bash
cd unireserve-backend
python manage.py migrate
```

### 7. Seed demo data

```bash
python manage.py seed_demo_data
```

### 8. Start the backend

```bash
python manage.py runserver
```

Backend will usually be available at:

- `http://127.0.0.1:8000/`
- API docs: `http://127.0.0.1:8000/api/docs/`

### 9. Start the frontend in a second terminal

```bash
cd "/Users/shrey/Desktop/Shrey/Pyhton/Python PBL MVP/unireserve-frontend"
npm run dev
```

Frontend will usually be available at:

- `http://localhost:5173/`

### 10. Optional: Start Redis and Celery

Start Redis:

```bash
brew services start redis
```

Start MySQL if you are using MySQL mode:

```bash
brew services start mysql
```

Start Celery worker:

```bash
cd "/Users/shrey/Desktop/Shrey/Pyhton/Python PBL MVP/unireserve-backend"
source venv/bin/activate
celery -A unireserve worker -l info
```

Start Celery beat:

```bash
cd "/Users/shrey/Desktop/Shrey/Pyhton/Python PBL MVP/unireserve-backend"
source venv/bin/activate
celery -A unireserve beat -l info
```

## Windows Setup From Scratch

The included `unireserve-backend/venv` in this repository is machine-specific. On Windows, create your own virtual environment instead of trying to reuse the checked-in one.

### 1. Install prerequisites

Recommended:

- Python 3.12+ from [python.org](https://www.python.org/downloads/windows/) or `winget`
- Node.js LTS from [nodejs.org](https://nodejs.org/) or `winget`

Optional install via `winget`:

```powershell
winget install Python.Python.3.12
winget install OpenJS.NodeJS.LTS
```

Optional for the full stack:

- MySQL
- Redis via WSL2, Docker Desktop, or a Windows-compatible Redis distribution

### 2. Open PowerShell in the project root

```powershell
cd "C:\path\to\Python PBL MVP"
```

### 3. Create and activate the backend virtual environment

```powershell
py -m venv unireserve-backend\venv
.\unireserve-backend\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r unireserve-backend\requirements\development.txt
```

If PowerShell blocks script execution, run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

Then activate again:

```powershell
.\unireserve-backend\venv\Scripts\Activate.ps1
```

### 4. Install frontend dependencies

```powershell
cd unireserve-frontend
npm install
cd ..
```

### 5. Create the backend `.env`

Create `unireserve-backend\.env` using the minimal SQLite example shown earlier.

### 6. Apply migrations

```powershell
cd unireserve-backend
python manage.py migrate
```

### 7. Seed demo data

```powershell
python manage.py seed_demo_data
```

### 8. Start the backend

```powershell
python manage.py runserver
```

### 9. Start the frontend in a second PowerShell window

```powershell
cd "C:\path\to\Python PBL MVP\unireserve-frontend"
npm run dev
```

### 10. Optional: Start Celery

If Redis is available and you want async jobs:

```powershell
cd "C:\path\to\Python PBL MVP\unireserve-backend"
.\venv\Scripts\Activate.ps1
celery -A unireserve worker -l info
```

Optional beat process:

```powershell
cd "C:\path\to\Python PBL MVP\unireserve-backend"
.\venv\Scripts\Activate.ps1
celery -A unireserve beat -l info
```

## Quickest Run If Dependencies Already Exist

If backend dependencies are already installed and frontend `node_modules` already exists, the shortest path is:

### macOS

```bash
cd "/Users/shrey/Desktop/Shrey/Pyhton/Python PBL MVP/unireserve-backend"
./venv/bin/python manage.py migrate
./venv/bin/python manage.py seed_demo_data
./venv/bin/python manage.py runserver
```

In a second terminal:

```bash
cd "/Users/shrey/Desktop/Shrey/Pyhton/Python PBL MVP/unireserve-frontend"
npm run dev
```

### Windows

```powershell
cd "C:\path\to\Python PBL MVP\unireserve-backend"
.\venv\Scripts\Activate.ps1
python manage.py migrate
python manage.py seed_demo_data
python manage.py runserver
```

In a second PowerShell:

```powershell
cd "C:\path\to\Python PBL MVP\unireserve-frontend"
npm run dev
```

## Full MySQL + Redis Mode

If you want to run closer to the original design documents:

1. Create `unireserve-backend/.env` from `.env.example`
2. Make sure MySQL is running and the configured database/user exists
3. Make sure Redis is running
4. Run:

```bash
cd unireserve-backend
python manage.py migrate
python manage.py runserver
celery -A unireserve worker -l info
celery -A unireserve beat -l info
```

5. In the frontend:

```bash
cd unireserve-frontend
npm run dev
```

## Verification Commands

### Backend

macOS:

```bash
cd "/Users/shrey/Desktop/Shrey/Pyhton/Python PBL MVP/unireserve-backend"
./venv/bin/python manage.py check
./venv/bin/python manage.py test
```

Windows:

```powershell
cd "C:\path\to\Python PBL MVP\unireserve-backend"
.\venv\Scripts\Activate.ps1
python manage.py check
python manage.py test
```

### Frontend

macOS or Windows:

```bash
cd unireserve-frontend
npm run lint
npm run build
```

## Useful URLs

- Frontend app: `http://localhost:5173/`
- Backend root: `http://127.0.0.1:8000/`
- OpenAPI docs: `http://127.0.0.1:8000/api/docs/`
- OpenAPI schema: `http://127.0.0.1:8000/api/schema/`

## Common Development Commands

### Reset SQLite database

macOS:

```bash
cd "/Users/shrey/Desktop/Shrey/Pyhton/Python PBL MVP/unireserve-backend"
rm db.sqlite3
./venv/bin/python manage.py migrate
./venv/bin/python manage.py seed_demo_data
```

Windows PowerShell:

```powershell
cd "C:\path\to\Python PBL MVP\unireserve-backend"
Remove-Item db.sqlite3
.\venv\Scripts\Activate.ps1
python manage.py migrate
python manage.py seed_demo_data
```

### Reinstall frontend dependencies

```bash
cd unireserve-frontend
rm -rf node_modules package-lock.json
npm install
```

Windows:

```powershell
cd unireserve-frontend
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force
npm install
```

## Troubleshooting

### The backend tries to connect to MySQL but I want SQLite

Cause:

- `DB_NAME` is present in `unireserve-backend/.env`

Fix:

- remove the `DB_*` entries from `.env`
- rerun `python manage.py migrate`

### Registration or login seems broken on a fresh local setup

Check:

- migrations were applied
- you seeded demo data
- backend is running on `8000`
- frontend is pointing at `http://localhost:8000/api/v1`

### The frontend loads but has missing styles

Run:

```bash
cd unireserve-frontend
npm install
npm run build
```

This project needs the Tailwind PostCSS plugin installed from `package.json`.

### PowerShell will not activate the virtual environment

Run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

Then:

```powershell
.\unireserve-backend\venv\Scripts\Activate.ps1
```

### Celery tasks fail

Likely causes:

- Redis is not running
- `REDIS_URL` is wrong
- worker process was not started

### Port 8000 or 5173 is already in use

Backend:

```bash
python manage.py runserver 8001
```

Frontend:

- either accept the alternate Vite port it offers
- or set `VITE_API_URL` to the backend port you chose

## Known Limitations

- Advanced booking-rule enforcement is not fully implemented yet because `BookingRuleEngine.validate_rules()` is still a placeholder.
- Some email/approval workflows are simplified for development mode.
- Notifications, analytics, and feedback are stronger on the backend than on the frontend right now.
- The automated test suite is still small and currently focuses on smoke coverage.
- Some generated/scaffold placeholder files still exist in the backend app roots.

## Suggested Reading Order For New Contributors

If you are new to the project, this is a good order:

1. `PLAN.md`
2. `UniReserve_PRD.txt`
3. `UniReserve_SAD.txt`
4. `unireserve-backend/unireserve/settings/base.py`
5. `unireserve-backend/unireserve/urls.py`
6. `unireserve-backend/apps/accounts/`
7. `unireserve-backend/apps/facilities/`
8. `unireserve-backend/apps/bookings/`
9. `unireserve-frontend/src/App.tsx`
10. `unireserve-frontend/src/api/client.ts`
11. `unireserve-frontend/src/router/index.tsx`
12. `unireserve-frontend/src/pages/`

## Summary

UniReserve is already structured like a real production-style monorepo:

- Django backend with app-based separation
- React frontend with typed API access
- role-based auth and route protection
- booking and waitlist domain logic
- seeded demo data
- optional async/background processing support

If your goal is to get productive quickly, start with:

1. SQLite mode
2. `migrate`
3. `seed_demo_data`
4. backend `runserver`
5. frontend `npm run dev`

Once that is stable, move to MySQL/Redis/Celery only if you specifically need to test async workflows or the full documented stack.
