# Backend

This is the Node.js and Express backend for the exam integrity blueprint.

## Stack

- Node.js
- Express
- Supabase JavaScript client

## Commands

```bash
npm install
npm run dev
```

## Environment

The backend reads the root `.env` file and requires:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `PORT`

## API Groups

- `/api/auth`
- `/api/health`
- `/api/users`
- `/api/exams`
- `/api/submissions`
- `/api/integrity-logs`
- `/api/cases`

## Authentication

The backend now expects a Supabase access token in:

- `Authorization: Bearer <access_token>`

Protected routes load the authenticated Supabase user, then map that user through `users.auth_user_id` to enforce application roles.

Starter auth routes:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

Use `/api/auth/signup` to create a Supabase auth user and a matching `users` row in the project database.

## Current Behavior

- Public signup only creates `student` accounts.
- Protected routes require a valid Supabase Bearer token.
- Role checks are enforced from the `users` table, not from client-supplied headers.
- Students can only view and modify their own submissions.
- Submissions can only be started, saved, and submitted while the exam window is active.
