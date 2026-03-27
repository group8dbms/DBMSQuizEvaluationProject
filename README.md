# DBMSQuizEvaluationProject

This project now includes:

- a Supabase PostgreSQL schema for exam integrity workflows
- a Node.js + Express backend with auth, exams, submissions, integrity logs, and case review
- a React + Vite frontend for login, exam management, student submission flow, and review dashboards
- Postman collections and PDF documentation in the repo

## Run Locally

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Default local URLs:

- Backend: `http://127.0.0.1:4000`
- Frontend: `http://127.0.0.1:5173`

## Docs

- `docs/backend-modules-guide.pdf`
- `docs/backend-api-contracts.pdf`

## Hosting Note

This project still needs deployment/hosting setup.

Suggested path:

- host the frontend on Vercel or Netlify
- host the backend on Render, Railway, or a VPS
- keep Supabase as the managed database/auth provider
- set production environment variables separately for frontend and backend
