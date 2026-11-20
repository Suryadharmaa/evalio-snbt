"use server";

import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth/student";
import { answerInput, sessionInput, startInput } from "./contracts";

type Result = { message: string };

export async function startPractice(_state: Result, data: FormData): Promise<Result> {
  const { client } = await requireStudent(true);
  const input = startInput.safeParse(Object.fromEntries(data));
  if (!input.success) return { message: "Periksa subtes, topik, dan jumlah soal." };
  const { blueprint, subtest, topic, length, request } = input.data;
  const { data: session, error } = await client.rpc("practice_start", {
    p_blueprint: blueprint, p_subtest: subtest, p_topic: topic || null, p_count: length, p_request: request,
  });
  if (error || !session) {
    if (error?.code === "P0001") return { message: "Soal terbit yang tersedia belum cukup. Muat ulang daftar atau pilih jumlah yang lebih kecil." };
    return { message: "Latihan belum dapat dimulai. Muat ulang daftar dan coba lagi." };
  }
  redirect(`/practice/${session}`);
}

export async function submitPracticeAnswer(_state: Result, data: FormData): Promise<Result> {
  const { client } = await requireStudent(true);
  const input = answerInput.safeParse(Object.fromEntries(data));
  if (!input.success) return { message: "Pilih satu jawaban yang tersedia." };
  const { session, position, choice } = input.data;
  const { error } = await client.rpc("practice_answer", { p_session: session, p_position: position, p_choice: choice });
  if (error) {
    return { message: error.code === "23505" || error.code === "23514"
      ? "Soal atau sesi sudah berubah. Muat ulang halaman untuk melihat status tersimpan."
      : "Pengiriman jawaban belum terkonfirmasi. Coba kirim pilihan yang sama atau muat ulang halaman." };
  }
  // The acknowledgement carries no solution. The next independently authorized read
  // can reveal feedback only after the PostgREST write transaction committed.
  redirect(`/practice/${session}?q=${position}`);
}

export async function finishPractice(_state: Result, data: FormData): Promise<Result> {
  const { client } = await requireStudent(true);
  const input = sessionInput.safeParse(Object.fromEntries(data));
  if (!input.success) return { message: "Sesi tidak valid." };
  const { session } = input.data;
  const { error } = await client.rpc("practice_finish", { p_session: session });
  if (error) return { message: "Ringkasan belum dapat disimpan. Coba lagi atau muat ulang halaman." };
  redirect(`/practice/${session}`);
}
