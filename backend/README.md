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

- `/api/health`
- `/api/users`
- `/api/exams`
- `/api/submissions`
- `/api/integrity-logs`
- `/api/cases`

## Temporary Role Simulation

Until real auth is wired in, the backend reads:

- `x-user-id`
- `x-user-role`

from request headers to simulate logged-in users and role checks.
