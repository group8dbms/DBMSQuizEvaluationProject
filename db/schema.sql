create table users (
  id bigserial primary key,
  auth_user_id uuid unique,
  email varchar(120) unique not null,
  password_hash text,
  role varchar(20) not null check (role in ('admin', 'student', 'proctor', 'faculty', 'evaluator', 'auditor')),
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
  type varchar(30) not null check (type in ('mcq', 'true_false', 'short_answer', 'long_answer', 'coding')),
  correct_answer text,
  marks numeric(6,2) not null default 1,
  created_at timestamp default now()
);

create table question_options (
  id bigserial primary key,
  question_id bigint not null references questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  created_at timestamp default now()
);

create table exam_assignments (
  id bigserial primary key,
  exam_id bigint not null references exams(id) on delete cascade,
  student_id bigint not null references users(id) on delete cascade,
  assigned_by bigint references users(id) on delete set null,
  assigned_at timestamp default now(),
  unique (exam_id, student_id)
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

create table case_evidence (
  id bigserial primary key,
  case_id bigint not null references cases(id) on delete cascade,
  source_type varchar(40) not null check (source_type in ('integrity_log', 'submission_hash', 'manual_note', 'system_flag')),
  notes text,
  payload jsonb default '{}'::jsonb,
  created_by bigint references users(id) on delete set null,
  created_at timestamp default now()
);

create table results (
  id bigserial primary key,
  submission_id bigint unique not null references submissions(id) on delete cascade,
  evaluator_id bigint references users(id) on delete set null,
  total_score numeric(6,2) not null default 0,
  feedback text,
  status varchar(20) not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamp,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table recheck_requests (
  id bigserial primary key,
  result_id bigint not null references results(id) on delete cascade,
  student_id bigint not null references users(id) on delete cascade,
  reason text not null,
  status varchar(20) not null default 'requested' check (status in ('requested', 'reviewing', 'closed')),
  created_at timestamp default now(),
  resolved_at timestamp
);

create table audit_logs (
  id bigserial primary key,
  actor_id bigint references users(id) on delete set null,
  action_type varchar(60) not null,
  entity_type varchar(60) not null,
  entity_id bigint,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp default now()
);

create table stored_artifacts (
  id bigserial primary key,
  submission_id bigint references submissions(id) on delete cascade,
  result_id bigint references results(id) on delete cascade,
  uploaded_by bigint references users(id) on delete set null,
  artifact_type varchar(40) not null check (artifact_type in ('scanned_script', 'evaluation_report', 'audit_report')),
  provider varchar(20) not null default 's3',
  object_key text not null,
  file_name text not null,
  content_type text,
  public_url text,
  created_at timestamp default now()
);

create table notification_queue (
  id bigserial primary key,
  recipient_email varchar(160) not null,
  subject text not null,
  body text not null,
  status varchar(20) not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  result_id bigint references results(id) on delete cascade,
  created_at timestamp default now(),
  sent_at timestamp
);
