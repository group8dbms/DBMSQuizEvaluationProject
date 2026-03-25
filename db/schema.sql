create table users (
  user_id bigserial primary key,
  full_name varchar(100) not null,
  email varchar(120) unique not null,
  role varchar(20) not null check (role in ('admin', 'faculty', 'student')),
  created_at timestamp default now()
);

create table courses (
  course_id bigserial primary key,
  course_name varchar(100) not null,
  course_code varchar(30) unique not null,
  created_by bigint references users(user_id) on delete set null
);

create table quizzes (
  quiz_id bigserial primary key,
  course_id bigint references courses(course_id) on delete cascade,
  title varchar(150) not null,
  description text,
  total_marks numeric(6,2) default 0,
  time_limit_minutes integer,
  created_by bigint references users(user_id) on delete set null,
  created_at timestamp default now()
);

create table questions (
  question_id bigserial primary key,
  quiz_id bigint not null references quizzes(quiz_id) on delete cascade,
  question_text text not null,
  question_type varchar(20) not null check (question_type in ('mcq', 'short', 'true_false')),
  marks numeric(6,2) not null default 1
);

create table options (
  option_id bigserial primary key,
  question_id bigint not null references questions(question_id) on delete cascade,
  option_text text not null,
  is_correct boolean default false
);

create table attempts (
  attempt_id bigserial primary key,
  quiz_id bigint not null references quizzes(quiz_id) on delete cascade,
  student_id bigint not null references users(user_id) on delete cascade,
  started_at timestamp default now(),
  submitted_at timestamp,
  status varchar(20) not null default 'in_progress' check (status in ('in_progress', 'submitted', 'evaluated'))
);

create table answers (
  answer_id bigserial primary key,
  attempt_id bigint not null references attempts(attempt_id) on delete cascade,
  question_id bigint not null references questions(question_id) on delete cascade,
  selected_option_id bigint references options(option_id) on delete set null,
  answer_text text,
  awarded_marks numeric(6,2) default 0,
  is_correct boolean,
  unique (attempt_id, question_id)
);

create table results (
  result_id bigserial primary key,
  attempt_id bigint unique not null references attempts(attempt_id) on delete cascade,
  total_score numeric(8,2) not null default 0,
  evaluated_at timestamp default now(),
  remarks text
);
