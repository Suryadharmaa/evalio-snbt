import type { ReactNode } from "react";

export const accountLink = "inline-flex min-h-11 items-center font-semibold text-primary-hover underline underline-offset-4 hover:text-ink";

export function AccountPanel({
  title, description, children,
}: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-lg rounded-panel border border-line bg-surface p-6 sm:p-8">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm/6 text-muted">{description}</p>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

export function AccountNotice({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-line bg-lavender p-3 text-sm/6">{children}</p>;
}
