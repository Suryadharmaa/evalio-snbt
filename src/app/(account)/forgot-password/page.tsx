import { requestPasswordReset } from "@/features/account/actions";
import { AccountForm } from "@/features/account/account-form";
import { AccountNotice, AccountPanel, accountLink } from "@/features/account/account-panel";
import { unavailableMessage } from "@/features/account/form-state";
import { getAuthConfig } from "@/lib/auth/config";

export default function ForgotPasswordPage() {
  return (
    <AccountPanel title="Lupa kata sandi" description="Masukkan alamat email akun uji untuk meminta tautan pemulihan.">
      {getAuthConfig() ? (
        <AccountForm action={requestPasswordReset} submitLabel="Kirim tautan pemulihan" fields={[
          { name: "email", label: "Email", type: "email", required: true, autoComplete: "email" },
        ]} />
      ) : <AccountNotice>{unavailableMessage}</AccountNotice>}
      <a href="/sign-in" className={`${accountLink} text-sm`}>Kembali ke halaman masuk</a>
    </AccountPanel>
  );
}
