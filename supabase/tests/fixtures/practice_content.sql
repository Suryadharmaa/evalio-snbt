-- Synthetic content helper for disposable local test databases only.
-- Apply through the existing independent editorial functions, never seed automatically.
create function pg_temp.practice_fixture(
  p_editor uuid, p_reviewer uuid, p_admin uuid, p_number integer, p_state text default 'published'
) returns uuid language plpgsql as $$
declare
  result uuid;
begin
  perform set_config('request.jwt.claim.sub',p_editor::text,true);
  result := public.editorial_save_question(null,null,jsonb_build_object(
    'blueprint_id','20260000-0000-4000-8000-000000000001',
    'subtest_code','PU','topic_code',case when p_number % 2 = 0 then 'deduktif' else 'induktif' end,
    'stem','Fixture latihan sintetis ' || p_number || '. Pilih kesimpulan yang didukung bacaan.',
    'difficulty','easy','tags',jsonb_build_array('synthetic'),
    'passage_text','Dalam skenario uji, perpustakaan menyimpan buku cerita di rak A. Rak B menyimpan buku sains. Petugas mengembalikan buku sesuai kategori. Informasi ini cukup untuk menentukan rak yang sesuai tanpa menebak.',
    'options',jsonb_build_array('Semua buku ditempatkan di rak yang sama.','Buku sains ditempatkan di rak B.','Rak A kosong.'),
    'answer',2,'explanation','Pembahasan fixture sintetis ' || p_number || ': Bacaan menyatakan bahwa buku sains disimpan di rak B.',
    'license_kind','original','owner_name','Fixture Evalio','provenance','Konten sintetis untuk pengujian terisolasi.'));
  if p_state = 'draft' then return result; end if;
  perform public.editorial_transition_question(result,1,'submit');
  perform set_config('request.jwt.claim.sub',p_reviewer::text,true);
  perform public.editorial_transition_question(result,1,'approve','Synthetic test fixture',2);
  perform set_config('request.jwt.claim.sub',p_admin::text,true);
  perform public.editorial_transition_question(result,1,'publish');
  if p_state = 'retired' then
    perform public.editorial_transition_question(result,1,'retire');
  end if;
  return result;
end;
$$;
