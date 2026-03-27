# Hosting Note

The project is currently ready for local development, but it still needs hosting before it can be used as a deployed application.

## Suggested Deployment Split

- Frontend: Vercel or Netlify
- Backend: Render, Railway, or a VPS
- Database/Auth: Supabase

## Minimum Production Tasks

1. Deploy the backend and expose a public base URL.
2. Deploy the frontend and point it to the production backend URL.
3. Set production environment variables:
   - backend: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PORT`
   - frontend: `VITE_API_BASE_URL`
4. Enable proper CORS rules on the backend for the deployed frontend domain.
5. Use confirmed production user accounts and stronger admin onboarding rules.
6. Verify all protected routes with the deployed URLs.

## Important

- Do not commit real production secrets into the repo.
- Keep the Supabase service role key on the backend only.
