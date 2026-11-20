begin;

alter table evalio_private.question_versions
  add constraint question_versions_id_and_question_unique unique (id, question_id);

create table evalio_private.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  blueprint_id uuid not null,
  subtest_code text not null,
  topic_code text,
  question_count integer not null check (question_count in (5, 10, 20)),
  started_at timestamptz not null default statement_timestamp(),
  finished_at timestamptz check (finished_at >= started_at),
  unique (user_id, request_id),
  unique (id, question_count),
  foreign key (blueprint_id, subtest_code) references public.blueprint_sections(blueprint_id, subtest_code),
  foreign key (blueprint_id, subtest_code, topic_code) references public.topics(blueprint_id, subtest_code, code)
);
create index practice_sessions_history on evalio_private.practice_sessions(user_id, started_at desc, id);

create table evalio_private.practice_items (
  session_id uuid not null references evalio_private.practice_sessions(id) on delete cascade,
  position integer not null check (position between 1 and 20),
  question_id uuid not null,
  version_id uuid not null,
  primary key (session_id, position),
  unique (session_id, question_id),
  unique (session_id, position, version_id),
  foreign key (version_id, question_id) references evalio_private.question_versions(id, question_id)
);
create index practice_items_version_ref on evalio_private.practice_items(version_id);

create table evalio_private.practice_answers (
  session_id uuid not null,
  position integer not null,
  version_id uuid not null,
  selected_position integer not null,
  is_correct boolean not null,
  answered_at timestamptz not null default statement_timestamp(),
  primary key (session_id, position),
  foreign key (session_id, position, version_id)
    references evalio_private.practice_items(session_id, position, version_id) on delete cascade,
  foreign key (version_id, selected_position) references evalio_private.question_options(version_id, position)
);
create index practice_answers_option_ref on evalio_private.practice_answers(version_id, selected_position);

create table evalio_private.practice_results (
  session_id uuid primary key,
  question_count integer not null,
  correct integer not null check (correct >= 0),
  incorrect integer not null check (incorrect >= 0),
  unanswered integer not null check (unanswered >= 0),
  accuracy_percent numeric(5,2) generated always as (round(100.0 * correct / question_count, 2)) stored,
  by_topic jsonb not null check (jsonb_typeof(by_topic) = 'array'),
  check (correct + incorrect + unanswered = question_count),
  foreign key (session_id, question_count) references evalio_private.practice_sessions(id, question_count) on delete cascade
);

alter table evalio_private.practice_sessions enable row level security;
alter table evalio_private.practice_items enable row level security;
alter table evalio_private.practice_answers enable row level security;
alter table evalio_private.practice_results enable row level security;
revoke all on evalio_private.practice_sessions, evalio_private.practice_items,
  evalio_private.practice_answers, evalio_private.practice_results from public, anon, authenticated, service_role;

-- Account deletion cascades. No application operation can rewrite snapshots, answers, or results.
create trigger freeze_practice_items before update on evalio_private.practice_items
  for each row execute function evalio_private.reject_snapshot_mutation();
create trigger freeze_practice_answers before update on evalio_private.practice_answers
  for each row execute function evalio_private.reject_snapshot_mutation();
create trigger freeze_practice_results before update on evalio_private.practice_results
  for each row execute function evalio_private.reject_snapshot_mutation();

create function public.practice_catalog()
returns jsonb language sql stable security definer set search_path = '' as $$
  with target as (
    select id, exam_year, version, classification from public.exam_blueprints
    where status = 'published' order by exam_year desc limit 1
  ), counts as (
    select v.subtest_code, v.topic_code, count(*) as amount
    from evalio_private.question_versions v join target b on b.id = v.blueprint_id
    where v.status = 'published' and v.format = 'single_choice'
    group by v.subtest_code, v.topic_code
  )
  select jsonb_build_object(
    'id', b.id, 'exam_year', b.exam_year, 'version', b.version, 'classification', b.classification,
    'subtests', (select jsonb_agg(jsonb_build_object(
      'code', s.subtest_code, 'name', s.name,
      'count', coalesce((select sum(c.amount) from counts c where c.subtest_code = s.subtest_code), 0),
      'topics', coalesce((select jsonb_agg(jsonb_build_object(
        'code', t.code, 'name', t.name, 'parent_code', t.parent_code, 'count', coalesce(c.amount, 0)
      ) order by t.parent_code nulls first, t.name)
        from public.topics t left join counts c on c.subtest_code = t.subtest_code and c.topic_code = t.code
        where t.blueprint_id = b.id and t.subtest_code = s.subtest_code), '[]')
    ) order by s.ordinal) from public.blueprint_sections s where s.blueprint_id = b.id)
  ) from target b where auth.uid() is not null
$$;

create function public.practice_start(p_blueprint uuid, p_subtest text, p_topic text, p_count integer, p_request uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  target uuid;
  existing evalio_private.practice_sessions;
  allocated integer;
begin
  if owner_id is null then raise exception 'Sign-in required' using errcode = '42501'; end if;
  if p_count is null or p_count not in (5,10,20) or p_request is null then
    raise exception 'Invalid practice configuration' using errcode = '23514';
  end if;
  -- Existing requests may still be retried after their blueprint or content was retired.
  select * into existing from evalio_private.practice_sessions where user_id = owner_id and request_id = p_request;
  if not found then
    perform b.id from public.exam_blueprints b where b.id = p_blueprint and b.status = 'published' for share;
    if not found then raise exception 'Blueprint unavailable' using errcode = '23514'; end if;
    insert into evalio_private.practice_sessions(user_id, request_id, blueprint_id, subtest_code, topic_code, question_count)
      values (owner_id, p_request, p_blueprint, p_subtest, p_topic, p_count)
      on conflict (user_id, request_id) do nothing returning id into target;

    if target is not null then
      with selected as materialized (
        select v.question_id, v.id, md5(v.id::text || p_request::text) as sort_key
        from evalio_private.question_versions v
        where v.blueprint_id = p_blueprint and v.subtest_code = p_subtest
          and (p_topic is null or v.topic_code = p_topic)
          and v.format = 'single_choice' and v.status = 'published'
        order by sort_key, v.id limit p_count for share of v
      )
      insert into evalio_private.practice_items (session_id, position, question_id, version_id)
        select target, row_number() over (order by sort_key, id), question_id, id from selected;
      get diagnostics allocated = row_count;
      if allocated <> p_count then
        raise exception 'Insufficient published questions' using errcode = 'P0001';
      end if;
      return target;
    end if;
    select * into existing from evalio_private.practice_sessions where user_id = owner_id and request_id = p_request;
  end if;

  if (existing.blueprint_id, existing.subtest_code, existing.topic_code, existing.question_count)
    is distinct from (p_blueprint, p_subtest, p_topic, p_count) then
    raise exception 'Practice request already used' using errcode = '23505';
  end if;
  return existing.id;
end;
$$;

create function public.practice_session(p_session uuid, p_position integer default null)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', s.id, 'subtest', bs.name, 'topic', t.name, 'question_count', s.question_count, 'finished_at', s.finished_at,
    'navigation', (select jsonb_agg(jsonb_build_object('position',ni.position,'answered',na.position is not null)
      order by ni.position) from evalio_private.practice_items ni
      left join evalio_private.practice_answers na on na.session_id = ni.session_id and na.position = ni.position
      where ni.session_id = s.id),
    'result', (select to_jsonb(r) - 'session_id' from evalio_private.practice_results r where r.session_id = s.id),
    'item', (select jsonb_build_object(
      'position',i.position,'version_id',v.id,'stem',v.stem,'passage',p.body,'topic',it.name,
      'options',(select jsonb_agg(jsonb_build_object('position',o.position,'text',o.body) order by o.position)
        from evalio_private.question_options o where o.version_id = v.id),
      'feedback', case when a.position is not null then jsonb_build_object(
        'selected_position',a.selected_position,'is_correct',a.is_correct,
        'correct_position',k.correct_position,'explanation',k.explanation
      ) end
    ) from evalio_private.practice_items i
      join evalio_private.question_versions v on i.version_id = v.id
      join public.topics it on (it.blueprint_id,it.subtest_code,it.code) = (v.blueprint_id,v.subtest_code,v.topic_code)
      left join evalio_private.passage_versions p on p.id = v.passage_version_id
      left join evalio_private.practice_answers a on a.session_id = i.session_id and a.position = i.position
      left join evalio_private.question_answer_keys k on k.version_id = a.version_id
      where i.session_id = s.id and i.position = coalesce(p_position, case when s.finished_at is null then
        coalesce((select min(todo.position) from evalio_private.practice_items todo where todo.session_id = s.id
          and not exists (select from evalio_private.practice_answers done
            where done.session_id = todo.session_id and done.position = todo.position)), 1) end))
  )
  from evalio_private.practice_sessions s
  join public.blueprint_sections bs on (bs.blueprint_id, bs.subtest_code) = (s.blueprint_id, s.subtest_code)
  left join public.topics t on (t.blueprint_id,t.subtest_code,t.code) = (s.blueprint_id,s.subtest_code,s.topic_code)
  where s.id = p_session and s.user_id = auth.uid()
$$;

create function public.practice_answer(p_session uuid, p_position integer, p_choice integer)
returns void language plpgsql security definer set search_path = '' as $$
declare
  session_row evalio_private.practice_sessions;
  existing_choice integer;
  target uuid;
  answer_key integer;
begin
  select * into session_row from evalio_private.practice_sessions
    where id = p_session and user_id = auth.uid() for update;
  if not found then raise exception 'Session unavailable' using errcode = 'P0002'; end if;

  select selected_position into existing_choice from evalio_private.practice_answers
    where session_id = p_session and position = p_position;
  if found then
    if existing_choice = p_choice then return; end if;
    raise exception 'Answer already submitted' using errcode = '23505';
  end if;
  if session_row.finished_at is not null then raise exception 'Session finished' using errcode = '23514'; end if;

  select i.version_id, k.correct_position into target, answer_key from evalio_private.practice_items i
    join evalio_private.question_answer_keys k on k.version_id = i.version_id
    join evalio_private.question_options o on o.version_id = i.version_id and o.position = p_choice
    where i.session_id = p_session and i.position = p_position;
  if not found then raise exception 'Invalid question or choice' using errcode = '23514'; end if;
  insert into evalio_private.practice_answers(session_id, position, version_id, selected_position, is_correct)
    values (p_session, p_position, target, p_choice, p_choice = answer_key);
end;
$$;

create function public.practice_finish(p_session uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  session_row evalio_private.practice_sessions;
begin
  select * into session_row from evalio_private.practice_sessions
    where id = p_session and user_id = auth.uid() for update;
  if not found then raise exception 'Session unavailable' using errcode = 'P0002'; end if;
  if session_row.finished_at is not null then return; end if;

  with buckets as (
    select v.topic_code, t.name as topic,
      count(*) filter (where a.is_correct) as correct,
      count(*) filter (where not a.is_correct) as incorrect,
      count(*) filter (where a.position is null) as unanswered
    from evalio_private.practice_items i
      join evalio_private.question_versions v on v.id = i.version_id
      join public.topics t on (t.blueprint_id,t.subtest_code,t.code) = (v.blueprint_id,v.subtest_code,v.topic_code)
      left join evalio_private.practice_answers a on a.session_id = i.session_id and a.position = i.position
      where i.session_id = p_session
      group by v.topic_code, t.name
  )
  insert into evalio_private.practice_results(session_id, question_count, correct, incorrect, unanswered, by_topic)
    select p_session, session_row.question_count, sum(correct), sum(incorrect), sum(unanswered),
      jsonb_agg(to_jsonb(b) order by topic_code) from buckets b;

  update evalio_private.practice_sessions set finished_at = clock_timestamp() where id = p_session;
end;
$$;

create function public.practice_history()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(to_jsonb(recent) order by recent.started_at desc, recent.id), '[]')
  from (
    select s.id, s.started_at, s.finished_at, s.question_count, b.name as subtest,
      r.accuracy_percent,
      (select count(*) from evalio_private.practice_answers a where a.session_id = s.id) as answered
    from evalio_private.practice_sessions s
    join public.blueprint_sections b on (b.blueprint_id,b.subtest_code) = (s.blueprint_id,s.subtest_code)
    left join evalio_private.practice_results r on r.session_id = s.id
    where s.user_id = auth.uid() order by s.started_at desc, s.id limit 50
  ) recent
$$;

revoke all on function public.practice_catalog(), public.practice_start(uuid,text,text,integer,uuid),
  public.practice_session(uuid,integer), public.practice_answer(uuid,integer,integer),
  public.practice_finish(uuid), public.practice_history() from public, anon, authenticated, service_role;
grant execute on function public.practice_catalog(), public.practice_start(uuid,text,text,integer,uuid),
  public.practice_session(uuid,integer), public.practice_answer(uuid,integer,integer),
  public.practice_finish(uuid), public.practice_history() to authenticated;

commit;
