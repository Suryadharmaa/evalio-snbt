import { resetPassword } from "@/features/account/actions";
import { AccountForm } from "@/features/account/account-form";
import { AccountNotice, AccountPanel, accountLink } from "@/features/account/account-panel";
import { getRecoveryClient } from "@/lib/auth/recovery";

export default async function ResetPasswordPage() {
  const recovery = await getRecoveryClient();
  return (
    <AccountPanel title="Buat kata sandi baru" description="Pilih kata sandi baru untuk akun Evalio.">
      {recovery ? (
        <AccountForm action={resetPassword} submitLabel="Simpan kata sandi" fields={[
          { name: "password", label: "Kata sandi baru", type: "password", required: true, minLength: 8, autoComplete: "new-password", hint: "Gunakan minimal 8 karakter." },
        ]} />
      ) : <AccountNotice>Sesi pemulihan tidak tersedia. Buka tautan dari email atau minta tautan baru.</AccountNotice>}
      <a href="/forgot-password" className={`${accountLink} text-sm`}>Minta tautan baru</a>
    </AccountPanel>
  );
}
