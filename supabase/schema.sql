create extension if not exists vector;
create extension if not exists pgcrypto;

create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null,
  latitude double precision not null,
  longitude double precision not null,
  embedding vector(1536),
  status text not null default 'open' check (status in ('open', 'assigned', 'resolved')),
  priority_score integer not null default 40 check (priority_score between 0 and 100),
  report_count integer not null default 1 check (report_count >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists complaints (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  user_id uuid null,
  description text not null,
  latitude double precision not null,
  longitude double precision not null,
  image_url text null,
  similarity_score double precision null,
  created_at timestamptz not null default now()
);

create table if not exists issue_updates (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  status text not null,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists issues_category_idx on issues(category);
create index if not exists complaints_issue_id_idx on complaints(issue_id);

create or replace function match_issues(
  query_embedding vector(1536),
  match_count int default 5
)
returns table (
  id uuid,
  title text,
  category text,
  latitude double precision,
  longitude double precision,
  report_count integer,
  priority_score integer,
  created_at timestamptz,
  similarity double precision
)
language sql stable
as $$
  select
    i.id,
    i.title,
    i.category,
    i.latitude,
    i.longitude,
    i.report_count,
    i.priority_score,
    i.created_at,
    1 - (i.embedding <=> query_embedding) as similarity
  from issues i
  where i.embedding is not null
  order by i.embedding <=> query_embedding
  limit match_count;
$$;

-- Hackathon seed data can be inserted after generating embeddings through the app.
