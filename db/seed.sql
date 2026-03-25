insert into users (full_name, email, role) values
  ('Project Admin', 'admin@group8dbms.local', 'admin'),
  ('Faculty Demo', 'faculty@group8dbms.local', 'faculty'),
  ('Student One', 'student1@group8dbms.local', 'student'),
  ('Student Two', 'student2@group8dbms.local', 'student');

insert into courses (course_name, course_code, created_by) values
  ('Database Management Systems', 'DBMS101', 2);

insert into quizzes (course_id, title, description, total_marks, time_limit_minutes, created_by) values
  (1, 'SQL Basics Quiz', 'Introductory quiz for SQL and relational model concepts.', 10, 20, 2);

insert into questions (quiz_id, question_text, question_type, marks) values
  (1, 'Which SQL statement is used to retrieve data from a table?', 'mcq', 2),
  (1, 'What does DBMS stand for?', 'mcq', 2),
  (1, 'A primary key must be unique for every row.', 'true_false', 2);

insert into options (question_id, option_text, is_correct) values
  (1, 'SELECT', true),
  (1, 'INSERT', false),
  (1, 'UPDATE', false),
  (1, 'DELETE', false),
  (2, 'Database Management System', true),
  (2, 'Data Backup Management Solution', false),
  (2, 'Digital Base Mapping Service', false),
  (2, 'Dynamic Buffer Management Setup', false),
  (3, 'True', true),
  (3, 'False', false);

insert into attempts (quiz_id, student_id, submitted_at, status) values
  (1, 3, now(), 'evaluated');

insert into answers (attempt_id, question_id, selected_option_id, awarded_marks, is_correct) values
  (1, 1, 1, 2, true),
  (1, 2, 5, 2, true),
  (1, 3, 9, 2, true);

insert into results (attempt_id, total_score, remarks) values
  (1, 6, 'Sample fully correct attempt for demo and testing.');
