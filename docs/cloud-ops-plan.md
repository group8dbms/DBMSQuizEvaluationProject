# Cloud Ops Plan

This project now includes scaffolding for deployment, cloud storage, and background jobs.

## Backend Hosting Options

- `AWS EC2`: run the backend Docker image directly on an EC2 VM behind Nginx or Caddy.
- `Render`: use [render.yaml](C:/Users/bunty/OneDrive/Desktop/DBMSProject/render.yaml) with the backend Dockerfile.
- `Railway`: use [railway.toml](C:/Users/bunty/OneDrive/Desktop/DBMSProject/railway.toml) and the backend Dockerfile.
- `GCP Cloud Run`: deploy the backend from [backend/Dockerfile](C:/Users/bunty/OneDrive/Desktop/DBMSProject/backend/Dockerfile).

## Required Backend Environment Variables

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_URL`
- `PORT`

## Optional S3 Artifact Storage

Used for scanned scripts and generated reports.

- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`
- `AWS_S3_PUBLIC_BASE_URL`

API endpoint:
- `POST /api/artifacts/upload-url`

This endpoint creates an artifact record and returns a pre-signed S3 upload URL.

## Optional Background Jobs

Enable with:
- `ENABLE_BACKGROUND_JOBS=true`

Jobs implemented:
- stale draft submission cleanup
- pending result email notification processing

Optional mail settings:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

## Notes

- Without S3 env vars, artifact upload support stays disabled safely.
- Without SMTP env vars, notification jobs stay non-destructive and mark mail as failed/skipped.
- The frontend still needs separate hosting later, such as Vercel or Netlify.
