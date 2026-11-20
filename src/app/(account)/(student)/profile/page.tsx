import { requestDeletion, saveProfile } from "@/features/account/actions";
import { AccountForm } from "@/features/account/account-form";
import { AccountNotice, accountLink } from "@/features/account/account-panel";
import { requireStudent } from "@/lib/auth/student";

const dateFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" });

export default async function ProfilePage({ searchParams }: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const { client, user } = await requireStudent();
  const { status } = await searchParams;
  const { data: profile } = await client.from("profiles")
    .select("alias, cohort_year, study_goal, created_at, delete_requested_at")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1.2fr_1fr]">
      <section className="rounded-panel border border-line bg-surface p-6 sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight">Profil belajar</h1>
        {profile ? (
          <div className="mt-5 space-y-5">
            <dl className="space-y-2 rounded-lg bg-paper p-3 text-sm/6">
              <div>
                <dt className="font-semibold">Email akun</dt>
                <dd className="wrap-anywhere text-muted">{user.email}</dd>
              </div>
              <div>
                <dt className="font-semibold">Akun dibuat</dt>
                <dd className="text-muted">{dateFormatter.format(new Date(profile.created_at))}</dd>
              </div>
            </dl>
            {status === "saved" && <AccountNotice>Profil tersimpan.</AccountNotice>}
            <AccountForm key={JSON.stringify([profile.alias, profile.cohort_year, profile.study_goal])} action={saveProfile} submitLabel="Simpan profil" fields={[
              { name: "alias", label: "Nama panggilan (opsional)", type: "text", maxLength: 60, defaultValue: profile.alias ?? "" },
              { name: "cohortYear", label: "Tahun target UTBK", type: "number", min: 2026, max: 2100, defaultValue: String(profile.cohort_year), required: true },
              { name: "studyGoal", label: "Tujuan belajar (opsional)", type: "textarea", maxLength: 500, defaultValue: profile.study_goal ?? "", hint: "Hindari mencantumkan informasi pribadi." },
            ]} />
          </div>
        ) : <div className="mt-5"><AccountNotice>Profil belum dapat dimuat. Muat ulang halaman untuk mencoba lagi.</AccountNotice></div>}
      </section>

      <section aria-labelledby="kontrol-akun" className="rounded-panel border border-line bg-surface p-6 sm:p-8">
        <h2 id="kontrol-akun" className="text-xl font-bold tracking-tight">Data dan privasi</h2>
        <div className="my-3 flex flex-wrap gap-x-4 text-sm">
          <a href="/privacy" className={accountLink}>Pemberitahuan privasi</a>
          {profile && <a href="/profile/export" className={accountLink}>Unduh data akun</a>}
        </div>
        {profile && (
          <div className="space-y-3 border-t border-line pt-4">
            <h3 className="font-bold">Penghapusan akun</h3>
            {profile.delete_requested_at ? (
              <AccountNotice>Permintaan tercatat pada {dateFormatter.format(new Date(profile.delete_requested_at))}. Pengelola akan memproses permintaan ini.</AccountNotice>
            ) : (
              <>
                <p className="text-sm/6 text-muted">Pengelola akan menghapus akun dan data profil setelah memproses permintaanmu.</p>
                <AccountForm action={requestDeletion} submitLabel="Minta penghapusan" secondary fields={[
                  { name: "confirmed", label: "Saya ingin meminta penghapusan akun ini.", type: "checkbox", required: true },
                ]} />
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
