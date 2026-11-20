import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Akun siswa | Evalio",
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper">
      <a href="#konten-akun" className="sr-only z-20 rounded-lg bg-surface p-3 font-semibold focus:not-sr-only focus:absolute focus:top-2 focus:left-2">
        Lewati ke konten utama
      </a>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link href="/" translate="no" className="inline-flex min-h-11 items-center gap-2.5 text-xl font-bold tracking-tight">
            <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-primary text-base text-white">E</span>
            Evalio
          </Link>
          <a href="/privacy" className="inline-flex min-h-11 items-center text-sm font-semibold text-ink underline-offset-4 hover:underline">
            Privasi akun
          </a>
        </div>
      </header>
      <main id="konten-akun" tabIndex={-1} className="mx-auto max-w-5xl px-5 py-9 sm:px-8 sm:py-14">
        {children}
      </main>
    </div>
  );
}
