create table users (
  id bigserial primary key,
  auth_user_id uuid unique,
  email varchar(120) unique not null,
  password_hash text,
  role varchar(20) not null check (role in ('admin', 'student', 'proctor', 'faculty')),
  created_at timestamp default now()
);

create table exams (
  id bigserial primary key,
  title varchar(150) not null,
  start_time timestamp not null,
  end_time timestamp not null,
  config_json jsonb default '{}'::jsonb,
  created_by bigint references users(id) on delete set null,
  created_at timestamp default now(),
  check (end_time > start_time)
);

create table questions (
  id bigserial primary key,
  exam_id bigint not null references exams(id) on delete cascade,
  text text not null,
  type varchar(30) not null check (type in ('mcq', 'true_false', 'short_answer', 'long_answer')),
  correct_answer text,
  marks numeric(6,2) not null default 1,
  created_at timestamp default now()
);

create table submissions (
  id bigserial primary key,
  student_id bigint not null references users(id) on delete cascade,
  exam_id bigint not null references exams(id) on delete cascade,
  answer_data jsonb not null default '[]'::jsonb,
  final_hash text,
  status varchar(20) not null default 'draft' check (status in ('draft', 'submitted', 'under_review', 'evaluated')),
  submitted_at timestamp,
  created_at timestamp default now(),
  unique (student_id, exam_id)
);

create table integrity_logs (
  id bigserial primary key,
  submission_id bigint not null references submissions(id) on delete cascade,
  event_type varchar(50) not null check (event_type in ('tab_switch', 'ip_change', 'browser_exit', 'copy_paste', 'multiple_faces', 'suspicious_activity')),
  event_details jsonb default '{}'::jsonb,
  timestamp timestamp not null default now()
);

create table cases (
  id bigserial primary key,
  submission_id bigint not null references submissions(id) on delete cascade,
  proctor_id bigint references users(id) on delete set null,
  status varchar(20) not null default 'open' check (status in ('open', 'in_review', 'resolved', 'rejected')),
  verdict text,
  created_at timestamp default now(),
  resolved_at timestamp
);
