"use client";

import { useActionState, useId, useState } from "react";
import { startPractice } from "@/lib/practice/actions";
import { practiceLengths, type PracticeSubtest } from "@/lib/practice/contracts";

export function PracticeConfiguration({ blueprint, subtest, request }: {
  blueprint: string;
  subtest: PracticeSubtest;
  request: string;
}) {
  const topicId = useId();
  const [topic, setTopic] = useState("");
  const [length, setLength] = useState(5);
  const [state, action, pending] = useActionState(startPractice, { message: "" });
  const available = topic ? (subtest.topics.find((item) => item.code === topic)?.count ?? 0) : subtest.count;
  const enough = available >= length;

  return (
    <form action={action} aria-busy={pending} className="space-y-5">
      <input type="hidden" name="blueprint" value={blueprint} />
      <input type="hidden" name="subtest" value={subtest.code} />
      <input type="hidden" name="request" value={request} />
      <div className="space-y-2">
        <label htmlFor={topicId} className="block text-sm font-semibold">Topik</label>
        <select id={topicId} name="topic" value={topic} onChange={(event) => setTopic(event.target.value)} className="block min-h-11 w-full rounded-lg border border-muted bg-surface px-3 py-2 font-normal">
          <option value="">Semua topik · {subtest.count} soal</option>
          {subtest.topics.map((item) => <option key={item.code} value={item.code}>{item.name} · {item.count} soal</option>)}
        </select>
      </div>
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold">Jumlah soal</legend>
        <div className="grid grid-cols-3 gap-2">
          {practiceLengths.map((value) => <label key={value} className="flex min-h-11 cursor-pointer flex-wrap items-center justify-center gap-2 rounded-lg border border-line px-2 py-2 text-sm font-semibold has-checked:border-primary has-checked:bg-lavender">
            <input className="accent-primary" type="radio" name="length" value={value} checked={length === value}
              onChange={() => setLength(value)} />
            {value} soal
          </label>)}
        </div>
      </fieldset>
      <div role="status" className="text-sm/6 text-muted">
        <p>{available} soal terbit tersedia untuk pilihan ini.</p>
        {!enough && <p>Latihan {length} soal memerlukan {length - available} soal terbit tambahan.</p>}
      </div>
      {state.message && <p role="alert" className="rounded-lg bg-lavender p-3 text-sm/6 text-danger">{state.message}</p>}
      <button type="submit" disabled={pending || !enough} className="min-h-11 cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-line disabled:text-ink">
        {pending ? "Menyiapkan sesi…" : "Mulai latihan"}
      </button>
    </form>
  );
}
