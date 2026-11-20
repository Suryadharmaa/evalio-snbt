begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(21);

select throws_ok(
  $$insert into auth.users (id, email, created_at) values
    ('00000000-0000-4000-8000-000000000003', 'no-notice@example.test', now())$$,
  '23514', 'A current privacy notice acknowledgment is required',
  'Registration without the current acknowledgment is rejected');

insert into auth.users (id, email, created_at, raw_user_meta_data) values
  ('00000000-0000-4000-8000-000000000001', 'learner-one@example.test', '2026-11-20T00:00:00Z',
    '{"cohort_year":2028,"privacy_notice_version":"evalio-preview-1","role":"admin"}'),
  ('00000000-0000-4000-8000-000000000002', 'learner-two@example.test', '2026-11-20T00:00:00Z',
    '{"cohort_year":"untrusted","privacy_notice_version":"evalio-preview-1"}');

select is((select cohort_year::integer from public.profiles where user_id = '00000000-0000-4000-8000-000000000001'), 2028, 'Registration seeds the target year');
select is((select cohort_year::integer from public.profiles where user_id = '00000000-0000-4000-8000-000000000002'), 2027, 'Invalid metadata cannot break initialization');
select is((select count(*) from evalio_private.user_roles), 0::bigint, 'Untrusted signup role metadata grants no roles');

set local role anon;
select throws_ok('select * from public.profiles', '42501', null, 'Anonymous profile reads are denied');
select throws_ok('select public.request_account_deletion()', '42501', null, 'Anonymous deletion requests are denied');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';

select results_eq('select user_id from public.profiles',
  $$values ('00000000-0000-4000-8000-000000000001'::uuid)$$, 'RLS returns only the current profile');
select results_eq('select user_id from public.user_consents',
  $$values ('00000000-0000-4000-8000-000000000001'::uuid)$$, 'RLS returns only the current privacy acknowledgment');

with changed as (
  update public.profiles set alias = 'Learner One'
    where user_id = '00000000-0000-4000-8000-000000000001' returning alias
)
select is((select alias from changed), 'Learner One', 'Students can update allowed fields on their profile');
with changed as (
  update public.profiles set alias = 'Other learner'
    where user_id = '00000000-0000-4000-8000-000000000002' returning alias
)
select is((select count(*) from changed), 0::bigint, 'RLS hides another profile from update');
select throws_ok(
  $$update public.profiles set user_id = '00000000-0000-4000-8000-000000000002'$$,
  '42501', null, 'Students cannot change ownership');
select throws_ok('update public.profiles set created_at = now()', '42501', null, 'Students cannot change creation time');
select throws_ok('update public.profiles set delete_requested_at = now()', '42501', null, 'Only the scoped RPC can set the deletion timestamp');
select throws_ok('update public.user_consents set granted_at = now()', '42501', null, 'Students cannot rewrite privacy records');
select throws_ok('select * from evalio_private.user_roles', '42501', null, 'Student cannot read restricted roles');
select throws_ok(
  $$insert into evalio_private.user_roles values ('00000000-0000-4000-8000-000000000001', 'admin')$$,
  '42501', null, 'Student cannot grant an admin role');

select isnt(public.request_account_deletion(), null, 'Only the owner can queue their deletion request');
select is(public.request_account_deletion(), (select delete_requested_at from public.profiles), 'Duplicate deletion requests retain their first timestamp');

reset role;
select is(
  (select delete_requested_at from public.profiles where user_id = '00000000-0000-4000-8000-000000000002'),
  null, 'The second account is untouched by the first account deletion request');
delete from auth.users where id = '00000000-0000-4000-8000-000000000001';
select is(
  (select count(*) from public.profiles where user_id = '00000000-0000-4000-8000-000000000001'),
  0::bigint, 'Operator Auth deletion removes the profile');
select is(
  (select count(*) from public.user_consents where user_id = '00000000-0000-4000-8000-000000000001'),
  0::bigint, 'Operator Auth deletion removes the acknowledgment');

select * from finish();
rollback;
