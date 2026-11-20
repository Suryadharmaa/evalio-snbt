import Link from "next/link";
import { notFound } from "next/navigation";
import { PracticeForm } from "@/components/practice/action-form";
import { AccountNotice } from "@/features/account/account-panel";
import { requireStudent } from "@/lib/auth/student";
import { finishPractice, submitPracticeAnswer } from "@/lib/practice/actions";
import { positionParam, practiceSession, sessionInput, type PracticeSession } from "@/lib/practice/contracts";

const card = "rounded-panel border border-line bg-surface p-5 sm:p-7";
const link = "inline-flex min-h-11 items-center font-semibold text-primary-hover underline underline-offset-4";

export const metadata = { title: "Sesi latihan | Evalio" };

export default async function SessionPage({ params, searchParams }: {
  params: Promise<{ session: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { client } = await requireStudent();
  const [route, { q }] = await Promise.all([params, searchParams]);
  const identifier = sessionInput.safeParse(route);
  const position = positionParam.safeParse(q);
  if (!identifier.success || (q !== undefined && !position.success)) notFound();
  const { session } = identifier.data;
  const response = await client.rpc("practice_session", {
    p_session: session, ...(position.success && { p_position: position.data }),
  });
  if (response.error) return <AccountNotice>Sesi belum dapat dimuat. Muat ulang halaman untuk mencoba kembali.</AccountNotice>;
  if (response.data === null) notFound();
  const result = practiceSession.safeParse(response.data);
  if (!result.success) return <AccountNotice>Data sesi belum dapat ditampilkan. Muat ulang halaman untuk mencoba kembali.</AccountNotice>;
  const data = result.data;
  if (position.success && !data.item) notFound();
  const answered = data.navigation.filter((entry) => entry.answered).length;
  const current = data.item?.position;
  const path = `/practice/${session}`;

  return (
    <div className="space-y-5">
      <div>
        <Link href={data.finished_at && current ? path : "/practice"} className={`${link} text-sm`}>
          {data.finished_at && current ? "Kembali ke ringkasan" : "Latihan dan riwayat"}
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{data.finished_at && !current ? "Ringkasan latihan" : data.subtest}</h1>
        {data.topic && <p className="mt-2 text-sm/6 text-muted">Topik · {data.topic}</p>}
      </div>
      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          {data.item ? <Question session={session} item={data.item} finished={Boolean(data.finished_at)} /> :
            data.result ? <Results result={data.result} subtest={data.subtest} /> :
            <AccountNotice>Soal belum dapat ditampilkan. Muat ulang halaman untuk mencoba kembali.</AccountNotice>}
        </div>
        <aside className={`space-y-4 ${card}`} aria-labelledby="session-progress">
          <h2 id="session-progress" className="text-xl font-bold">Progres sesi</h2>
          <p className="text-sm/6 text-muted">{answered} dari {data.question_count} jawaban tersimpan.</p>
          <progress aria-label="Jawaban tersimpan" max={data.question_count} value={answered} className="block h-2 w-full accent-primary" />
          <nav aria-label="Nomor soal">
            <ol role="list" className="grid grid-cols-5 gap-2">
              {data.navigation.map((entry) => (
                <li key={entry.position}>
                  <Link href={`${path}?q=${entry.position}`}
                    aria-label={`Soal ${entry.position}, ${entry.answered ? "sudah dijawab" : "belum dijawab"}`}
                    aria-current={entry.position === current ? "page" : undefined}
                    className={`flex min-h-11 items-center justify-center rounded-lg border text-sm font-bold hover:bg-lavender ${entry.position === current ? "border-primary bg-lavender" : entry.answered ? "border-line bg-lavender" : "border-line"}`}>
                    {entry.position}{entry.answered && <span aria-hidden="true" className="ml-0.5 text-success">✓</span>}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
          {current && <div className="flex flex-wrap justify-between gap-x-3 text-sm">
            {current > 1 && <Link href={`${path}?q=${current - 1}`} className={link}>Sebelumnya</Link>}
            {current < data.question_count && <Link href={`${path}?q=${current + 1}`} className={`ml-auto ${link}`}>Soal berikutnya</Link>}
          </div>}
          {!data.finished_at && (
            <details className="border-t border-line pt-3">
              <summary className="min-h-11 cursor-pointer py-2 text-sm font-bold">Akhiri latihan</summary>
              <p className="mb-3 text-sm/6 text-muted">
                {data.question_count - answered} soal belum dijawab. Setelah latihan diakhiri, jawaban tidak dapat diubah.
              </p>
              <PracticeForm action={finishPractice} label="Selesaikan sesi" pendingLabel="Menyimpan hasil…">
                <input type="hidden" name="session" value={session} />
              </PracticeForm>
            </details>
          )}
        </aside>
      </div>
    </div>
  );
}

function Question({ session, item, finished }: {
  session: string; item: NonNullable<PracticeSession["item"]>; finished: boolean;
}) {
  const feedback = item.feedback;
  return (
    <section className={`space-y-5 ${card}`} aria-labelledby="question-heading">
      <div>
        <h2 id="question-heading" className="text-xl font-bold">Soal {item.position}</h2>
        <p className="mt-1 text-sm text-muted">{item.topic}</p>
      </div>
      {item.passage && <section aria-labelledby="practice-passage" className="rounded-lg border border-line bg-paper p-4 sm:p-5">
        <h3 id="practice-passage" className="mb-2 text-sm font-bold">Bacaan</h3>
        <p className="max-w-[64ch] text-base/8 wrap-anywhere whitespace-pre-wrap">{item.passage}</p>
      </section>}
      <p className="text-base/8 font-semibold wrap-anywhere whitespace-pre-wrap">{item.stem}</p>
      {feedback || finished ? (
        <ol role="list" aria-label="Pilihan jawaban" className="space-y-2">
          {item.options.map((option) => (
            <li key={option.position} className="rounded-lg border border-line px-4 py-3 text-base/7 wrap-anywhere whitespace-pre-wrap">
              <span className="font-semibold">{option.position}. </span>{option.text}
              {feedback?.selected_position === option.position && <span className="block text-sm font-semibold text-muted">Pilihanmu</span>}
              {feedback?.correct_position === option.position && <span className="block text-sm font-bold text-success">Jawaban benar</span>}
            </li>
          ))}
        </ol>
      ) : (
        <PracticeForm key={item.position} action={submitPracticeAnswer} label="Kirim jawaban" pendingLabel="Menyimpan jawaban…">
          <input type="hidden" name="session" value={session} />
          <input type="hidden" name="position" value={item.position} />
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-bold">Pilih satu jawaban</legend>
            {item.options.map((option) => (
              <label key={option.position} className="flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border border-line px-4 py-3 text-base/7 has-checked:border-primary has-checked:bg-lavender">
                <input type="radio" name="choice" value={option.position} className="mt-1.5 size-4 shrink-0 accent-primary" required />
                <span className="min-w-0 wrap-anywhere whitespace-pre-wrap">{option.text}</span>
              </label>
            ))}
          </fieldset>
          <p className="text-sm/6 text-muted">Jawaban akan dikunci setelah berhasil tersimpan.</p>
        </PracticeForm>
      )}
      {feedback ? (
        <section aria-labelledby="practice-feedback" className="rounded-lg border border-line bg-lavender p-4 sm:p-5">
          <p role="status" className={`font-bold ${feedback.is_correct ? "text-success" : "text-ink"}`}>
            Jawaban tersimpan. {feedback.is_correct ? "Jawabanmu benar." : "Jawabanmu belum tepat."}
          </p>
          <h3 id="practice-feedback" className="mt-2 font-bold">Pembahasan</h3>
          <p className="mt-1 text-base/8 wrap-anywhere whitespace-pre-wrap">{feedback.explanation}</p>
        </section>
      ) : finished ? <AccountNotice>Soal ini belum dijawab.</AccountNotice> : null}
    </section>
  );
}

function Results({ result, subtest }: { result: NonNullable<PracticeSession["result"]>; subtest: string }) {
  const percent = new Intl.NumberFormat("id-ID", { style: "percent", maximumFractionDigits: 2 });
  return (
    <section aria-labelledby="practice-result" className={`space-y-5 ${card}`}>
      <div>
        <h2 id="practice-result" className="text-xl font-bold">{subtest}</h2>
        <p className="mt-2 text-sm/6 text-muted">Akurasi latihan dihitung dari jawaban benar dibagi {result.question_count} soal.</p>
        <p className="mt-2 text-3xl font-bold tabular-nums">{percent.format(result.accuracy_percent / 100)}</p>
      </div>
      <dl className="grid grid-cols-3 gap-2">
        {[["Benar", result.correct], ["Salah", result.incorrect], ["Belum dijawab", result.unanswered]].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-line bg-paper px-2 py-3 text-center">
            <dt className="text-xs text-muted sm:text-sm">{label}</dt><dd className="mt-1 text-xl font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <section aria-labelledby="topic-results">
        <h3 id="topic-results" className="font-bold">Hasil per topik</h3>
        <ul role="list" className="mt-2 divide-y divide-line">
          {result.by_topic.map((entry) => <li key={entry.topic_code} className="py-2 text-sm/6">
            <strong>{entry.topic}</strong><br />
            <span className="text-muted">{entry.correct} benar · {entry.incorrect} salah · {entry.unanswered} belum dijawab</span>
          </li>)}
        </ul>
      </section>
      <p className="text-sm/6 text-muted">Pilih nomor soal untuk meninjau jawaban yang sudah tersimpan.</p>
    </section>
  );
}
