# Database Setup

This folder contains the starter PostgreSQL files for the `DBMSQuizEvaluationProject`.

## Files

- `schema.sql`: Creates the main tables for users, exams, questions, submissions, integrity logs, and cases.
- `seed.sql`: Inserts demo data so the team can test the schema quickly.
- `queries.sql`: Contains common SQL queries for browsing exam, submission, and integrity data.

## Supabase Quick Start

1. Create a new Supabase project.
2. Open the SQL Editor in Supabase.
3. Run `schema.sql`.
4. Run `seed.sql`.
5. Test the queries from `queries.sql`.

## Notes

- Keep future schema changes in SQL files and commit them to Git.
- Do not store real database passwords in the repository.
- If you use Supabase Auth, prefer storing the auth user id in `auth_user_id` and avoid relying on `password_hash` in application code.
