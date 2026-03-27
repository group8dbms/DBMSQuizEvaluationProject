alter table users
drop constraint if exists users_role_check;

alter table users
add constraint users_role_check
check (role in ('admin', 'student', 'proctor', 'faculty', 'evaluator', 'auditor'));

create table if not exists case_evidence (
  id bigserial primary key,
  case_id bigint not null references cases(id) on delete cascade,
  source_type varchar(40) not null check (source_type in ('integrity_log', 'submission_hash', 'manual_note', 'system_flag')),
  notes text,
  payload jsonb default '{}'::jsonb,
  created_by bigint references users(id) on delete set null,
  created_at timestamp default now()
);

create table if not exists results (
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

create table if not exists recheck_requests (
  id bigserial primary key,
  result_id bigint not null references results(id) on delete cascade,
  student_id bigint not null references users(id) on delete cascade,
  reason text not null,
  status varchar(20) not null default 'requested' check (status in ('requested', 'reviewing', 'closed')),
  created_at timestamp default now(),
  resolved_at timestamp default null
);

create table if not exists audit_logs (
  id bigserial primary key,
  actor_id bigint references users(id) on delete set null,
  action_type varchar(60) not null,
  entity_type varchar(60) not null,
  entity_id bigint,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp default now()
);
