import Link from "next/link";
import { card, EditorialNotice, statuses } from "@/components/editorial/ui";
import { requireEditorial } from "@/lib/editorial/access";
import { questionList } from "@/lib/editorial/contracts";

export default async function QuestionsPage() {
  const { client, roles } = await requireEditorial();
  const result = await client.rpc("editorial_question_workspace", {});
  const list = questionList.safeParse(result.data);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl font-bold tracking-tight">Bank soal</h1>
          <p className="mt-1 text-sm/6 text-muted">Kelola draf, tinjau versi, dan terbitkan soal yang disetujui.</p></div>
        {(roles.includes("editor") || roles.includes("admin")) && (
          <Link href="/admin/questions/new" className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-bold text-white hover:bg-primary-hover">Buat draf</Link>
        )}
      </div>
      {result.error || !list.success ? (
        <EditorialNotice>Daftar soal belum dapat dimuat. Muat ulang halaman untuk mencoba kembali.</EditorialNotice>
      ) : list.data.versions.length ? (
        <ul role="list" className="space-y-3">
          {list.data.versions.map((item) => (
            <li key={item.id} className={card}>
              <p className="text-sm font-semibold text-primary-hover">{item.subtest_code} · v{item.version} · {statuses[item.status]}</p>
              <Link href={`/admin/questions/${item.id}`} className="mt-2 flex min-h-11 items-center font-semibold wrap-anywhere underline-offset-4 hover:underline">
                {item.stem}
              </Link>
            </li>
          ))}
        </ul>
      ) : <EditorialNotice>Bank soal masih kosong. Buat draf pertama untuk memulai.</EditorialNotice>}
    </>
  );
}
