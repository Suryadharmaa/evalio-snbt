import { saveQuestion } from "@/lib/editorial/actions";
import type { EditorialChoices, EditorialQuestion } from "@/lib/editorial/contracts";
import { EditorialForm } from "./form";
import { Field, control } from "./ui";

export function QuestionEditor({ catalog, question }: {
  catalog: EditorialChoices;
  question?: EditorialQuestion;
}) {
  const taxonomy = question ? `${question.blueprint_id}|${question.subtest_code}|${question.topic_code}` : "";
  const passages = catalog.passages.slice();
  if (question?.passage_version_id && !passages.some(({ id }) => id === question.passage_version_id)) {
    passages.unshift({ id: question.passage_version_id, version: 0, excerpt: question.passage?.slice(0, 100) ?? "" });
  }

  return (
    <EditorialForm action={saveQuestion} label="Simpan draf">
      {question && <>
        <input type="hidden" name="version" value={question.id} />
        <input type="hidden" name="revision" value={question.revision} />
      </>}
      <Field label="Subtes dan topik">
        <select name="taxonomy" className={control} defaultValue={taxonomy} required>
          <option value="">Pilih subtes dan topik</option>
          {catalog.topics.map((topic) => {
            const value = `${topic.blueprint_id}|${topic.subtest_code}|${topic.code}`;
            return <option key={value} value={value}>
              {topic.exam_year} v{topic.version} · {topic.subtest_code} · {topic.parent_code ? `${topic.parent_code} / ` : ""}{topic.name}
            </option>;
          })}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tingkat kesulitan">
          <select name="difficulty" defaultValue={question?.difficulty ?? "medium"} className={control}>
            <option value="easy">Mudah</option><option value="medium">Sedang</option><option value="hard">Sulit</option>
          </select>
        </Field>
        <Field label="Tag (pisahkan dengan koma)">
          <input name="tags" maxLength={327} defaultValue={question?.tags.join(", ")} className={control} />
        </Field>
      </div>
      <Field label="Pertanyaan">
        <textarea name="stem" rows={3} required maxLength={5000} defaultValue={question?.stem} className={control} />
      </Field>
      <fieldset className="space-y-3 rounded-lg border border-line p-4">
        <legend className="px-2 text-sm font-bold">Bacaan opsional</legend>
        <Field label="Versi bacaan">
          <select name="passage_version_id" className={control} defaultValue={question?.passage_version_id ?? ""}>
            <option value="">Tanpa bacaan</option>
            {passages.map(({ id, version, excerpt }) =>
              <option key={id} value={id}>{version ? `v${version} · ` : ""}{excerpt}</option>)}
          </select>
        </Field>
        <Field label="Teks bacaan baru atau revisi">
          <textarea name="passage_text" rows={3} maxLength={10000} className={control} />
        </Field>
        <p className="text-sm/6 text-muted">Bacaan baru atau revisi memakai lisensi yang diisi di bawah. Pilih versi yang ada untuk melampirkan bacaan dengan lisensinya sendiri.</p>
      </fieldset>
      <fieldset className="space-y-3 rounded-lg border border-line p-4">
        <legend className="px-2 text-sm font-bold">Pilihan jawaban</legend>
        {[1, 2, 3, 4, 5].map((position) => (
          <Field key={position} label={`Pilihan ${position}${position > 2 ? " (opsional)" : ""}`}>
            <input name={`option-${position}`} required={position < 3} maxLength={1000}
              defaultValue={question?.options[position - 1]} className={control} />
          </Field>
        ))}
      </fieldset>
      <fieldset className="space-y-3 rounded-lg border border-line p-4">
        <legend className="px-2 text-sm font-bold">Kunci dan pembahasan</legend>
        <p className="text-sm/6 text-muted">Isi ulang saat menyimpan perubahan. Nilai yang tersimpan tidak ditampilkan.</p>
        <Field label="Pilihan benar">
          <select name="answer" required defaultValue="" className={control}>
            <option value="">Pilih jawaban benar</option>
            {[1, 2, 3, 4, 5].map((position) => <option key={position} value={position}>{position}</option>)}
          </select>
        </Field>
        <Field label="Pembahasan">
          <textarea name="explanation" rows={3} maxLength={5000} required className={control} />
        </Field>
      </fieldset>
      <fieldset className="space-y-3 rounded-lg border border-line p-4">
        <legend className="px-2 text-sm font-bold">Kepemilikan dan lisensi</legend>
        <Field label="Jenis lisensi">
          <select name="license_kind" defaultValue={question?.license.kind ?? "original"} className={control}>
            <option value="original">Orisinal</option><option value="licensed">Izin komersial</option>
          </select>
        </Field>
        <Field label="Pemilik konten">
          <input name="owner_name" required maxLength={200} defaultValue={question?.license.owner_name} className={control} />
        </Field>
        <Field label="Asal dan proses pembuatan">
          <textarea name="provenance" required maxLength={2000} defaultValue={question?.license.provenance} className={control} />
        </Field>
        <Field label="Referensi izin komersial (jika berlisensi)">
          <input name="agreement_ref" maxLength={500} defaultValue={question?.license.agreement_ref ?? ""} className={control} />
        </Field>
        <Field label="Tautan sumber HTTPS (opsional)">
          <input type="url" name="source_url" maxLength={2048} defaultValue={question?.license.source_url ?? ""} className={control} />
        </Field>
      </fieldset>
    </EditorialForm>
  );
}
