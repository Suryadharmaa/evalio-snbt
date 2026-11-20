begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(42);

insert into auth.users (id,email,created_at,raw_user_meta_data) values
 ('00000000-0000-4000-8000-000000000101','editor-one@example.test',now(),'{"privacy_notice_version":"evalio-preview-1"}'),
 ('00000000-0000-4000-8000-000000000102','reviewer-one@example.test',now(),'{"privacy_notice_version":"evalio-preview-1"}'),
 ('00000000-0000-4000-8000-000000000103','admin-one@example.test',now(),'{"privacy_notice_version":"evalio-preview-1"}'),
 ('00000000-0000-4000-8000-000000000104','learner-one@example.test',now(),'{"privacy_notice_version":"evalio-preview-1","role":"admin"}');

insert into evalio_private.user_roles values
 ('00000000-0000-4000-8000-000000000101','editor'),
 ('00000000-0000-4000-8000-000000000101','reviewer'),
 ('00000000-0000-4000-8000-000000000102','reviewer'),
 ('00000000-0000-4000-8000-000000000103','admin');

create temp table question_fixture(subtest_code text primary key, payload jsonb, id uuid);
grant select,update on question_fixture to authenticated;
insert into question_fixture (subtest_code,payload)
select distinct on (t.subtest_code) t.subtest_code, jsonb_build_object(
  'blueprint_id', t.blueprint_id, 'subtest_code', t.subtest_code, 'topic_code', t.code,
  'stem','Synthetic QA ' || t.subtest_code, 'difficulty','easy',
  'tags',jsonb_build_array('fixture'), 'options',jsonb_build_array('Option A','Option B'),
  'answer',2, 'explanation','QA_PRIVATE_EXPLANATION', 'passage_text','Synthetic passage',
  'license_kind','original', 'owner_name','Evalio test', 'provenance','Synthetic fixture')
from public.topics t where t.blueprint_id = '20260000-0000-4000-8000-000000000001'
order by t.subtest_code, t.parent_code nulls first;

set local role anon;
select throws_ok('select public.editorial_question_workspace()', '42501', null, 'Anonymous workspace access is denied');
select throws_ok('select * from evalio_private.question_answer_keys', '42501', null, 'Anonymous key reads are denied');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000104';
set local request.jwt.claims = '{"user_metadata":{"role":"admin"}}';
select is(public.editorial_access(), '{}'::text[], 'User metadata cannot grant roles');
select throws_ok('select public.editorial_question_workspace()', '42501', null, 'Student cannot list drafts');
select throws_ok($$select public.editorial_save_question(null,null,'{}')$$, '42501', null, 'Student cannot create drafts');
select throws_ok('select * from evalio_private.question_answer_keys', '42501', null, 'Student cannot read keys directly');
select throws_ok($$insert into evalio_private.user_roles values
 ('00000000-0000-4000-8000-000000000104','admin')$$,'42501',null,'Student cannot grant themselves admin');

set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000101';
update question_fixture set id = public.editorial_save_question(null,null,payload);
select is((select count(*) from question_fixture where id is not null),7::bigint,'Synthetic drafts cover all seven subtests');
select is((select jsonb_array_length(public.editorial_question_workspace()->'versions') >= 7),
 true,'Editor can list drafts');
select ok(
  not (public.editorial_question_workspace((select id from question_fixture where subtest_code='PU'))::text like '%QA_PRIVATE_EXPLANATION%')
  and not (public.editorial_question_workspace((select id from question_fixture where subtest_code='PU')) ? 'correct_position'),
  'Staff workspace excludes stored keys and explanations');

select throws_ok($$select public.editorial_save_question(null,null,payload || '{"options":["Same","same"]}')
 from question_fixture where subtest_code='PU'$$, '23505',null,'Duplicate normalized choice text is rejected');
select throws_ok($$select public.editorial_save_question(null,null,payload || '{"answer":3}')
 from question_fixture where subtest_code='PU'$$, '23514',null,'Answer position must reference an existing option');
select throws_ok($$select public.editorial_save_question(null,null,payload || '{"topic_code":"missing"}')
 from question_fixture where subtest_code='PU'$$, '23503',null,'Question taxonomy references an existing scoped topic');
select throws_ok($$select public.editorial_save_question(null,null,payload || '{"license_kind":"licensed"}')
 from question_fixture where subtest_code='PU'$$, '23514',null,'Licensed material requires a commercial agreement reference');
select throws_ok($$select public.editorial_save_question(null,null,payload || '{"owner_name":" "}')
 from question_fixture where subtest_code='PU'$$, '23514',null,'Content ownership is required');
select throws_ok($$select public.editorial_save_question(null,null,
 payload || '{"passage_version_id":"00000000-0000-4000-8000-000000000999"}')
 from question_fixture where subtest_code='PU'$$, '23503',null,'Passages must reference an existing version');

select lives_ok($$select public.editorial_save_question(id,1,payload || '{"stem":"Revised fixture"}')
 from question_fixture where subtest_code='PU'$$,'Author can save a draft');
select throws_ok($$select public.editorial_save_question(id,1,payload)
 from question_fixture where subtest_code='PU'$$,'40001',null,'Stale draft edits are rejected');

set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000103';
select throws_ok($$select public.editorial_save_question(id,2,payload)
 from question_fixture where subtest_code='PU'$$,'42501',null,'Another editor cannot modify the author draft');
select throws_ok($$select public.editorial_transition_question(id,2,'publish')
 from question_fixture where subtest_code='PU'$$,'23514',null,'Administrator cannot publish an unapproved draft');

set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000101';
select lives_ok($$select public.editorial_transition_question(id,2,'submit')
 from question_fixture where subtest_code='PU'$$,'Author can submit a complete draft');
select throws_ok($$select public.editorial_save_question(id,2,payload)
 from question_fixture where subtest_code='PU'$$,'42501',null,'An in-review snapshot is frozen');
select throws_ok($$select public.editorial_transition_question(id,2,'approve','Own answer',2)
 from question_fixture where subtest_code='PU'$$,'42501',null,'Author cannot approve even with reviewer role');

set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000102';
select throws_ok($$select public.editorial_transition_question(id,2,'publish')
 from question_fixture where subtest_code='PU'$$,'42501',null,'Reviewer cannot publish');
select lives_ok($$select public.editorial_transition_question(id,2,'approve','Independent rationale',1)
 from question_fixture where subtest_code='PU'$$,'A mismatched answer records a rejection');
select is((select public.editorial_question_workspace(id)->>'status' from question_fixture where subtest_code='PU'),
 'draft','A mismatched answer returns the question to its author');
select throws_ok($$select public.editorial_transition_question(id,2,'approve','Second attempt',2)
 from question_fixture where subtest_code='PU'$$,'40001',null,'Reviewers cannot try another key on the same revision');
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000101';
select lives_ok($$select public.editorial_transition_question(id,3,'submit')
 from question_fixture where subtest_code='PU'$$,'Rejected snapshot can be resubmitted as a new revision');
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000102';
select lives_ok($$select public.editorial_transition_question(id,3,'reject','Revise phrasing')
 from question_fixture where subtest_code='PU'$$,'Reviewer can explicitly return a question for revision');
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000101';
select lives_ok($$select public.editorial_transition_question(id,4,'submit')
 from question_fixture where subtest_code='PU'$$,'The corrected review round has a distinct revision');
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000102';
select lives_ok($$select public.editorial_transition_question(id,4,'approve','Independent rationale and rights check',2)
 from question_fixture where subtest_code='PU'$$,'Independent approval is recorded');
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000103';
select lives_ok($$select public.editorial_transition_question(id,4,'publish')
 from question_fixture where subtest_code='PU'$$,'Admin can publish an approved revision');

set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000104';
select ok((select public.read_published_question(id) is not null from question_fixture where subtest_code='PU'),
 'Student can read the published projection');
select ok((select not (public.read_published_question(id) ?| array['answer','explanation','correct_position','license','tags'])
 and not (public.read_published_question(id)::text like '%QA_PRIVATE_EXPLANATION%')
 from question_fixture where subtest_code='PU'), 'Published projection contains neither key nor explanation');
select is((select public.read_published_question(id) from question_fixture where subtest_code='PK'),
 null::jsonb,'Drafts never appear in student reads');
select lives_ok($$select public.report_question(id,'content','Synthetic report') from question_fixture where subtest_code='PU'$$,
 'Student can report published content');

reset role;
select throws_ok($$update evalio_private.question_versions set stem='Changed'
 where id=(select id from question_fixture where subtest_code='PU')$$, '23514',null,'Published prompt is immutable');
select throws_ok($$update evalio_private.question_answer_keys set explanation='Changed'
 where version_id=(select id from question_fixture where subtest_code='PU')$$, '23514',null,'Published key and explanation are immutable');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000103';
select lives_ok($$select public.editorial_transition_question(id,4,'fork')
 from question_fixture where subtest_code='PU'$$,'Corrections fork a new draft snapshot');
select lives_ok($$select public.editorial_transition_question(id,4,'retire')
 from question_fixture where subtest_code='PU'$$,'Admin can retire an approved version');
select is((select public.read_published_question(id) from question_fixture where subtest_code='PU'),
 null::jsonb,'Retired versions are excluded from new reads');
select is((select public.editorial_question_workspace(id)->>'status' from question_fixture where subtest_code='PU'),
 'retired','The historical version reference remains resolvable');

select * from finish();
rollback;
