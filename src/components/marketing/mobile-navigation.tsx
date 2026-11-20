"use client";

import { useRef, useState } from "react";

export type SectionLink = Readonly<{ href: string; label: string }>;

export function MobileNavigation({ links }: { links: readonly SectionLink[] }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);

  return (
    <div
      className="md:hidden"
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpen(false);
          toggle.current?.focus();
        }
      }}
    >
      <button
        ref={toggle}
        type="button"
        aria-expanded={open}
        aria-controls="menu-ponsel"
        onClick={() => setOpen(!open)}
        className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-line px-3.5 text-sm font-semibold hover:bg-lavender"
      >
        Menu
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      <nav
        id="menu-ponsel"
        aria-label="Navigasi utama"
        hidden={!open}
        className="absolute inset-x-0 top-full z-20 border-y border-line bg-surface px-5 py-2 shadow-lg sm:px-8"
      >
        <ul>
          {links.map(({ href, label }) => (
            <li key={href}>
              <a
                href={href}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold hover:bg-lavender"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
