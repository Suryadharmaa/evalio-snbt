begin;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  alias text check (char_length(alias) between 1 and 60),
  cohort_year smallint not null check (cohort_year between 2026 and 2100),
  study_goal text check (char_length(study_goal) between 1 and 500),
  created_at timestamptz not null,
  delete_requested_at timestamptz
);

alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant update (alias, cohort_year, study_goal) on public.profiles to authenticated;

create policy "Students can read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Students can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table public.user_consents (
  user_id uuid not null references auth.users(id) on delete cascade,
  policy_version text not null,
  consent_type text not null check (consent_type = 'privacy_notice_acknowledgment'),
  granted_at timestamptz not null,
  primary key (user_id, policy_version, consent_type)
);

alter table public.user_consents enable row level security;
revoke all on public.user_consents from public, anon, authenticated;
grant select on public.user_consents to authenticated;

create policy "Students can read their own privacy acknowledgment"
  on public.user_consents for select to authenticated
  using ((select auth.uid()) = user_id);

create schema evalio_private;
revoke all on schema evalio_private from public, anon, authenticated;

create table evalio_private.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('editor', 'admin')),
  primary key (user_id, role)
);

alter table evalio_private.user_roles enable row level security;
revoke all on evalio_private.user_roles from public, anon, authenticated;

create function evalio_private.initialize_student()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  supplied_year text := new.raw_user_meta_data ->> 'cohort_year';
  target_year smallint := 2027;
begin
  if (new.raw_user_meta_data ->> 'privacy_notice_version') is distinct from 'evalio-preview-1' then
    raise exception 'A current privacy notice acknowledgment is required' using errcode = '23514';
  end if;

  if supplied_year ~ '^[0-9]{4}$' then
    if supplied_year::integer between 2026 and 2100 then
      target_year := supplied_year::smallint;
    end if;
  end if;

  insert into public.profiles (user_id, cohort_year, created_at)
    values (new.id, target_year, new.created_at);

  insert into public.user_consents (user_id, policy_version, consent_type, granted_at)
    values (new.id, 'evalio-preview-1', 'privacy_notice_acknowledgment', new.created_at);

  return new;
end;
$$;

revoke all on function evalio_private.initialize_student() from public, anon, authenticated;

create trigger initialize_evalio_student
  after insert on auth.users
  for each row execute function evalio_private.initialize_student();

-- Existing Auth accounts can get a profile without an invented consent record.
insert into public.profiles (user_id, cohort_year, created_at)
  select id, 2027, created_at from auth.users;

create function public.request_account_deletion()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  requested_at timestamptz;
begin
  if owner_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  update public.profiles
    set delete_requested_at = coalesce(delete_requested_at, statement_timestamp())
    where user_id = owner_id
    returning delete_requested_at into requested_at;

  return requested_at;
end;
$$;

revoke all on function public.request_account_deletion() from public, anon, authenticated;
grant execute on function public.request_account_deletion() to authenticated;

commit;
