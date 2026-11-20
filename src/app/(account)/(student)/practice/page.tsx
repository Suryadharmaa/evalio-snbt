import { randomUUID } from "node:crypto";
import Link from "next/link";
import { PracticeConfiguration } from "@/components/practice/configuration";
import { AccountNotice } from "@/features/account/account-panel";
import { requireStudent } from "@/lib/auth/student";
import { catalog, practiceHistory } from "@/lib/practice/contracts";

const card = "rounded-panel border border-line bg-surface p-5 sm:p-7";
const date = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" });

export const metadata = { title: "Latihan UTBK | Evalio" };

export default async function PracticePage({ searchParams }: {
  searchParams: Promise<{ subtest?: string | string[] }>;
}) {
  const { client } = await requireStudent();
  const [{ subtest }, available, past] = await Promise.all([
    searchParams, client.rpc("practice_catalog"), client.rpc("practice_history"),
  ]);
  const reference = catalog.safeParse(available.data);
  const history = practiceHistory.safeParse(past.data);
  const selected = reference.success ? (
    reference.data.subtests.find((item) => item.code === subtest) ?? reference.data.subtests[0]
  ) : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Latihan UTBK</h1>
        <p className="mt-2 max-w-xl text-sm/6 text-muted sm:text-base/7">
          Pilih subtes dan pelajari pembahasan setelah jawabanmu tersimpan.
        </p>
      </header>
      {reference.success && selected && !available.error ? (
        <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <section aria-labelledby="practice-subtests" className={card}>
            <h2 id="practice-subtests" className="text-xl font-bold">Pilih subtes</h2>
            <p className="mt-1 text-sm/6 text-muted">
              {reference.data.classification === "historical_reference" ? "Rujukan historis" : "Rujukan resmi"} {reference.data.exam_year} · v{reference.data.version}
            </p>
            <ul role="list" className="mt-4 space-y-2">
              {reference.data.subtests.map((item) => (
                <li key={item.code}>
                  <Link href={`/practice?subtest=${item.code}`} scroll={false}
                    aria-current={item.code === selected.code ? "page" : undefined}
                    className={`flex min-h-12 flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-sm/6 hover:bg-lavender ${item.code === selected.code ? "border-primary bg-lavender" : "border-line"}`}>
                    <span className="font-semibold">{item.name}</span>
                    <span className="text-muted">{item.count} soal</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="practice-settings" className={`space-y-4 ${card}`}>
            <div>
              <h2 id="practice-settings" className="text-xl font-bold">Atur sesi</h2>
              <p className="mt-1 text-sm text-muted">{selected.name}</p>
            </div>
            {selected.count === 0 && (
              <AccountNotice>Belum ada soal terbit untuk subtes ini. Latihan akan tersedia setelah ada soal yang ditinjau dan diterbitkan.</AccountNotice>
            )}
            <PracticeConfiguration key={`${reference.data.id}-${selected.code}`} blueprint={reference.data.id} subtest={selected} request={randomUUID()} />
          </section>
        </div>
      ) : (
        <AccountNotice>{available.error || (available.data !== null && !reference.success)
          ? "Daftar latihan belum dapat dimuat. Muat ulang halaman untuk mencoba kembali."
          : "Rujukan latihan belum tersedia."}</AccountNotice>
      )}

      <section aria-labelledby="practice-history" className={`space-y-4 ${card}`}>
        <h2 id="practice-history" className="text-xl font-bold">Riwayat latihan</h2>
        {!history.success || past.error ? <AccountNotice>Riwayat belum dapat dimuat. Coba muat ulang halaman.</AccountNotice>
          : history.data.length ? (
            <ul role="list" className="divide-y divide-line">
              {history.data.map((session) => (
                <li key={session.id}>
                  <Link href={`/practice/${session.id}`} className="flex min-h-14 flex-wrap items-center justify-between gap-2 px-1 py-3 text-sm">
                    <span><strong className="block">{session.subtest}</strong><span className="text-muted">{date.format(new Date(session.started_at))} · {session.question_count} soal</span></span>
                    <span className="font-semibold text-primary-hover">
                      {session.finished_at ? `Lihat hasil · ${session.accuracy_percent}%` : `Lanjutkan · ${session.answered}/${session.question_count} dijawab`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm/6 text-muted">Sesi latihanmu akan muncul di sini.</p>}
      </section>
    </div>
  );
}
