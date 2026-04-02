# UniReserve Implementation Plan

## Summary
- Build the project from scratch as a monorepo with `unireserve-backend/` and `unireserve-frontend/`, following the SAD structure and PRD business rules.
- Keep runtime data access aligned with the docs: Django ORM for app logic, MySQL 8 as the only local database, Celery + Redis for async work, React 18 + Vite for the frontend.
- Add the missing persistence for manager approval via `ManagerApprovalRequest`, while keeping all other behavior strictly aligned to the PRD/SAD.

## Implementation Steps
1. Scaffold the backend and frontend repos, settings split, environment templates, Celery wiring, root routing, and dependency manifests with no feature logic yet.
2. Build the database foundation: create `setup.db` with MySQL SQL for database creation, all tables, foreign keys, indexes, triggers/safety nets, and default booking rules; create `connection.py` for local MySQL connection lifecycle, reuse, error handling, and bootstrap/query helpers.
3. Implement `core` and `accounts`: custom user model, email verification, password reset, JWT auth, cookie-only refresh/logout, profile endpoints, admin user management, and manager approval workflow backed by `ManagerApprovalRequest`.
4. Implement `facilities`: facility CRUD, operating hours/days, slot generation, slot blocking/editing, availability API, and facility-specific rule overrides.
5. Implement `bookings`: booking creation pipeline, rule enforcement, atomic capacity locking with `SELECT ... FOR UPDATE`, cancellation, check-in, manager approval/rejection for approval-required facilities, and waitlist join/leave/position flows.
6. Implement `notifications` and async processing: notification records, email templates, Celery email tasks, waitlist promotion, reminder scheduling, no-show detection, token cleanup, waitlist expiry, and auto-unban tasks.
7. Implement `analytics` and feedback: daily snapshots, manager/admin analytics endpoints, facility rankings, cancellation trends, ratings breakdown, student recommendations, feedback submission, and audit-log generation.
8. Implement the frontend shell using Stitch MCP components only: app routing, protected routes, auth/session handling, layouts, shared UI primitives, and API client integration against `/api/v1`.
9. Build student flows with Stitch MCP components: registration, login, facility browser/detail, booking flow, bookings history/detail, waitlist, notifications, profile, and feedback.
10. Build manager/admin flows with Stitch MCP components: manager dashboards, facility management, slot manager, pending approvals, analytics pages, admin user management, facilities, booking rules, audit log, and global analytics.
11. Run full verification: backend tests, frontend tests, E2E critical flows, manual role-based checks, and PRD/SAD conformance review before any polish work.

## Public Interfaces And Dependencies
- API base: `/api/v1` with modules for `auth`, `users`, `facilities`, `bookings`, `waitlist`, `notifications`, `analytics`, `recommendations`, and `feedback`.
- Preserve the documented response envelope and error-code contract from the PRD.
- Database schema will include: `users`, `email_verifications`, `manager_approval_requests`, `facilities`, `facility_slots`, `bookings`, `waitlist`, `booking_rules`, `notifications`, `feedback`, `audit_logs`, and `analytics_daily_snapshots`.
- Backend dependencies: Django, DRF, SimpleJWT, django-cors-headers, django-filter, django-environ, Celery, Redis, django-celery-beat, django-ratelimit, Pillow, drf-spectacular, pytest-django, factory-boy, and a Django-compatible MySQL driver.
- Frontend dependencies: React 18, Vite, React Router v6, TanStack Query, Axios, Zustand, Tailwind CSS, React Hook Form, Zod, date-fns, Chart.js, react-chartjs-2, react-hot-toast.
- Local services: MySQL 8 and Redis installed/running locally without Docker. Frontend UI generation depends on Stitch MCP availability.

## Test Plan
- Backend: registration, email verification, auth, refresh/logout, manager approval, facility CRUD, slot generation, booking rules, race-condition prevention, cancellation, waitlist promotion, no-show penalties, notifications, analytics snapshots, recommendations, and feedback eligibility.
- Frontend: role-based routing, auth flows, booking flow, waitlist UX, notification state, analytics rendering, and form validation/error handling.
- E2E: student registers and verifies, books and cancels, manager approves pending bookings, admin manages users/rules/facilities, no-show task updates status correctly.
- Conformance: after each implementation step, compare behavior back to PRD and SAD and stop if a deviation appears.

## Assumptions And Defaults
- SAD wins when PRD and SAD conflict on route shape or permission detail.
- `ManagerApprovalRequest` is added because the PRD names it but the schema omits it.
- Refresh/logout use the httpOnly cookie only; the frontend does not read the refresh token.
- `setup.db` is the required MySQL bootstrap artifact, but Django models/migrations will mirror the same schema so runtime logic stays aligned with the SAD’s ORM-first architecture.
- Frontend execution cannot begin until Stitch MCP is available in this workspace.
