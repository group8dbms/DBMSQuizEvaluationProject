-- List all quizzes with their course and creator
select
  q.quiz_id,
  q.title,
  c.course_name,
  u.full_name as created_by,
  q.total_marks,
  q.time_limit_minutes
from quizzes q
left join courses c on c.course_id = q.course_id
left join users u on u.user_id = q.created_by
order by q.quiz_id;

-- Show all questions and options for a specific quiz
select
  q.question_id,
  q.question_text,
  q.question_type,
  q.marks,
  o.option_id,
  o.option_text
from questions q
left join options o on o.question_id = q.question_id
where q.quiz_id = 1
order by q.question_id, o.option_id;

-- Show student attempts with result summary
select
  a.attempt_id,
  u.full_name as student_name,
  q.title as quiz_title,
  a.status,
  a.started_at,
  a.submitted_at,
  r.total_score
from attempts a
join users u on u.user_id = a.student_id
join quizzes q on q.quiz_id = a.quiz_id
left join results r on r.attempt_id = a.attempt_id
order by a.attempt_id desc;

-- Calculate total awarded marks for each attempt from answers
select
  a.attempt_id,
  sum(ans.awarded_marks) as calculated_score
from attempts a
join answers ans on ans.attempt_id = a.attempt_id
group by a.attempt_id
order by a.attempt_id;

-- Leaderboard for a quiz
select
  u.full_name as student_name,
  q.title as quiz_title,
  r.total_score,
  rank() over (order by r.total_score desc) as quiz_rank
from results r
join attempts a on a.attempt_id = r.attempt_id
join users u on u.user_id = a.student_id
join quizzes q on q.quiz_id = a.quiz_id
where q.quiz_id = 1
order by r.total_score desc;
