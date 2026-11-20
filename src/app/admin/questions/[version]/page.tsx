import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { EditorialForm } from "@/components/editorial/form";
import { QuestionEditor } from "@/components/editorial/question-editor";
import { card, control, EditorialNotice, Field, statuses } from "@/components/editorial/ui";
import { requireEditorial } from "@/lib/editorial/access";
import { transitionQuestion } from "@/lib/editorial/actions";
import { choices, workspace } from "@/lib/editorial/contracts";

const messages: Record<string, string> = {
  saved: "Draf tersimpan.", submit: "Draf diajukan untuk peninjauan.", review: "Peninjauan tercatat.",
  reject: "Soal dikembalikan ke draf.", publish: "Versi soal diterbitkan.", retire: "Versi soal diarsipkan.",
  fork: "Versi baru dibuat sebagai draf.",
};
const date = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });

export default async function QuestionPage({ params, searchParams }: {
  params: Promise<{ version: string }>;
  searchParams: Promise<{ result?: string | string[] }>;
}) {
  const { client, roles, user } = await requireEditorial();
  const version = z.uuid().safeParse((await params).version);
  if (!version.success) notFound();
  const [{ result }, response] = await Promise.all([
    searchParams, client.rpc("editorial_question_workspace", { p_version: version.data }),
  ]);
  if (response.error) return <EditorialNotice>Versi belum dapat dimuat. Muat ulang halaman untuk mencoba kembali.</EditorialNotice>;
  if (response.data === null) notFound();
  const parsed = workspace.safeParse(response.data);
  if (!parsed.success) return <EditorialNotice>Data versi belum dapat ditampilkan.</EditorialNotice>;
  const question = parsed.data;
  const canWrite = roles.includes("editor") || roles.includes("admin");
  const isOwnDraft = question.status === "draft" && question.author_id === user.id && canWrite;
  const approved = question.reviews.some((review) => review.revision === question.revision && review.decision === "approved");
  const canReview = question.status === "in_review" && !approved && roles.includes("reviewer") && question.author_id !== user.id;
  const topics = isOwnDraft ? choices.safeParse((await client.rpc("editorial_question_choices")).data) : null;
  const message = typeof result === "string" && Object.hasOwn(messages, result) ? messages[result] : null;
  const versionFields = <>
    <input type="hidden" name="version" value={question.id} />
    <input type="hidden" name="revision" value={question.revision} />
  </>;

  return (
    <>
      <div>
        <Link href="/admin/questions" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-hover underline">Semua soal</Link>
        <h1 className="text-3xl font-bold tracking-tight">Versi soal {question.version}</h1>
        <p className="mt-2 text-sm font-semibold text-primary-hover">{question.subtest_code} · {statuses[question.status]}{approved ? " · Disetujui" : ""}</p>
      </div>
      {message && <EditorialNotice>{message}</EditorialNotice>}
      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-5">
          <section className={`space-y-4 ${card}`}>
            <h2 className="text-xl font-bold">Pratinjau soal</h2>
            {question.passage && <p className="rounded-lg bg-paper p-4 leading-7 wrap-anywhere whitespace-pre-wrap">{question.passage}</p>}
            <p className="font-semibold leading-7 wrap-anywhere whitespace-pre-wrap">{question.stem}</p>
            <ol className="list-decimal space-y-2 pl-6 text-sm/6">
              {question.options.map((text) => <li key={text} className="pl-1 wrap-anywhere whitespace-pre-wrap">{text}</li>)}
            </ol>
            <dl className="space-y-2 border-t border-line pt-3 text-sm/6 wrap-anywhere">
              <div><dt className="font-semibold">Asal soal</dt><dd>{question.license.owner_name} · {question.license.kind === "original" ? "Orisinal" : "Izin komersial"}</dd>
                <dd>{question.license.provenance}</dd>
                {question.license.source_url && <dd>{question.license.source_url}</dd>}
                {question.license.agreement_ref && <dd>Rujukan izin · {question.license.agreement_ref}</dd>}
              </div>
              {question.passage_license && <div><dt className="font-semibold">Asal bacaan</dt>
                <dd>{question.passage_license.owner_name} · {question.passage_license.provenance}</dd>
                {question.passage_license.source_url && <dd>{question.passage_license.source_url}</dd>}
                {question.passage_license.agreement_ref && <dd>Rujukan izin · {question.passage_license.agreement_ref}</dd>}
              </div>}
            </dl>
          </section>
          {isOwnDraft && <section className={`space-y-4 ${card}`}>
            <h2 className="text-xl font-bold">Ubah draf</h2>
            {topics?.success ? <QuestionEditor catalog={topics.data} question={question} /> :
              <EditorialNotice>Taksonomi belum dapat dimuat.</EditorialNotice>}
          </section>}
        </div>
        <div className="space-y-5">
          <section className={`space-y-4 ${card}`}>
            <h2 className="text-xl font-bold">Alur editorial</h2>
            {isOwnDraft && <EditorialForm action={transitionQuestion} label="Ajukan peninjauan">
              {versionFields}<input type="hidden" name="action" value="submit" />
            </EditorialForm>}
            {canReview && <>
              <p className="text-sm/6 text-muted">Selesaikan soal secara mandiri. Periksa keunikan jawaban, sumber, hak penggunaan, dan kecocokan topik. Catat alasan keputusanmu. Jika jawaban berbeda dari kunci, soal dikembalikan ke draf.</p>
              <EditorialForm action={transitionQuestion} label="Setujui peninjauan">
                {versionFields}<input type="hidden" name="action" value="approve" />
                <Field label="Jawaban hasil telaah">
                  <select name="answer" required defaultValue="" className={control}>
                    <option value="">Pilih hasil telaah</option>
                    {question.options.map((body, i) => <option key={body} value={i + 1}>{i + 1}</option>)}
                  </select>
                </Field>
                <Field label="Alasan persetujuan"><textarea name="notes" maxLength={2000} required className={control} /></Field>
              </EditorialForm>
              <EditorialForm action={transitionQuestion} label="Kembalikan ke draf" subtle>
                {versionFields}<input type="hidden" name="action" value="reject" />
                <Field label="Alasan penolakan"><textarea name="notes" maxLength={2000} required className={control} /></Field>
              </EditorialForm>
            </>}
            {roles.includes("admin") && question.status === "in_review" && approved && <EditorialForm action={transitionQuestion} label="Terbitkan versi">
              {versionFields}<input type="hidden" name="action" value="publish" />
            </EditorialForm>}
            {roles.includes("admin") && question.status === "published" && <EditorialForm action={transitionQuestion} label="Arsipkan versi" subtle>
              {versionFields}<input type="hidden" name="action" value="retire" />
            </EditorialForm>}
            {canWrite && (question.status === "published" || question.status === "retired") && <EditorialForm action={transitionQuestion} label="Buat versi revisi" subtle>
              {versionFields}<input type="hidden" name="action" value="fork" />
            </EditorialForm>}
            {question.reviews.map((review) => (
              <div key={review.revision} className="border-t border-line pt-3 text-sm/6 wrap-anywhere">
                <p className="font-semibold">{review.decision === "approved" ? "Disetujui" : "Dikembalikan"} · {date.format(new Date(review.reviewed_at))}</p>
                <p>{review.notes}</p>
                <p className="text-muted">Peninjau · {review.reviewer_id}</p>
              </div>
            ))}
          </section>
          <section className={`space-y-3 ${card}`}>
            <h2 className="text-xl font-bold">Riwayat versi</h2>
            <ul role="list">{question.history.map((item) => <li key={item.id}>
              <Link href={`/admin/questions/${item.id}`} aria-current={item.id === question.id ? "page" : undefined} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-hover underline">
                Versi {item.version} · {statuses[item.status]}
              </Link>
            </li>)}</ul>
            <details><summary className="min-h-11 cursor-pointer py-2 font-semibold">Catatan audit</summary>
              <ul role="list" className="space-y-2 text-sm">{question.audit.map((event, i) => <li key={`${event.event}-${i}`} className="wrap-anywhere">
                {event.event} · {date.format(new Date(event.occurred_at))} · {event.actor_id}
              </li>)}</ul>
            </details>
          </section>
          <section className={`space-y-3 ${card}`}>
            <h2 className="text-xl font-bold">Laporan soal</h2>
            {question.reports.length ? <ul role="list" className="space-y-3">{question.reports.map((report, i) => <li className="text-sm/6 wrap-anywhere" key={`${report.reported_at}-${i}`}>
              <strong>{report.reason}</strong> · {date.format(new Date(report.reported_at))}<p>{report.notes}</p>
            </li>)}</ul> : <p className="text-sm text-muted">Belum ada laporan.</p>}
          </section>
        </div>
      </div>
    </>
  );
}
