insert into users (email, password_hash, role) values
  ('admin@group8dbms.local', 'demo_hash_admin', 'admin'),
  ('student1@group8dbms.local', 'demo_hash_student1', 'student'),
  ('student2@group8dbms.local', 'demo_hash_student2', 'student'),
  ('proctor1@group8dbms.local', 'demo_hash_proctor', 'proctor');

insert into exams (title, start_time, end_time, config_json, created_by) values
  (
    'DBMS Midterm Demo',
    now() - interval '1 day',
    now() + interval '1 day',
    '{
      "duration_minutes": 60,
      "negative_marking": false,
      "tab_switch_limit": 3,
      "ip_tracking": true
    }'::jsonb,
    1
  );

insert into questions (exam_id, text, type, correct_answer, marks) values
  (1, 'What does DBMS stand for?', 'mcq', 'Database Management System', 2),
  (1, 'A primary key must be unique for every row.', 'true_false', 'True', 2),
  (1, 'Write the SQL command used to fetch data from a table.', 'short_answer', 'SELECT', 3),
  (1, 'Write a SQL query to list all students ordered by name.', 'coding', 'SELECT * FROM students ORDER BY name;', 3);

insert into exam_assignments (exam_id, student_id, assigned_by) values
  (1, 2, 1),
  (1, 3, 1);

insert into submissions (student_id, exam_id, answer_data, final_hash, status, submitted_at) values
  (
    2,
    1,
    '[
      {"question_id": 1, "answer": "Database Management System"},
      {"question_id": 2, "answer": "True"},
      {"question_id": 3, "answer": "SELECT * FROM students;"}
    ]'::jsonb,
    'sample-final-hash-001',
    'submitted',
    now()
  );

insert into integrity_logs (submission_id, event_type, event_details) values
  (1, 'tab_switch', '{"count": 1, "note": "Student switched tab once."}'::jsonb),
  (1, 'ip_change', '{"old_ip": "10.0.0.5", "new_ip": "10.0.0.8"}'::jsonb);

insert into cases (submission_id, proctor_id, status, verdict) values
  (1, 4, 'open', 'Pending manual review by proctor.');
