begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(37);

select results_eq(
  $$select subtest_code, question_count, duration_seconds from public.blueprint_sections
    where blueprint_id = '20260000-0000-4000-8000-000000000001' order by ordinal$$,
  $$values ('PU',30,1800),('PPU',20,900),('PBM',20,1500),('PK',20,1200),
    ('LBI',30,2550),('LBE',20,1200),('PM',20,2550)$$,
  'Historical 2026 has the official seven sections in order');
select is((select sum(question_count) from public.blueprint_sections
  where blueprint_id = '20260000-0000-4000-8000-000000000001'),
  160::bigint, '2026 question total is 160');
select is((select sum(duration_seconds) from public.blueprint_sections
  where blueprint_id = '20260000-0000-4000-8000-000000000001'),
  11700::bigint, '2026 section durations total 195 minutes');
select results_eq(
  $$select exam_year::integer, version::integer, status, classification, total_questions, duration_seconds
    from public.exam_blueprints where exam_year = 2026$$,
  $$values (2026,1,'published'::text,'historical_reference'::text,160,11700)$$,
  '2026 data is a published historical reference');
select is((select count(*) from public.exam_rule_sources
  where verified_on = date '2026-11-20' and publisher = 'SNPMB'), 2::bigint, 'Both SNPMB sources have verification dates');

insert into public.subtests values ('DRAFT');
insert into public.exam_blueprints (id, exam_year, version, classification, total_questions, duration_seconds)
  values ('20270000-0000-4000-8000-000000000001', 2027, 1, 'official', 20, 1200);
insert into public.blueprint_sections (blueprint_id, subtest_code, name, category, question_count, duration_seconds, ordinal)
  values ('20270000-0000-4000-8000-000000000001', 'DRAFT', 'Fixture draft', 'TPS', 10, 600, 1);
insert into public.topics (blueprint_id, subtest_code, code, name)
  values ('20270000-0000-4000-8000-000000000001', 'DRAFT', 'root', 'Root');
insert into public.topics values ('20270000-0000-4000-8000-000000000001', 'DRAFT', 'child', 'Child', 'root');
insert into public.exam_rule_sources values
  ('20270000-0000-4000-8000-000000000001', 'https://example.test/fixture', 'Fixture', 'Fixture', current_date);

select throws_ok($$insert into public.subtests values ('PU')$$,
  '23505', null, 'Subtest identifiers are unique');
select throws_ok($$insert into public.exam_blueprints (exam_year,version,classification,total_questions,duration_seconds)
  values (2027,1,'official',10,600)$$, '23505', null, 'A year and version uniquely identify a blueprint');
select throws_ok($$insert into public.blueprint_sections values
  ('20270000-0000-4000-8000-000000000001','DRAFT','Duplicate','TPS',10,600,2)$$,
  '23505', null, 'A version cannot contain a duplicate subtest');
select throws_ok($$insert into public.blueprint_sections values
  ('20270000-0000-4000-8000-000000000001','PPU','Duplicate ordinal','TPS',10,600,1)$$,
  '23505', null, 'A version cannot contain a duplicate section ordinal');
select throws_ok($$insert into public.topics values
  ('20270000-0000-4000-8000-000000000001','DRAFT','root','Duplicate',null)$$,
  '23505', null, 'Topic identifiers are unique within a version and subtest');
select throws_ok($$insert into public.blueprint_sections values
  ('20270000-0000-4000-8000-000000000001','NOPE','Missing subtest','TPS',10,600,2)$$,
  '23503', null, 'Sections require a registered subtest');
select throws_ok($$insert into public.topics values
  ('20270000-0000-4000-8000-000000000001','DRAFT','orphan','Orphan','missing')$$,
  '23503', null, 'A parent topic must exist within the same version and subtest');
select throws_ok($$update public.topics set parent_code = 'child'
  where blueprint_id = '20270000-0000-4000-8000-000000000001' and code = 'root'$$,
  '23514', 'Topic ancestry must be acyclic', 'Topic moves cannot create a cycle');

select throws_ok($$update public.exam_blueprints set status = 'published' where exam_year = 2027$$,
  '23514', 'Sections must be contiguous and match the blueprint question total',
  'Publication rejects an inconsistent question total');
update public.exam_blueprints set total_questions = 10 where exam_year = 2027;
select throws_ok($$update public.exam_blueprints set status = 'published' where exam_year = 2027$$,
  '23514', 'Section durations must be complete and match the blueprint duration',
  'Publication rejects an inconsistent timed total');
update public.blueprint_sections set ordinal = 2 where subtest_code = 'DRAFT';
select throws_ok($$update public.exam_blueprints set status = 'published' where exam_year = 2027$$,
  '23514', 'Sections must be contiguous and match the blueprint question total',
  'Publication rejects gaps in section ordering');
update public.blueprint_sections set ordinal = 1 where subtest_code = 'DRAFT';
update public.exam_blueprints set duration_seconds = 600 where exam_year = 2027;
delete from public.exam_rule_sources where url = 'https://example.test/fixture';
select throws_ok($$update public.exam_blueprints set status = 'published' where exam_year = 2027$$,
  '23514', 'Publishing requires dated, verified sources', 'Publication requires a source');
insert into public.exam_rule_sources values
  ('20270000-0000-4000-8000-000000000001', 'https://example.test/fixture', 'Fixture', 'Fixture', current_date + 1);
select throws_ok($$update public.exam_blueprints set status = 'published' where exam_year = 2027$$,
  '23514', 'Publishing requires dated, verified sources', 'Publication rejects unverified future dates');
select throws_ok($$insert into public.exam_blueprints
  (exam_year,version,classification,status,total_questions,duration_seconds,published_at)
  values (2030,1,'official','published',10,600,now())$$,
  '23514', 'Blueprints must start in draft', 'Direct published inserts cannot bypass validation');

set local role anon;
select is((select count(*) from public.exam_blueprints where exam_year = 2027), 0::bigint, 'Anonymous readers cannot see draft blueprints');
select is((select count(*) from public.subtests where code = 'DRAFT'), 0::bigint, 'Draft-only subtests are hidden');
select is((select count(*) from public.blueprint_sections where subtest_code = 'DRAFT'), 0::bigint, 'Draft sections are hidden');
select is((select count(*) from public.topics where subtest_code = 'DRAFT'), 0::bigint, 'Draft topic snapshots are hidden');
select is((select count(*) from public.exam_rule_sources where url = 'https://example.test/fixture'), 0::bigint, 'Draft sources are hidden');
select is((select count(*) from public.exam_blueprints where exam_year = 2026), 1::bigint, 'Anonymous readers can see the approved historical reference');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"user_metadata":{"role":"admin"}}';
select throws_ok($$update public.exam_blueprints set status = 'published' where exam_year = 2027$$,
  '42501', null, 'Student metadata grants no publication permission');
select throws_ok($$insert into public.subtests values ('USER')$$,
  '42501', null, 'Students cannot insert subtest identities');
select throws_ok('delete from public.topics', '42501', null, 'Students cannot delete topics');
select throws_ok('select * from evalio_private.user_roles', '42501', null, 'Blueprint access grants no private role access');
reset role;

select throws_ok($$update public.exam_blueprints set duration_seconds = 9000 where exam_year = 2026$$,
  '23514', 'Approved blueprints are immutable', 'Operators must version timing changes');
select throws_ok($$update public.blueprint_sections set question_count = 99 where subtest_code = 'PU'$$,
  '23514', 'Approved blueprint records are immutable', 'Published section snapshots are immutable');
select throws_ok($$delete from public.topics where code = 'induktif'$$,
  '23514', 'Approved blueprint records are immutable', 'Published taxonomy rows cannot be deleted');
select throws_ok($$update public.exam_rule_sources set verified_on = current_date$$,
  '23514', 'Approved blueprint records are immutable', 'Published source verification cannot be silently altered');

insert into public.exam_blueprints (id, exam_year, version, classification, total_questions, duration_seconds)
  values ('20260000-0000-4000-8000-000000000002', 2026, 2, 'historical_reference', 10, 600);
insert into public.blueprint_sections values
  ('20260000-0000-4000-8000-000000000002', 'PU', 'Fixture revision', 'TPS', 10, null, 1);
insert into public.exam_rule_sources values
  ('20260000-0000-4000-8000-000000000002', 'https://example.test/revision', 'Fixture', 'Fixture', current_date);
select throws_ok($$update public.exam_blueprints set status = 'published' where exam_year = 2026 and version = 2$$,
  '23505', null, 'A year cannot have two active published versions');

update public.exam_blueprints set status = 'superseded' where exam_year = 2026 and version = 1;
update public.exam_blueprints set status = 'published' where exam_year = 2026 and version = 2;
select is((select status from public.exam_blueprints where exam_year = 2026 and version = 2), 'published',
  'A database operator can publish a replacement version');
set local role anon;
select is((select status from public.exam_blueprints where exam_year = 2026 and version = 1), 'superseded',
  'Superseded approved versions remain inspectable');

reset role;
select throws_ok($$update public.exam_blueprints set status = 'published' where exam_year = 2026 and version = 1$$,
  '23514', 'Approved blueprints are immutable', 'Superseded versions cannot become active again');

select * from finish();
rollback;
