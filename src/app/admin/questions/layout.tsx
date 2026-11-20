import type { ReactNode } from "react";
import Link from "next/link";
import { requireEditorial } from "@/lib/editorial/access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bank soal | Evalio", robots: { index: false, follow: false } };

export default async function Layout({ children }: { children: ReactNode }) {
  await requireEditorial();
  return (
    <div className="min-h-dvh bg-paper">
      <a href="#editorial-main" className="sr-only z-20 rounded-lg bg-surface p-3 focus:not-sr-only focus:absolute focus:top-2 focus:left-2">Lewati ke konten utama</a>
      <header className="border-b border-line bg-surface">
        <nav aria-label="Navigasi editorial" className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-5 px-5 py-3 sm:px-8">
          <Link href="/admin/questions" className="inline-flex min-h-11 items-center gap-2 font-bold">
            <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-primary text-white">E</span>
            Editorial Evalio
          </Link>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-hover">Dasbor akun</Link>
        </nav>
      </header>
      <main id="editorial-main" tabIndex={-1} className="mx-auto max-w-6xl space-y-5 px-5 py-8 sm:px-8">
        {children}
      </main>
    </div>
  );
}
