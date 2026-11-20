"use server";

import { redirect } from "next/navigation";
import { requireEditorial } from "./access";
import { draft, transition, versionReference } from "./contracts";

const questionPath = "/admin/questions";
type Result = { message: string };

function optional(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function databaseError(code: string) {
  if (code === "40001") return "Versi berubah. Muat ulang halaman dan coba kembali.";
  if (code === "42501") return "Kamu tidak memiliki izin untuk tindakan ini.";
  if (code === "23505") return "Draf atau keputusan untuk versi ini sudah ada, atau ada pilihan yang sama.";
  if (code === "23514" || code === "23503" || code === "23502") {
    return "Tindakan tidak memenuhi aturan versi, taksonomi, atau peninjauan. Periksa isian dan status soal.";
  }
  return "Tindakan gagal. Coba kembali.";
}

export async function saveQuestion(_state: Result, form: FormData): Promise<Result> {
  const { client, roles } = await requireEditorial(true);
  if (!roles.includes("editor") && !roles.includes("admin")) return { message: "Izin editor diperlukan." };
  let version: string | null = null;
  let revision: number | null = null;
  if (form.has("version")) {
    const existing = versionReference.safeParse(Object.fromEntries(form));
    if (!existing.success) return { message: "Versi soal tidak valid." };
    ({ version, revision } = existing.data);
  }

  const taxonomy = optional(form.get("taxonomy"))?.split("|") ?? [];
  const options = Array.from({ length: 5 }, (_, index) => optional(form.get(`option-${index + 1}`)));
  const count = options.filter((entry) => entry !== null).length;
  if (options.slice(0, count).includes(null)) return { message: "Isi pilihan secara berurutan." };
  const input = draft.safeParse({
    blueprint_id: taxonomy[0], subtest_code: taxonomy[1], topic_code: taxonomy[2],
    stem: form.get("stem"), difficulty: form.get("difficulty"),
    tags: (optional(form.get("tags")) ?? "").split(",").map((tag) => tag.trim()).filter(Boolean),
    options: options.slice(0, count), answer: Number(form.get("answer")), explanation: form.get("explanation"),
    passage_version_id: optional(form.get("passage_version_id")),
    passage_text: optional(form.get("passage_text")),
    license_kind: form.get("license_kind"), owner_name: form.get("owner_name"),
    provenance: form.get("provenance"), agreement_ref: optional(form.get("agreement_ref")),
    source_url: optional(form.get("source_url")),
  });
  if (taxonomy.length !== 3 || !input.success) {
    const issue = input.error?.issues[0];
    return { message: issue?.code === "custom" ? issue.message :
      "Periksa taksonomi, pilihan, pembahasan, dan lisensi sebelum menyimpan." };
  }

  const result = await client.rpc("editorial_save_question", {
    p_version: version, p_revision: revision, p_draft: input.data,
  });
  if (result.error || !result.data) return { message: databaseError(result.error?.code ?? "") };
  redirect(`${questionPath}/${result.data}?result=saved`);
}

export async function transitionQuestion(_state: Result, form: FormData): Promise<Result> {
  const { client } = await requireEditorial(true);
  const input = transition.safeParse({
    ...Object.fromEntries(form),
    notes: optional(form.get("notes")),
    answer: optional(form.get("answer")) === null ? null : Number(form.get("answer")),
  });
  if (!input.success) return { message: input.error.issues[0].code === "custom" ?
    input.error.issues[0].message : "Periksa isian peninjauan." };

  const { version, revision, action, notes, answer } = input.data;
  const result = await client.rpc("editorial_transition_question", {
    p_version: version, p_revision: revision, p_action: action, p_notes: notes, p_answer: answer,
  });
  if (result.error || !result.data) return { message: databaseError(result.error?.code ?? "") };
  const outcome = action === "approve" ? "review" : action;
  redirect(`${questionPath}/${result.data}?result=${outcome}`);
}
