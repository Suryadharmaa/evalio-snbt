"use client";

import { type ReactNode, useActionState } from "react";

type Result = { message: string };

export function EditorialForm({ action, label, children, subtle = false }: {
  action: (state: Result, form: FormData) => Promise<Result>;
  label: string;
  children?: ReactNode;
  subtle?: boolean;
}) {
  const [state, submit, pending] = useActionState(action, { message: "" });
  return (
    <form action={submit} aria-busy={pending} className="space-y-4">
      {children}
      {state.message && <p role="alert" className="rounded-lg bg-lavender p-3 text-sm/6 text-danger">{state.message}</p>}
      <button type="submit" disabled={pending} className={`min-h-11 cursor-pointer rounded-lg px-4 py-2 text-sm font-bold disabled:cursor-wait disabled:opacity-70 ${subtle ? "border border-muted bg-surface hover:bg-lavender" : "bg-primary text-white hover:bg-primary-hover"}`}>
        {pending ? "Memproses…" : label}
      </button>
    </form>
  );
}
