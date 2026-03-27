create table if not exists exam_assignments (
  id bigserial primary key,
  exam_id bigint not null references exams(id) on delete cascade,
  student_id bigint not null references users(id) on delete cascade,
  assigned_by bigint references users(id) on delete set null,
  assigned_at timestamp default now(),
  unique (exam_id, student_id)
);

alter table questions
drop constraint if exists questions_type_check;

alter table questions
add constraint questions_type_check
check (type in ('mcq', 'true_false', 'short_answer', 'long_answer', 'coding'));
