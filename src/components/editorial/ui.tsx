import type { ReactNode } from "react";

export const card = "rounded-panel border border-line bg-surface p-5 sm:p-7";
export const control = "block min-h-11 w-full min-w-0 rounded-lg border border-muted bg-surface px-3 py-2 font-normal text-ink";

export const statuses = {
  draft: "Draf", in_review: "Dalam peninjauan", published: "Terbit", retired: "Diarsipkan",
} as const;

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1.5 text-sm font-semibold"><span>{label}</span>{children}</label>;
}

export function EditorialNotice({ children }: { children: ReactNode }) {
  return <p role="status" className="rounded-lg border border-line bg-lavender p-3 text-sm/6">{children}</p>;
}
