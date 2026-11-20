import Link from "next/link";
import type { ReactNode } from "react";

export function MarketingShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#konten-utama"
        className="sr-only z-10 rounded-panel bg-surface p-3 font-semibold focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        Lewati ke konten utama
      </a>
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2.5 font-display text-2xl font-bold tracking-tight">
            <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-primary text-xl text-white">
              E
            </span>
            Evalio
          </Link>
          <nav aria-label="Navigasi utama">
            <a href="#tentang-evalio" className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-ink underline-offset-4 hover:underline">
              Tentang Evalio
            </a>
          </nav>
        </div>
      </header>
      <main id="konten-utama" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-x-8 gap-y-2 px-5 py-7 sm:px-8">
          <span className="font-display text-xl font-bold">Evalio</span>
          <p className="text-sm/6 text-muted">Platform independen di luar SNPMB dan perguruan tinggi negeri.</p>
        </div>
      </footer>
    </div>
  );
}
