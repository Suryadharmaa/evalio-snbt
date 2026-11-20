import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Evalio | Persiapan UTBK-SNBT",
  description:
    "Persiapan UTBK-SNBT dan perencanaan pilihan program studi di perguruan tinggi negeri.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="id"><body className="antialiased">{children}</body></html>;
}
