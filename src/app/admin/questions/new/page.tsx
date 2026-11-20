import { notFound } from "next/navigation";
import { QuestionEditor } from "@/components/editorial/question-editor";
import { card, EditorialNotice } from "@/components/editorial/ui";
import { requireEditorial } from "@/lib/editorial/access";
import { choices } from "@/lib/editorial/contracts";

export default async function NewQuestionPage() {
  const { client, roles } = await requireEditorial();
  if (!roles.includes("editor") && !roles.includes("admin")) notFound();
  const result = await client.rpc("editorial_question_choices");
  const catalog = choices.safeParse(result.data);

  return (
    <section className={`max-w-3xl space-y-5 ${card}`}>
      <h1 className="text-3xl font-bold tracking-tight">Buat draf soal</h1>
      {!catalog.success || result.error || !catalog.data.topics.length ?
        <EditorialNotice>Taksonomi yang disetujui belum tersedia. Muat ulang halaman untuk mencoba kembali.</EditorialNotice> :
        <QuestionEditor catalog={catalog.data} />}
    </section>
  );
}
