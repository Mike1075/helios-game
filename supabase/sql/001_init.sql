create table if not exists agent_logs (
  id bigserial primary key,
  session_id text not null,
  speaker text not null check (char_length(speaker) <= 20),
  text text not null,
  meta jsonb default '{}'::jsonb,
  ts timestamptz default now()
);

create table if not exists belief_systems (
  character_id uuid primary key,
  belief_yaml text not null default '',
  last_updated timestamptz default now()
);

create table if not exists events (
  id bigserial primary key,
  session_id text,
  type text not null,
  payload jsonb default '{}'::jsonb,
  ts timestamptz default now()
);

alter table agent_logs enable row level security;
alter table belief_systems enable row level security;
alter table events enable row level security;