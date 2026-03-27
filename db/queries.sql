-- List all exams with creator information
select
  e.id,
  e.title,
  e.start_time,
  e.end_time,
  e.config_json,
  u.email as created_by
from exams e
left join users u on u.id = e.created_by
order by e.id;

-- Show all questions for an exam
select
  q.id,
  q.exam_id,
  q.text,
  q.type,
  q.correct_answer,
  q.marks
from questions q
where q.exam_id = 1
order by q.id;

-- Show student assignments for each exam
select
  ea.id as assignment_id,
  e.title as exam_title,
  u.email as student_email,
  ea.assigned_at
from exam_assignments ea
join exams e on e.id = ea.exam_id
join users u on u.id = ea.student_id
order by ea.assigned_at desc;

-- Show submissions with exam and student details
select
  s.id as submission_id,
  u.email as student_email,
  e.title as exam_title,
  s.status,
  s.final_hash,
  s.submitted_at
from submissions s
join users u on u.id = s.student_id
join exams e on e.id = s.exam_id
order by s.id desc;

-- Show integrity log events for a submission
select
  il.id,
  il.submission_id,
  il.event_type,
  il.event_details,
  il.timestamp
from integrity_logs il
where il.submission_id = 1
order by il.timestamp;

-- Show all cases with proctor and submission details
select
  c.id as case_id,
  c.status,
  c.verdict,
  p.email as proctor_email,
  s.id as submission_id,
  e.title as exam_title
from cases c
join submissions s on s.id = c.submission_id
join exams e on e.id = s.exam_id
left join users p on p.id = c.proctor_id
order by c.id desc;
