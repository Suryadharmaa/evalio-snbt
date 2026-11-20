import Link from "next/link";
import type { ReactNode } from "react";
import { MobileNavigation, type SectionLink } from "./marketing/mobile-navigation";

const sectionLinks = [
  { href: "#cara-kerja", label: "Cara kerja" },
  { href: "#cuplikan", label: "Cuplikan" },
  { href: "#subtes", label: "Subtes" },
  { href: "#paket", label: "Paket" },
  { href: "#faq", label: "FAQ" },
] as const satisfies readonly SectionLink[];

function Wordmark() {
  return (
    <Link href="/" translate="no" className="inline-flex min-h-11 items-center gap-2.5 font-display text-[1.75rem] leading-none font-bold tracking-tight">
      <span aria-hidden="true" className="grid size-8 place-items-center rounded-[9px] bg-primary text-xl text-white">
        E
      </span>
      Evalio
    </Link>
  );
}

function SectionLinks() {
  return (
    <ul className="flex flex-wrap gap-x-2 gap-y-1">
      {sectionLinks.map(({ href, label }) => (
        <li key={href}>
          <a href={href} className="inline-flex min-h-11 items-center rounded-lg px-2.5 text-sm font-semibold text-muted hover:bg-lavender hover:text-ink">
            {label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function MarketingShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <a
        href="#konten-utama"
        className="sr-only z-30 rounded-panel bg-surface p-3 font-semibold focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        Lewati ke konten utama
      </a>
      <header className="relative z-10 border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Wordmark />
          <nav aria-label="Navigasi utama" className="hidden md:block">
            <SectionLinks />
          </nav>
          <MobileNavigation links={sectionLinks} />
        </div>
      </header>
      <main id="konten-utama" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <footer className="border-t border-line bg-paper">
        <div className="mx-auto max-w-6xl px-5 pt-7 pb-8 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2">
            <Wordmark />
            <nav aria-label="Navigasi kaki halaman">
              <SectionLinks />
            </nav>
          </div>
          <p className="mt-4 border-t border-line pt-5 text-sm/6 text-muted">
            Evalio adalah platform independen tanpa afiliasi dengan SNPMB atau perguruan tinggi negeri.
          </p>
        </div>
      </footer>
    </div>
  );
}
