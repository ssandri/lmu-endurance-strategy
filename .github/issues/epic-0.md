## Description
Set up the base project scaffolding that all other epics build on.

## Scope
- Express server with session-based auth (email/password registration + login)
- SQLite database with migrations (users table)
- React + Vite frontend with React Router
- Login/Register pages
- Auth middleware protecting all `/api/*` routes
- Dev scripts (`npm run dev` starts both server and client)
- CORS configured for local development

## User Stories
- NF-03: All pages and API endpoints require an authenticated user session
- NF-06: A REST API exposes all operations

## Acceptance Criteria
- [ ] `npm run install:all` installs all dependencies
- [ ] `npm run dev` starts server on :3001 and client on :3000
- [ ] POST `/api/auth/register` creates a user with hashed password
- [ ] POST `/api/auth/login` returns a session cookie
- [ ] GET `/api/auth/me` returns current user or 401
- [ ] Unauthenticated requests to `/api/*` return 401
- [ ] Frontend shows login page when not authenticated
- [ ] After login, user lands on an empty dashboard shell
