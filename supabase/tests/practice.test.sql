begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
\ir fixtures/practice_content.sql
select plan(47);

insert into auth.users (id,email,created_at,raw_user_meta_data) values
 ('00000000-0000-4000-8000-000000000201','practice-editor@example.test',now(),'{"privacy_notice_version":"evalio-preview-1"}'),
 ('00000000-0000-4000-8000-000000000202','practice-reviewer@example.test',now(),'{"privacy_notice_version":"evalio-preview-1"}'),
 ('00000000-0000-4000-8000-000000000203','practice-admin@example.test',now(),'{"privacy_notice_version":"evalio-preview-1"}'),
 ('00000000-0000-4000-8000-000000000204','practice-owner@example.test',now(),'{"privacy_notice_version":"evalio-preview-1"}'),
 ('00000000-0000-4000-8000-000000000205','practice-other@example.test',now(),'{"privacy_notice_version":"evalio-preview-1"}');
insert into evalio_private.user_roles values
 ('00000000-0000-4000-8000-000000000201','editor'),
 ('00000000-0000-4000-8000-000000000202','reviewer'),
 ('00000000-0000-4000-8000-000000000203','admin');

set local role anon;
select throws_ok('select public.practice_catalog()', '42501',null,'Guests cannot call practice catalog');
select throws_ok('select public.practice_history()', '42501',null,'Guests cannot read history');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000204';
select is(jsonb_array_length(public.practice_catalog()->'subtests'),7,'The catalog includes all seven subtests');
select is((public.practice_catalog()->'subtests'->0->>'count')::integer,0,'Empty inventory has a truthful zero count');
select throws_ok($$select public.practice_start('20260000-0000-4000-8000-000000000001','PU',null,5,gen_random_uuid())$$,
 'P0001',null,'No session is created against empty inventory');
select throws_ok('select * from evalio_private.question_answer_keys','42501',null,'Direct key access is denied');
select throws_ok('select * from evalio_private.practice_answers','42501',null,'Direct answer reads are denied');
select throws_ok('delete from evalio_private.practice_results','42501',null,'Direct result mutations are denied');
reset role;

do $$
begin
  for i in 1..8 loop
    perform pg_temp.practice_fixture(
      '00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000202',
      '00000000-0000-4000-8000-000000000203',i,
      case when i=7 then 'draft' when i=8 then 'retired' else 'published' end);
  end loop;
end;
$$;

create temp table practice_run (id uuid);
grant select,insert on practice_run to authenticated;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000204';
select is((public.practice_catalog()->'subtests'->0->>'count')::integer,6,'Draft and retired items are excluded from inventory');
select throws_ok($$select public.practice_start('20260000-0000-4000-8000-000000000001','PU','induktif',5,gen_random_uuid())$$,
 'P0001',null,'Topic inventory below five cannot start a five-item session');
select throws_ok($$select public.practice_start('20260000-0000-4000-8000-000000000001','PU',null,10,gen_random_uuid())$$,
 'P0001',null,'Six items cannot fill a ten-item session');
select throws_ok($$select public.practice_start('20260000-0000-4000-8000-000000000001','PU',null,20,gen_random_uuid())$$,
 'P0001',null,'Six items cannot fill a twenty-item session');
select throws_ok($$select public.practice_start('20260000-0000-4000-8000-000000000001','PU',null,6,gen_random_uuid())$$,
 '23514',null,'Unsupported lengths are denied');

insert into practice_run values (public.practice_start(
 '20260000-0000-4000-8000-000000000001','PU',null,5,'00000000-0000-4000-8000-000000000210'));
select is((select jsonb_array_length(public.practice_session(id)->'navigation') from practice_run),5,'Five eligible items are allocated');
select is((select id from practice_run),public.practice_start(
 '20260000-0000-4000-8000-000000000001','PU',null,5,'00000000-0000-4000-8000-000000000210'),
 'Creation retries return the same session');
select throws_ok($$select public.practice_start(
 '20260000-0000-4000-8000-000000000001','PU','induktif',5,'00000000-0000-4000-8000-000000000210')$$,
 '23505',null,'A creation key cannot change configuration');
select is((select public.practice_session(id,1)->'item'->'feedback' from practice_run),'null'::jsonb,
 'An unanswered item has no feedback');
select ok((select public.practice_session(id,1)::text not like '%Pembahasan fixture%' from practice_run),
 'Payload omits all explanations before an answer');

set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000205';
select is((select public.practice_session(id,1) from practice_run),null::jsonb,'Other learners cannot read session content');
select is(public.practice_history(),'[]'::jsonb,'Other learners cannot read session history');
select throws_ok('select public.practice_answer(id,1,2) from practice_run','P0002',null,'Other learners cannot submit an answer');
select throws_ok('select public.practice_finish(id) from practice_run','P0002',null,'Other learners cannot finish the session');

reset role;
select is((select count(distinct question_id) from evalio_private.practice_items
 where session_id=(select id from practice_run)),5::bigint,'No logical question repeats in the same session');
select ok((select bool_and(v.status='published') from evalio_private.practice_items i
 join evalio_private.question_versions v on i.version_id=v.id where i.session_id=(select id from practice_run)),
 'Every pinned question version was published');
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000204';
select throws_ok('select public.practice_answer(id,1,5) from practice_run','23514',null,'An invalid option never commits');
select is((select public.practice_session(id,1)->'item'->'feedback' from practice_run),'null'::jsonb,'A failed answer exposes no feedback');
select lives_ok('select public.practice_answer(id,1,2) from practice_run','Correct answer commits');
select lives_ok('select public.practice_answer(id,1,2) from practice_run','An identical answer retry is idempotent');
select throws_ok('select public.practice_answer(id,1,1) from practice_run','23505',null,'A different choice cannot overwrite a submitted answer');
select is((select public.practice_session(id,1)->'item'->'feedback'->>'correct_position' from practice_run),'2','Committed feedback reveals the correct choice');
select is((select public.practice_session(id,1)->'item'->'feedback'->>'is_correct' from practice_run),'true','Correctness is server evaluated');
select is((select public.practice_session(id)->'item'->>'position' from practice_run),'2','Resume opens the first unanswered item');
select is((select public.practice_session(id,2)->'item'->'feedback' from practice_run),'null'::jsonb,'Later unanswered items stay private');
reset role;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000203';
select set_config('practice_test.pinned_version', (select version_id::text from evalio_private.practice_items
 where session_id=(select id from practice_run) and position=2), true);
select public.editorial_transition_question(current_setting('practice_test.pinned_version')::uuid,1,'retire');
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000204';
select is((select public.practice_session(id,2)->'item'->>'version_id' from practice_run),
 current_setting('practice_test.pinned_version'),'Retirement leaves the pinned version available to the owner');
select is((public.practice_catalog()->'subtests'->0->>'count')::integer,5,'Retired content leaves new inventory');
select lives_ok('select public.practice_answer(id,2,1) from practice_run','An incorrect answer for a retired but pinned version commits');
select lives_ok('select public.practice_finish(id) from practice_run','An incomplete session can finish');
select lives_ok('select public.practice_finish(id) from practice_run','Finishing twice is idempotent');
select is((select (public.practice_session(id)->'result') - 'by_topic' from practice_run),
 '{"question_count":5,"correct":1,"incorrect":1,"unanswered":3,"accuracy_percent":20}'::jsonb,
 'Results reconcile and use the full set as the accuracy denominator');
select throws_ok('select public.practice_answer(id,3,2) from practice_run','23514',null,'Finishing prevents answers to skipped items');

set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000205';
select is((select public.practice_session(id) from practice_run),null::jsonb,'Other learners cannot read finalized results');
reset role;
select throws_ok('update evalio_private.practice_results set correct=2','23514',null,'Stored results cannot be rewritten');
select throws_ok('update evalio_private.practice_answers set selected_position=2','23514',null,'Stored answers cannot be rewritten');
select throws_ok('update evalio_private.practice_items set position=8','23514',null,'Pinned snapshots cannot be rewritten');

do $$
begin
  for i in 20..34 loop
    perform pg_temp.practice_fixture(
      '00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000202',
      '00000000-0000-4000-8000-000000000203',i);
  end loop;
end;
$$;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000204';
select is((public.practice_catalog()->'subtests'->0->>'count')::integer,20,'Published inventory can fill larger sets');
select set_config('practice_test.session_10',public.practice_start(
 '20260000-0000-4000-8000-000000000001','PU',null,10,gen_random_uuid())::text,true);
select is(jsonb_array_length(public.practice_session(current_setting('practice_test.session_10')::uuid)->'navigation'),10,'A ten-item set starts when enough items exist');
select set_config('practice_test.session_20',public.practice_start(
 '20260000-0000-4000-8000-000000000001','PU',null,20,gen_random_uuid())::text,true);
select is(jsonb_array_length(public.practice_session(current_setting('practice_test.session_20')::uuid)->'navigation'),20,'A twenty-item set starts when enough items exist');

select * from finish();
rollback;
