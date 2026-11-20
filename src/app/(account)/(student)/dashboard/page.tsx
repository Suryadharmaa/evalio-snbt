import { AccountNotice, accountLink } from "@/features/account/account-panel";
import { requireStudent } from "@/lib/auth/student";

export default async function DashboardPage({ searchParams }: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  await requireStudent();
  const { status } = await searchParams;

  return (
    <section className="rounded-panel border border-line bg-surface p-6 sm:p-8">
      <h1 className="text-3xl font-bold tracking-tight">Dasbor siswa</h1>
      <p className="mt-2 max-w-lg text-base/7 text-muted">
        Akun uji siap digunakan. Fitur latihan dan progres belajar sedang disiapkan.
      </p>
      {status === "logout-error" && (
        <div className="mt-4"><AccountNotice>Belum berhasil keluar. Coba lagi.</AccountNotice></div>
      )}
      <a href="/profile" className={`mt-3 ${accountLink}`}>Lengkapi profil belajar</a>
    </section>
  );
}
