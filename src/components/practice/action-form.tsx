"use client";

import { type ReactNode, useActionState } from "react";

export function PracticeForm({ action, label, pendingLabel, children }: {
  action: (state: { message: string }, form: FormData) => Promise<{ message: string }>;
  label: string;
  pendingLabel: string;
  children?: ReactNode;
}) {
  const [state, submit, pending] = useActionState(action, { message: "" });
  return (
    <form action={submit} aria-busy={pending} className="space-y-4">
      {children}
      {state.message && <p role="alert" className="rounded-lg border border-line bg-lavender p-3 text-sm/6 text-danger">{state.message}</p>}
      <button type="submit" disabled={pending} className="min-h-11 cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover disabled:cursor-wait disabled:opacity-70">
        {pending ? pendingLabel : label}
      </button>
    </form>
  );
}
