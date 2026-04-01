create table if not exists question_options (
  id bigserial primary key,
  question_id bigint not null references questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  created_at timestamp default now()
);

create table if not exists stored_artifacts (
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

create table if not exists notification_queue (
  id bigserial primary key,
  recipient_email varchar(160) not null,
  subject text not null,
  body text not null,
  status varchar(20) not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  result_id bigint references results(id) on delete cascade,
  created_at timestamp default now(),
  sent_at timestamp
);
