# Postman

This folder contains a ready-to-import Postman collection and environment for the backend.

## Files

- `DBMSQuizEvaluationProject.postman_collection.json`
- `DBMSQuizEvaluationProject.postman_environment.json`

## Suggested Run Order

1. Start the backend with `npm run dev` from the `backend` folder.
2. Import the collection and environment into Postman.
3. Fill in these environment values:
   - `studentEmail`
   - `studentPassword`
   - `adminEmail`
   - `adminPassword`
   - `examStartTime`
   - `examEndTime`
4. Run:
   - `Auth / Student Login`
   - `Auth / Admin Login`
   - `Auth / Current Student Profile`
   - `Exams / Create Active Exam`
   - `Exams / Add Question To Exam`
   - `Submissions / Start Submission`
   - `Submissions / Save Submission`
   - `Submissions / Submit Submission`
   - `Integrity And Cases / Create Integrity Log`
   - `Integrity And Cases / List Cases`

## Notes

- `Create Active Exam` stores `examId` automatically.
- Set `examStartTime` to a past ISO value and `examEndTime` to a future ISO value.
- `Add Question To Exam` stores `questionId` automatically.
- `Start Submission` stores `submissionId` automatically.
- If your Supabase project requires confirmed email addresses, use confirmed accounts for login requests.
