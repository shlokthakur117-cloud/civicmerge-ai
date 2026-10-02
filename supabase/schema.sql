create extension if not exists vector with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null
    check (category in ('pothole', 'streetlight', 'garbage', 'water_leak', 'drainage', 'other')),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  embedding extensions.vector(384),
  status text not null default 'open'
    check (status in ('open', 'assigned', 'in_progress', 'resolved')),
  department text not null default 'unassigned'
    check (department in ('unassigned', 'roads', 'water', 'waste', 'electrical', 'drainage', 'general')),
  source text not null default 'live'
    check (source in ('live', 'demo')),
  priority_score integer not null default 40 check (priority_score between 0 and 100),
  report_count integer not null default 1 check (report_count >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues(id) on delete cascade,
  user_id uuid null references auth.users(id) on delete set null,
  description text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  image_url text null,
  similarity_score double precision null,
  created_at timestamptz not null default now()
);

create table if not exists public.issue_updates (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues(id) on delete cascade,
  status text not null check (status in ('open', 'assigned', 'in_progress', 'resolved')),
  message text,
  created_at timestamptz not null default now()
);

create index if not exists issues_category_idx on public.issues(category);
create index if not exists issues_status_idx on public.issues(status);
create index if not exists issues_department_idx on public.issues(department);
create index if not exists issues_source_idx on public.issues(source);
create index if not exists issues_priority_idx on public.issues(priority_score desc);
create index if not exists complaints_issue_id_idx on public.complaints(issue_id);
create index if not exists issue_updates_issue_id_idx on public.issue_updates(issue_id);

alter table public.issues enable row level security;
alter table public.complaints enable row level security;
alter table public.issue_updates enable row level security;

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'complaint-images',
  'complaint-images',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.match_issues(
  query_embedding extensions.vector(384),
  query_latitude double precision,
  query_longitude double precision,
  match_count integer default 10,
  max_distance_m double precision default 300
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
  similarity double precision,
  distance_m double precision
)
language sql
stable
set search_path = public, extensions
as $$
  with candidates as (
    select
      i.*,
      (
        6371000 * 2 * asin(
          sqrt(
            power(sin(radians(i.latitude - query_latitude) / 2), 2) +
            cos(radians(query_latitude)) *
            cos(radians(i.latitude)) *
            power(sin(radians(i.longitude - query_longitude) / 2), 2)
          )
        )
      ) as computed_distance_m
    from public.issues i
    where i.embedding is not null
      and i.status <> 'resolved'
      and i.source = 'live'
  )
  select
    c.id,
    c.title,
    c.category,
    c.latitude,
    c.longitude,
    c.report_count,
    c.priority_score,
    c.created_at,
    1 - (c.embedding <=> query_embedding) as similarity,
    c.computed_distance_m as distance_m
  from candidates c
  where c.computed_distance_m <= max_distance_m
  order by c.embedding <=> query_embedding
  limit least(greatest(match_count, 1), 50);
$$;

revoke all on function public.match_issues(
  extensions.vector,
  double precision,
  double precision,
  integer,
  double precision
) from public;

grant execute on function public.match_issues(
  extensions.vector,
  double precision,
  double precision,
  integer,
  double precision
) to service_role;
