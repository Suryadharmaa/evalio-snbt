begin;

-- The stable identity is shared across versions. Names and categories are snapshots.
create table public.subtests (
  code text primary key check (code ~ '^[A-Z][A-Z0-9]{1,11}$')
);

create table public.exam_blueprints (
  id uuid primary key default gen_random_uuid(),
  exam_year smallint not null check (exam_year between 2000 and 2199),
  version smallint not null check (version between 1 and 9999),
  classification text not null check (classification in ('historical_reference', 'official')),
  status text not null default 'draft' check (status in ('draft', 'published', 'superseded')),
  total_questions integer not null check (total_questions > 0),
  duration_seconds integer not null check (duration_seconds > 0),
  published_at timestamptz,
  draft_revision bigint not null default 0,
  unique (exam_year, version),
  check ((status = 'draft') = (published_at is null))
);

create unique index exam_blueprints_one_published_version_per_year
  on public.exam_blueprints (exam_year) where status = 'published';

create table public.blueprint_sections (
  blueprint_id uuid not null references public.exam_blueprints(id),
  subtest_code text not null references public.subtests(code),
  name text not null check (btrim(name) <> ''),
  category text not null check (category in ('TPS', 'LITERASI')),
  question_count integer not null check (question_count > 0),
  duration_seconds integer check (duration_seconds > 0),
  ordinal smallint not null check (ordinal > 0),
  primary key (blueprint_id, subtest_code),
  unique (blueprint_id, ordinal)
);

create index blueprint_sections_subtest_code_idx on public.blueprint_sections (subtest_code);

create table public.topics (
  blueprint_id uuid not null,
  subtest_code text not null,
  code text not null check (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (btrim(name) <> ''),
  parent_code text,
  primary key (blueprint_id, subtest_code, code),
  foreign key (blueprint_id, subtest_code)
    references public.blueprint_sections(blueprint_id, subtest_code),
  foreign key (blueprint_id, subtest_code, parent_code)
    references public.topics(blueprint_id, subtest_code, code),
  check (parent_code is distinct from code)
);

create index topics_parent_idx on public.topics (blueprint_id, subtest_code, parent_code);

create table public.exam_rule_sources (
  blueprint_id uuid not null references public.exam_blueprints(id),
  url text not null check (url ~ '^https://[^[:space:]]+$'),
  title text not null check (btrim(title) <> ''),
  publisher text not null check (btrim(publisher) <> ''),
  verified_on date not null,
  primary key (blueprint_id, url)
);

alter table public.subtests enable row level security;
alter table public.exam_blueprints enable row level security;
alter table public.blueprint_sections enable row level security;
alter table public.topics enable row level security;
alter table public.exam_rule_sources enable row level security;

revoke all on public.subtests, public.exam_blueprints, public.blueprint_sections, public.topics,
  public.exam_rule_sources from public, anon, authenticated, service_role;
grant select on public.subtests, public.exam_blueprints, public.blueprint_sections, public.topics,
  public.exam_rule_sources to anon, authenticated;

create policy "Public reads approved blueprint versions" on public.exam_blueprints
  for select to anon, authenticated using (status in ('published', 'superseded'));

-- The parent lookup inherits blueprint RLS. Subtest identities are visible only through approved sections.
create policy "Public reads approved sections" on public.blueprint_sections
  for select to anon, authenticated using (
    exists (select 1 from public.exam_blueprints b where b.id = blueprint_id)
  );
create policy "Public reads approved topic snapshots" on public.topics
  for select to anon, authenticated using (
    exists (select 1 from public.exam_blueprints b where b.id = blueprint_id)
  );
create policy "Public reads approved sources" on public.exam_rule_sources
  for select to anon, authenticated using (
    exists (select 1 from public.exam_blueprints b where b.id = blueprint_id)
  );
create policy "Public reads subtests used in approved versions" on public.subtests
  for select to anon, authenticated using (
    exists (select 1 from public.blueprint_sections s where s.subtest_code = code)
  );

create function evalio_private.guard_blueprint()
returns trigger language plpgsql set search_path = ''
as $$
declare
  sections bigint;
  timed_sections bigint;
  questions bigint;
  seconds bigint;
  last_ordinal smallint;
begin
  if tg_op = 'INSERT' then
    if new.status <> 'draft' then
      raise exception 'Blueprints must start in draft' using errcode = '23514';
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.status <> 'draft' then
      raise exception 'Approved blueprints cannot be deleted' using errcode = '23514';
    end if;
    return old;
  end if;

  if old.status <> 'draft' then
    if old.status = 'published' and new.status = 'superseded'
      and (to_jsonb(new) - 'status') = (to_jsonb(old) - 'status') then
      return new;
    end if;
    raise exception 'Approved blueprints are immutable' using errcode = '23514';
  end if;

  if (new.id, new.exam_year, new.version) is distinct from (old.id, old.exam_year, old.version) then
    raise exception 'Blueprint identity is immutable' using errcode = '23514';
  end if;
  if new.status = 'draft' then
    return new;
  end if;
  if new.status <> 'published' then
    raise exception 'Draft blueprints must be published before superseding' using errcode = '23514';
  end if;

  select count(*), count(duration_seconds), sum(question_count), sum(duration_seconds), max(ordinal)
    into sections, timed_sections, questions, seconds, last_ordinal
    from public.blueprint_sections where blueprint_id = new.id;

  if sections = 0 or last_ordinal <> sections or questions <> new.total_questions then
    raise exception 'Sections must be contiguous and match the blueprint question total' using errcode = '23514';
  end if;
  if timed_sections <> 0 and (timed_sections <> sections or seconds <> new.duration_seconds) then
    raise exception 'Section durations must be complete and match the blueprint duration' using errcode = '23514';
  end if;
  if not exists (
    select from public.exam_rule_sources where blueprint_id = new.id and verified_on <= current_date
  ) or exists (
    select from public.exam_rule_sources where blueprint_id = new.id and verified_on > current_date
  ) then
    raise exception 'Publishing requires dated, verified sources' using errcode = '23514';
  end if;
  new.published_at := statement_timestamp();
  return new;
end;
$$;

create trigger guard_blueprint before insert or update or delete on public.exam_blueprints
  for each row execute function evalio_private.guard_blueprint();

create function evalio_private.guard_blueprint_child()
returns trigger language plpgsql set search_path = ''
as $$
declare
  owner_blueprint uuid;
begin
  if tg_op = 'UPDATE' and new.blueprint_id is distinct from old.blueprint_id then
    raise exception 'A record cannot move between blueprints' using errcode = '23514';
  end if;
  owner_blueprint := case when tg_op = 'DELETE' then old.blueprint_id else new.blueprint_id end;

  -- A parent write serializes draft edits with publishing, including under repeatable read.
  update public.exam_blueprints set draft_revision = draft_revision + 1
    where id = owner_blueprint and status = 'draft';
  if not found and exists (select from public.exam_blueprints where id = owner_blueprint) then
    raise exception 'Approved blueprint records are immutable' using errcode = '23514';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger a_guard_section before insert or update or delete on public.blueprint_sections
  for each row execute function evalio_private.guard_blueprint_child();
create trigger a_guard_topic before insert or update or delete on public.topics
  for each row execute function evalio_private.guard_blueprint_child();
create trigger a_guard_source before insert or update or delete on public.exam_rule_sources
  for each row execute function evalio_private.guard_blueprint_child();

create function evalio_private.guard_topic_ancestry()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if new.parent_code is not null and exists (
    with recursive ancestors(code, parent_code) as (
      select t.code, t.parent_code from public.topics t
        where t.blueprint_id = new.blueprint_id and t.subtest_code = new.subtest_code
          and t.code = new.parent_code
      union
      select t.code, t.parent_code from public.topics t
        join ancestors a on a.parent_code = t.code
        where t.blueprint_id = new.blueprint_id and t.subtest_code = new.subtest_code
    )
    select from ancestors where code = new.code
  ) then
    raise exception 'Topic ancestry must be acyclic' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger z_guard_topic_ancestry before insert or update on public.topics
  for each row execute function evalio_private.guard_topic_ancestry();

revoke all on function evalio_private.guard_blueprint(), evalio_private.guard_blueprint_child(),
  evalio_private.guard_topic_ancestry() from public, anon, authenticated, service_role;

commit;
