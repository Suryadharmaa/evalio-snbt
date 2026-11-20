import type { ReactNode } from "react";

const sectionWidth = "mx-auto max-w-6xl px-5 sm:px-8";

export function LandingSection({
  id,
  children,
  tone = "white",
}: {
  id: string;
  children: ReactNode;
  tone?: "white" | "paper" | "lavender";
}) {
  const background = { white: "bg-surface", paper: "bg-paper", lavender: "bg-lavender" };
  return (
    <section
      id={id}
      tabIndex={-1}
      aria-labelledby={`${id}-judul`}
      className={`scroll-mt-4 border-t border-line ${background[tone]}`}
    >
      <div className={`${sectionWidth} py-12 sm:py-16 lg:py-20`}>{children}</div>
    </section>
  );
}

export function SectionHeading({
  id,
  title,
  description,
}: {
  id: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      <h2 id={`${id}-judul`} className="font-display text-[2.15rem]/[1.08] tracking-tight text-balance sm:text-5xl/[1.08]">
        {title}
      </h2>
      {description && <p className="mt-3 max-w-xl text-base/7 text-muted">{description}</p>}
    </div>
  );
}

export function DiagnosticLink({ light = false }: { light?: boolean }) {
  const appearance = light
    ? "bg-white text-ink hover:bg-lavender focus-visible:outline-white"
    : "bg-primary text-white hover:bg-primary-hover";

  return (
    <a
      href="#diagnostik"
      aria-describedby={light ? "ketersediaan-akhir" : "ketersediaan-hero"}
      className={`inline-flex min-h-12 w-fit max-w-full items-center gap-3 rounded-xl px-5 py-2.5 text-sm font-bold ${appearance}`}
    >
      Coba Diagnostik Gratis
      <span aria-hidden="true" className="size-2 -translate-y-0.5 rotate-45 border-r border-b" />
    </a>
  );
}

export function PreviewCard({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <article
      id={id}
      aria-labelledby={`${id}-judul`}
      tabIndex={-1}
      className="flex min-w-0 scroll-mt-4 flex-col rounded-panel border border-line bg-surface p-5"
    >
      <p className="text-xs font-bold tracking-wide text-primary-hover uppercase">Ilustrasi · Segera hadir</p>
      <h3 id={`${id}-judul`} className="mt-3 font-display text-2xl tracking-tight">{title}</h3>
      <p className="mt-2 mb-5 text-sm/6 text-muted lg:min-h-18">{description}</p>
      <div className="flex-1 rounded-lg border border-line bg-paper p-3.5">{children}</div>
    </article>
  );
}
