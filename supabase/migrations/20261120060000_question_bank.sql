begin;

alter table evalio_private.user_roles drop constraint user_roles_role_check;
alter table evalio_private.user_roles add constraint user_roles_role_check
  check (role in ('editor', 'reviewer', 'admin'));

create table evalio_private.question_license_records (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('original', 'licensed')),
  owner_name text not null check (char_length(btrim(owner_name)) between 1 and 200),
  provenance text not null check (char_length(btrim(provenance)) between 1 and 2000),
  agreement_ref text,
  source_url text check (source_url ~ '^https://[^[:space:]]+$' and char_length(source_url) <= 2048),
  check ((kind = 'original' and agreement_ref is null) or
    (kind = 'licensed' and agreement_ref is not null and char_length(btrim(agreement_ref)) between 1 and 500))
);

create table evalio_private.passages (
  id uuid primary key default gen_random_uuid()
);

create table evalio_private.passage_versions (
  id uuid primary key default gen_random_uuid(),
  passage_id uuid not null references evalio_private.passages(id),
  version integer not null check (version > 0),
  body text not null check (char_length(btrim(body)) between 1 and 10000),
  render_payload jsonb not null default '{}' check (jsonb_typeof(render_payload) = 'object'),
  license_id uuid not null references evalio_private.question_license_records(id),
  unique (passage_id, version)
);

create table evalio_private.questions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default statement_timestamp()
);

create table evalio_private.question_versions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references evalio_private.questions(id),
  version integer not null check (version > 0),
  revision integer not null default 1 check (revision > 0),
  author_id uuid not null,
  blueprint_id uuid not null,
  subtest_code text not null,
  topic_code text not null,
  passage_version_id uuid references evalio_private.passage_versions(id),
  license_id uuid not null references evalio_private.question_license_records(id),
  format text not null default 'single_choice' check (format = 'single_choice'),
  stem text not null check (char_length(btrim(stem)) between 1 and 5000),
  render_payload jsonb not null default '{}' check (jsonb_typeof(render_payload) = 'object'),
  difficulty text not null check (difficulty in ('easy','medium','hard')),
  tags text[] not null default '{}' check (cardinality(tags) <= 8),
  status text not null default 'draft' check (status in ('draft','in_review','published','retired')),
  created_at timestamptz not null default statement_timestamp(),
  published_at timestamptz,
  check ((status in ('published','retired')) = (published_at is not null)),
  unique (question_id, version),
  foreign key (blueprint_id, subtest_code, topic_code) references public.topics(blueprint_id, subtest_code, code)
);

create unique index question_versions_one_open on evalio_private.question_versions (question_id)
  where status in ('draft','in_review');
create unique index question_versions_one_published on evalio_private.question_versions (question_id)
  where status = 'published';
create index question_versions_selection on evalio_private.question_versions
  (blueprint_id, subtest_code, topic_code, difficulty) where status = 'published';

create table evalio_private.question_options (
  version_id uuid not null references evalio_private.question_versions(id),
  position integer not null check (position between 1 and 5),
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  primary key (version_id, position)
);
create unique index question_options_distinct_body on evalio_private.question_options (version_id, lower(btrim(body)));

create table evalio_private.question_answer_keys (
  version_id uuid primary key,
  correct_position integer not null,
  explanation text not null check (char_length(btrim(explanation)) between 1 and 5000),
  foreign key (version_id, correct_position) references evalio_private.question_options(version_id, position)
);

create table evalio_private.question_reviews (
  version_id uuid not null references evalio_private.question_versions(id),
  revision integer not null,
  reviewer_id uuid not null,
  decision text not null check (decision in ('approved','rejected')),
  notes text not null check (char_length(btrim(notes)) between 1 and 2000),
  reviewed_at timestamptz not null default statement_timestamp(),
  primary key (version_id, revision)
);

create table evalio_private.question_audit_events (
  id bigint generated always as identity primary key,
  version_id uuid not null references evalio_private.question_versions(id),
  actor_id uuid not null,
  event text not null check (event in ('created','saved','submitted','approved','rejected','published','retired','forked')),
  revision integer not null,
  occurred_at timestamptz not null default statement_timestamp()
);
create index question_audit_events_version on evalio_private.question_audit_events (version_id, id desc);

create table evalio_private.question_reports (
  version_id uuid not null references evalio_private.question_versions(id),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('content','answer','rendering','other')),
  notes text not null default '' check (char_length(notes) <= 1000),
  reported_at timestamptz not null default statement_timestamp(),
  primary key (version_id, reporter_id)
);
create index question_reports_reporter on evalio_private.question_reports (reporter_id);

-- Every direct table path is denied. Narrow definer functions are the only application interface.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['question_license_records','passages','passage_versions','questions',
    'question_versions','question_options','question_answer_keys','question_reviews','question_audit_events','question_reports']
  loop
    execute format('alter table evalio_private.%I enable row level security', table_name);
    execute format('revoke all on evalio_private.%I from public, anon, authenticated, service_role', table_name);
  end loop;
end;
$$;

create function evalio_private.freeze_question_version()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'draft' then
      raise exception 'Question versions must start as drafts' using errcode = '23514';
    end if;
    return new;
  end if;
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then
      raise exception 'Reviewed versions cannot be deleted' using errcode = '23514';
    end if;
    return old;
  end if;

  if (old.id, old.question_id, old.version, old.author_id, old.created_at) is distinct from
     (new.id, new.question_id, new.version, new.author_id, new.created_at) then
    raise exception 'Question version identity is immutable' using errcode = '23514';
  end if;

  if old.status = 'draft' and new.status = 'draft' then return new; end if;
  if old.status = 'draft' and new.status = 'in_review'
    and (to_jsonb(old) - 'status') = (to_jsonb(new) - 'status')
    and (select count(*) from evalio_private.question_options where version_id = old.id) >= 2
    and exists (select from evalio_private.question_answer_keys where version_id = old.id) then
    return new;
  end if;
  if old.status = 'in_review' and new.status = 'draft' and new.revision = old.revision + 1
    and (to_jsonb(old) - 'status' - 'revision') = (to_jsonb(new) - 'status' - 'revision')
    and exists (select from evalio_private.question_reviews
      where version_id = old.id and revision = old.revision and decision = 'rejected') then
    return new;
  end if;
  if old.status = 'in_review' and new.status = 'published'
    and (to_jsonb(old) - 'status' - 'published_at') = (to_jsonb(new) - 'status' - 'published_at')
    and exists (select from evalio_private.question_reviews r
      where r.version_id = old.id and r.revision = old.revision and r.decision = 'approved'
        and not exists (select from evalio_private.question_versions v
          where v.question_id = old.question_id and v.author_id = r.reviewer_id)) then
    return new;
  end if;
  if old.status = 'published' and new.status = 'retired'
    and (to_jsonb(old) - 'status') = (to_jsonb(new) - 'status') then
    return new;
  end if;
  raise exception 'Invalid transition or immutable question snapshot' using errcode = '23514';
end;
$$;
create trigger freeze_question_version before insert or update or delete on evalio_private.question_versions
  for each row execute function evalio_private.freeze_question_version();

create function evalio_private.guard_question_child()
returns trigger language plpgsql set search_path = '' as $$
declare
  target_id uuid := case when tg_op = 'DELETE' then old.version_id else new.version_id end;
begin
  if tg_op = 'UPDATE' and old.version_id is distinct from new.version_id then
    raise exception 'Question children cannot be moved between versions' using errcode = '23514';
  end if;
  perform id from evalio_private.question_versions where id = target_id and status = 'draft' for update;
  if not found then
    raise exception 'Only drafts can change options and keys' using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger guard_options before insert or update or delete on evalio_private.question_options
  for each row execute function evalio_private.guard_question_child();
create trigger guard_keys before insert or update or delete on evalio_private.question_answer_keys
  for each row execute function evalio_private.guard_question_child();

create function evalio_private.reject_snapshot_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'This snapshot is append-only' using errcode = '23514';
end;
$$;
create trigger freeze_passage before update or delete on evalio_private.passage_versions
  for each row execute function evalio_private.reject_snapshot_mutation();
create trigger freeze_license before update or delete on evalio_private.question_license_records
  for each row execute function evalio_private.reject_snapshot_mutation();
create trigger freeze_review before update or delete on evalio_private.question_reviews
  for each row execute function evalio_private.reject_snapshot_mutation();
create trigger freeze_audit before update or delete on evalio_private.question_audit_events
  for each row execute function evalio_private.reject_snapshot_mutation();

create function evalio_private.editorial_roles()
returns text[] language sql stable set search_path = '' as $$
  select array(select role from evalio_private.user_roles where user_id = auth.uid() order by role)
$$;

create function evalio_private.lock_question_version(p_version uuid, p_revision integer)
returns evalio_private.question_versions language plpgsql set search_path = '' as $$
declare
  snapshot evalio_private.question_versions;
begin
  perform q.id from evalio_private.questions q
    join evalio_private.question_versions v on v.question_id = q.id where v.id = p_version for update of q;
  select * into snapshot from evalio_private.question_versions where id = p_version for update;
  if snapshot.id is null or snapshot.revision is distinct from p_revision then
    raise exception 'Question version changed or is unavailable' using errcode = '40001';
  end if;
  return snapshot;
end;
$$;

create function public.editorial_access()
returns text[] language sql stable security definer set search_path = '' as $$
  select evalio_private.editorial_roles()
$$;

create function public.editorial_save_question(p_version uuid, p_revision integer, p_draft jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  staff text[] := evalio_private.editorial_roles();
  snapshot evalio_private.question_versions;
  target_question uuid;
  target_version uuid;
  target_revision integer;
  target_blueprint uuid;
  target_subtest text;
  target_topic text;
  selected_passage uuid;
  new_passage text;
  passage_identity uuid;
  passage_number integer;
  licensing uuid;
  answer integer;
  option_count integer;
begin
  if actor is null or not (staff && array['editor','admin']) then
    raise exception 'Editor access required' using errcode = '42501';
  end if;
  target_blueprint := (p_draft->>'blueprint_id')::uuid;
  target_subtest := p_draft->>'subtest_code';
  target_topic := p_draft->>'topic_code';
  selected_passage := nullif(p_draft->>'passage_version_id','')::uuid;
  new_passage := nullif(btrim(p_draft->>'passage_text'),'');
  answer := (p_draft->>'answer')::integer;
  if p_version is not null then
    snapshot := evalio_private.lock_question_version(p_version, p_revision);
    if snapshot.status <> 'draft' or snapshot.author_id <> actor then
      raise exception 'Only the draft author may edit it' using errcode = '42501';
    end if;
  end if;

  if jsonb_typeof(p_draft->'options') is distinct from 'array'
    or jsonb_typeof(p_draft->'tags') is distinct from 'array' then
    raise exception 'Options and tags must be arrays' using errcode = '23514';
  end if;
  option_count := jsonb_array_length(p_draft->'options');
  if option_count not between 2 and 5 or answer is null or answer not between 1 and option_count
    or exists (select from jsonb_array_elements(p_draft->'options') v where jsonb_typeof(v) <> 'string')
    or exists (select from jsonb_array_elements(p_draft->'tags') v
      where jsonb_typeof(v) <> 'string' or char_length(btrim(v #>> '{}')) not between 1 and 40) then
    raise exception 'Invalid options, answer, or editorial tags' using errcode = '23514';
  end if;
  if not exists (select from public.exam_blueprints where id = target_blueprint and status in ('published','superseded')) then
    raise exception 'Approved taxonomy required' using errcode = '23514';
  end if;

  insert into evalio_private.question_license_records(kind, owner_name, provenance, agreement_ref, source_url)
    values (p_draft->>'license_kind', btrim(p_draft->>'owner_name'), btrim(p_draft->>'provenance'),
      nullif(btrim(p_draft->>'agreement_ref'),''), nullif(btrim(p_draft->>'source_url'),''))
    returning id into licensing;

  if new_passage is not null then
    if selected_passage is null then
      insert into evalio_private.passages default values returning id into passage_identity;
    else
      select p.id into passage_identity from evalio_private.passages p
        join evalio_private.passage_versions v on v.passage_id = p.id
        where v.id = selected_passage for update of p;
      if passage_identity is null then
        raise exception 'Passage version is unavailable' using errcode = '23503';
      end if;
    end if;
    select coalesce(max(version), 0) + 1 into passage_number from evalio_private.passage_versions
      where passage_id = passage_identity;
    insert into evalio_private.passage_versions(passage_id, version, body, license_id)
      values (passage_identity, passage_number, new_passage, licensing) returning id into selected_passage;
  end if;

  if p_version is null then
    insert into evalio_private.questions default values returning id into target_question;
    insert into evalio_private.question_versions
      (question_id, version, author_id, blueprint_id, subtest_code, topic_code, passage_version_id, license_id, stem, difficulty, tags)
      values (target_question, 1, actor, target_blueprint, target_subtest, target_topic,
        selected_passage, licensing, btrim(p_draft->>'stem'), p_draft->>'difficulty',
        array(select btrim(value) from jsonb_array_elements_text(p_draft->'tags')))
      returning id, revision into target_version, target_revision;
  else
    update evalio_private.question_versions set
      revision = revision + 1, blueprint_id = target_blueprint, subtest_code = target_subtest,
      topic_code = target_topic, passage_version_id = selected_passage, license_id = licensing,
      stem = btrim(p_draft->>'stem'), difficulty = p_draft->>'difficulty',
      tags = array(select btrim(value) from jsonb_array_elements_text(p_draft->'tags'))
      where id = p_version returning id, revision into target_version, target_revision;
    delete from evalio_private.question_answer_keys where version_id = target_version;
    delete from evalio_private.question_options where version_id = target_version;
  end if;

  insert into evalio_private.question_options(version_id, position, body)
    select target_version, n, btrim(value)
    from jsonb_array_elements_text(p_draft->'options') with ordinality as options(value, n);
  insert into evalio_private.question_answer_keys values (target_version, answer, btrim(p_draft->>'explanation'));
  insert into evalio_private.question_audit_events(version_id, actor_id, event, revision)
    values (target_version, actor, case when p_version is null then 'created' else 'saved' end, target_revision);
  return target_version;
end;
$$;

create function public.editorial_transition_question(
  p_version uuid, p_revision integer, p_action text, p_notes text default null, p_answer integer default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  staff text[] := evalio_private.editorial_roles();
  snapshot evalio_private.question_versions;
  next_id uuid;
  affected record;
  event_name text := p_action;
begin
  if actor is null or not (case p_action
    when 'submit' then staff && array['editor','admin']
    when 'fork' then staff && array['editor','admin']
    when 'approve' then 'reviewer' = any(staff)
    when 'reject' then 'reviewer' = any(staff)
    when 'publish' then 'admin' = any(staff)
    when 'retire' then 'admin' = any(staff)
    else false end) then
    raise exception 'Editorial role required for this action' using errcode = '42501';
  end if;
  snapshot := evalio_private.lock_question_version(p_version, p_revision);

  case p_action
  when 'submit' then
    if snapshot.status <> 'draft' or snapshot.author_id <> actor then
      raise exception 'Only the draft author may submit it' using errcode = '42501';
    end if;
    if (select count(*) from evalio_private.question_options where version_id = p_version) < 2
      or not exists (select from evalio_private.question_answer_keys where version_id = p_version) then
      raise exception 'Complete options, key and explanation before review' using errcode = '23514';
    end if;
    update evalio_private.question_versions set status = 'in_review' where id = p_version;
    event_name := 'submitted';
  when 'approve', 'reject' then
    if snapshot.status <> 'in_review' or exists (
      select from evalio_private.question_versions where question_id = snapshot.question_id and author_id = actor
    ) then
      raise exception 'Independent review required' using errcode = '42501';
    end if;
    if p_action = 'approve' and (p_answer is null or p_answer not between 1 and 5) then
      raise exception 'An independently selected answer is required' using errcode = '23514';
    end if;
    -- An incorrect attempt resolves this review as rejected. The reviewer only gets
    -- one independent answer per revision and cannot probe the key with retries.
    event_name := case when p_action = 'approve' and exists (
      select from evalio_private.question_answer_keys where version_id = p_version and correct_position = p_answer
    ) then 'approved' else 'rejected' end;
    insert into evalio_private.question_reviews(version_id, revision, reviewer_id, decision, notes)
      values (p_version, p_revision, actor, event_name, btrim(p_notes));
    if event_name = 'rejected' then
      update evalio_private.question_versions set status = 'draft', revision = revision + 1 where id = p_version;
    end if;
  when 'publish' then
    if snapshot.status <> 'in_review' or not exists (
      select from evalio_private.question_reviews
        where version_id = p_version and revision = p_revision and decision = 'approved'
          and reviewer_id <> snapshot.author_id
    ) then
      raise exception 'Independent approval is required before publication' using errcode = '23514';
    end if;
    for affected in
      update evalio_private.question_versions set status = 'retired'
        where question_id = snapshot.question_id and status = 'published' returning id, revision
    loop
      insert into evalio_private.question_audit_events(version_id,actor_id,event,revision)
        values (affected.id,actor,'retired',affected.revision);
    end loop;
    update evalio_private.question_versions set status = 'published', published_at = statement_timestamp()
      where id = p_version;
    event_name := 'published';
  when 'retire' then
    if snapshot.status <> 'published' then
      raise exception 'Only published versions can retire' using errcode = '23514';
    end if;
    update evalio_private.question_versions set status = 'retired' where id = p_version;
    event_name := 'retired';
  when 'fork' then
    if snapshot.status not in ('published','retired') then
      raise exception 'Only approved versions can be revised into a new version' using errcode = '23514';
    end if;
    insert into evalio_private.question_versions
      (question_id,version,author_id,blueprint_id,subtest_code,topic_code,passage_version_id,license_id,format,stem,render_payload,difficulty,tags)
      select snapshot.question_id, max(v.version)+1, actor, snapshot.blueprint_id, snapshot.subtest_code,
        snapshot.topic_code, snapshot.passage_version_id, snapshot.license_id, snapshot.format,
        snapshot.stem, snapshot.render_payload, snapshot.difficulty, snapshot.tags
      from evalio_private.question_versions v where v.question_id = snapshot.question_id
      returning id into next_id;
    insert into evalio_private.question_options(version_id,position,body)
      select next_id, position, body from evalio_private.question_options where version_id = p_version;
    insert into evalio_private.question_answer_keys(version_id,correct_position,explanation)
      select next_id, correct_position, explanation from evalio_private.question_answer_keys where version_id = p_version;
    insert into evalio_private.question_audit_events(version_id,actor_id,event,revision)
      values (next_id,actor,'forked',1);
    return next_id;
  end case;

  insert into evalio_private.question_audit_events(version_id,actor_id,event,revision)
    values (p_version,actor,event_name,p_revision);
  return p_version;
end;
$$;

create function public.editorial_question_workspace(p_version uuid default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if cardinality(evalio_private.editorial_roles()) = 0 then
    raise exception 'Staff access required' using errcode = '42501';
  end if;
  if p_version is null then
    return jsonb_build_object('versions', coalesce((
      select jsonb_agg(to_jsonb(v) order by v.created_at desc, v.id)
      from (select id, question_id, version, status, subtest_code, left(stem,140) as stem, created_at
        from evalio_private.question_versions order by created_at desc, id limit 100) v
    ), '[]'));
  end if;

  return (
    select to_jsonb(v) || jsonb_build_object(
      'license', to_jsonb(l) - 'id',
      'passage', p.body,
      'passage_license', case when pl.id is not null then to_jsonb(pl) - 'id' end,
      'options', coalesce((select jsonb_agg(o.body order by o.position)
        from evalio_private.question_options o where o.version_id = v.id), '[]'),
      'history', (select jsonb_agg(jsonb_build_object('id',h.id,'version',h.version,'status',h.status) order by h.version desc)
        from evalio_private.question_versions h where h.question_id = v.question_id),
      'reviews', coalesce((select jsonb_agg(to_jsonb(r) - 'version_id' order by r.revision desc)
        from evalio_private.question_reviews r where r.version_id = v.id), '[]'),
      'audit', coalesce((select jsonb_agg(to_jsonb(a) - 'id' - 'version_id' order by a.id desc)
        from evalio_private.question_audit_events a where a.version_id = v.id), '[]'),
      'reports', coalesce((select jsonb_agg(jsonb_build_object('reason',r.reason,'notes',r.notes,'reported_at',r.reported_at)
        order by r.reported_at desc) from evalio_private.question_reports r where r.version_id = v.id), '[]')
    ) from evalio_private.question_versions v
      join evalio_private.question_license_records l on l.id = v.license_id
      left join evalio_private.passage_versions p on p.id = v.passage_version_id
      left join evalio_private.question_license_records pl on pl.id = p.license_id
      where v.id = p_version
  );
end;
$$;

create function public.editorial_question_choices()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if cardinality(evalio_private.editorial_roles()) = 0 then
    raise exception 'Staff access required' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'topics', coalesce((select jsonb_agg(jsonb_build_object('blueprint_id',t.blueprint_id,
      'exam_year',b.exam_year,'version',b.version,'subtest_code',t.subtest_code,'subtest_name',s.name,
      'code',t.code,'name',t.name,'parent_code',t.parent_code)
      order by b.exam_year desc,b.version desc,s.ordinal,t.parent_code nulls first,t.code)
      from public.topics t join public.exam_blueprints b on b.id = t.blueprint_id
      join public.blueprint_sections s on s.blueprint_id = t.blueprint_id and s.subtest_code = t.subtest_code
      where b.status in ('published','superseded')), '[]'),
    'passages', coalesce((select jsonb_agg(to_jsonb(p) order by p.id)
      from (select id,version,left(body,100) as excerpt from evalio_private.passage_versions limit 100) p), '[]')
  );
end;
$$;

create function public.read_published_question(p_version uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id',v.id,'question_id',v.question_id,'version',v.version,'format',v.format,'stem',v.stem,
    'difficulty',v.difficulty,'subtest_code',v.subtest_code,'topic_code',v.topic_code,'passage',p.body,
    'options',(select jsonb_agg(jsonb_build_object('position',o.position,'text',o.body) order by o.position)
      from evalio_private.question_options o where o.version_id = v.id)
  ) from evalio_private.question_versions v
    left join evalio_private.passage_versions p on p.id = v.passage_version_id
    where auth.uid() is not null and v.id = p_version and v.status = 'published'
$$;

create function public.report_question(p_version uuid, p_reason text, p_notes text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'Sign-in required' using errcode = '42501';
  end if;
  if not exists (select from evalio_private.question_versions
    where id = p_version and status in ('published','retired')) then
    raise exception 'Question version is unavailable' using errcode = 'P0002';
  end if;
  insert into evalio_private.question_reports(version_id,reporter_id,reason,notes)
    values (p_version,auth.uid(),p_reason,btrim(coalesce(p_notes,'')))
  on conflict (version_id,reporter_id) do nothing;
end;
$$;

revoke all on function evalio_private.editorial_roles(), evalio_private.lock_question_version(uuid,integer),
  evalio_private.freeze_question_version(), evalio_private.guard_question_child(),
  evalio_private.reject_snapshot_mutation() from public, anon, authenticated, service_role;
revoke all on function public.editorial_access(), public.editorial_save_question(uuid,integer,jsonb),
  public.editorial_transition_question(uuid,integer,text,text,integer), public.editorial_question_workspace(uuid),
  public.editorial_question_choices(), public.read_published_question(uuid), public.report_question(uuid,text,text)
  from public, anon, authenticated, service_role;
grant execute on function public.editorial_access(), public.editorial_save_question(uuid,integer,jsonb),
  public.editorial_transition_question(uuid,integer,text,text,integer), public.editorial_question_workspace(uuid),
  public.editorial_question_choices(), public.read_published_question(uuid), public.report_question(uuid,text,text)
  to authenticated;

commit;
