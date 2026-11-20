-- Opt-in synthetic browser fixture. Run after the zero-content tests on a disposable local database.
\set ON_ERROR_STOP on
select (:'HOST' = '127.0.0.1' and :'PORT' = '55322') as safe_local \gset
\if :safe_local
\else
  \echo Refusing fixture seed outside the Evalio loopback database.
  \quit
\endif

begin;
\ir practice_content.sql
do $$
declare
  editor_id uuid;
  reviewer_id uuid;
  admin_id uuid;
begin
  if exists (select from evalio_private.question_versions where status='published') then
    raise exception 'Use a fresh isolated database with empty published inventory';
  end if;
  select id into strict editor_id from auth.users where email='evalio-editorial-editor@example.com';
  select id into strict reviewer_id from auth.users where email='evalio-editorial-reviewer@example.com';
  select id into strict admin_id from auth.users where email='evalio-editorial-admin@example.com';
  for i in 101..106 loop
    perform pg_temp.practice_fixture(editor_id,reviewer_id,admin_id,i);
  end loop;
end;
$$;
commit;
