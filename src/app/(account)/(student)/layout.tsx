import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/features/account/actions";
import { requireStudent } from "@/lib/auth/student";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  await requireStudent();

  return (
    <>
      <nav aria-label="Navigasi akun" className="mb-5 flex flex-wrap items-center gap-x-5 border-b border-line pb-2 text-sm font-semibold">
        <a href="/dashboard" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">Dasbor</a>
        <a href="/profile" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">Profil</a>
        <Link href="/practice" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">Latihan</Link>
        <form action={signOut} className="ml-auto">
          <button type="submit" className="min-h-11 cursor-pointer rounded-lg border border-line bg-surface px-3 hover:bg-lavender">Keluar</button>
        </form>
      </nav>
      {children}
    </>
  );
}
