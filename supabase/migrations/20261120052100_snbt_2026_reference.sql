begin;

do $$
declare
  historical_id constant uuid := '20260000-0000-4000-8000-000000000001';
begin
  if exists (
    select from public.exam_blueprints
      where id = historical_id and exam_year = 2026 and version = 1
        and classification = 'historical_reference' and status in ('published', 'superseded')
  ) then
    return;
  end if;

  insert into public.subtests (code)
  values ('PU'), ('PPU'), ('PBM'), ('PK'), ('LBI'), ('LBE'), ('PM')
  on conflict (code) do nothing;

  insert into public.exam_blueprints
    (id, exam_year, version, classification, total_questions, duration_seconds)
  values (historical_id, 2026, 1, 'historical_reference', 160, 11700);

  insert into public.exam_rule_sources (blueprint_id, url, title, publisher, verified_on) values
    (historical_id, 'https://snpmb.id/fr/',
      'Framework UTBK-SNBT Tahun 2026', 'SNPMB', date '2026-11-20'),
    (historical_id, 'https://files.snpmb.id/web2026/Paparan%20Informasi%20SNPMB%202026%20untuk%20Peluncuran.pdf',
      'Paparan Informasi SNPMB 2026 untuk Peluncuran', 'SNPMB', date '2026-11-20');

  insert into public.blueprint_sections
    (blueprint_id, subtest_code, name, category, question_count, duration_seconds, ordinal)
  values
    (historical_id, 'PU', 'Penalaran Umum', 'TPS', 30, 1800, 1),
    (historical_id, 'PPU', 'Pengetahuan dan Pemahaman Umum', 'TPS', 20, 900, 2),
    (historical_id, 'PBM', 'Pemahaman Bacaan dan Menulis', 'TPS', 20, 1500, 3),
    (historical_id, 'PK', 'Pengetahuan Kuantitatif', 'TPS', 20, 1200, 4),
    (historical_id, 'LBI', 'Literasi dalam Bahasa Indonesia', 'LITERASI', 30, 2550, 5),
    (historical_id, 'LBE', 'Literasi dalam Bahasa Inggris', 'LITERASI', 20, 1200, 6),
    (historical_id, 'PM', 'Penalaran Matematika', 'LITERASI', 20, 2550, 7);

  -- Evalio study tags. They do not imply an official topic list or question distribution.
  insert into public.topics (blueprint_id, subtest_code, code, name) values
    (historical_id, 'PU', 'penalaran', 'Penalaran'),
    (historical_id, 'PPU', 'kosakata', 'Kosakata'),
    (historical_id, 'PBM', 'struktur-teks', 'Struktur teks'),
    (historical_id, 'PK', 'bilangan', 'Bilangan'),
    (historical_id, 'LBI', 'pemahaman-teks', 'Pemahaman teks'),
    (historical_id, 'LBE', 'pemahaman-teks', 'Pemahaman teks'),
    (historical_id, 'PM', 'pemodelan', 'Pemodelan matematika');

  insert into public.topics (blueprint_id, subtest_code, code, name, parent_code) values
    (historical_id, 'PU', 'induktif', 'Penalaran induktif', 'penalaran'),
    (historical_id, 'PU', 'deduktif', 'Penalaran deduktif', 'penalaran'),
    (historical_id, 'PU', 'kuantitatif', 'Penalaran kuantitatif', 'penalaran'),
    (historical_id, 'PPU', 'makna-kontekstual', 'Makna kata dalam konteks', 'kosakata'),
    (historical_id, 'PBM', 'hubungan-antar-kalimat', 'Hubungan antarkalimat', 'struktur-teks'),
    (historical_id, 'PK', 'rasio', 'Rasio dan proporsi', 'bilangan'),
    (historical_id, 'LBI', 'gagasan-utama', 'Gagasan utama', 'pemahaman-teks'),
    (historical_id, 'LBE', 'inferensi', 'Inferensi dari bacaan', 'pemahaman-teks'),
    (historical_id, 'PM', 'representasi-masalah', 'Representasi masalah', 'pemodelan');

  update public.exam_blueprints set status = 'published' where id = historical_id;
end;
$$;

commit;
