import { resendConfirmation, signUp } from "@/features/account/actions";
import { AccountForm, type AccountField } from "@/features/account/account-form";
import { AccountNotice, AccountPanel, accountLink } from "@/features/account/account-panel";
import { unavailableMessage } from "@/features/account/form-state";
import { getAuthConfig } from "@/lib/auth/config";

const email: AccountField = { name: "email", label: "Email", type: "email", required: true, autoComplete: "email" };

export default function SignUpPage() {
  return (
    <AccountPanel title="Buat akun uji" description="Pendaftaran saat ini khusus pengujian. Gunakan alamat uji dan hindari data pelajar sungguhan.">
      <a href="/privacy" className={`${accountLink} text-sm`}>Baca pemberitahuan privasi</a>
      {getAuthConfig() ? (
        <>
          <AccountForm action={signUp} submitLabel="Daftar" fields={[
            email,
            { name: "password", label: "Kata sandi", type: "password", required: true, minLength: 8, autoComplete: "new-password", hint: "Gunakan minimal 8 karakter." },
            { name: "cohortYear", label: "Tahun target UTBK", type: "number", min: 2026, max: 2100, defaultValue: "2027", required: true },
            { name: "acknowledged", label: "Saya menggunakan akun uji dan telah membaca pemberitahuan privasi.", type: "checkbox", required: true },
          ]} />
          <details className="border-t border-line pt-2">
            <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold">
              Kirim ulang tautan konfirmasi
            </summary>
            <AccountForm action={resendConfirmation} submitLabel="Kirim ulang" fields={[email]} secondary />
          </details>
        </>
      ) : <AccountNotice>{unavailableMessage}</AccountNotice>}
      <a href="/sign-in" className={`${accountLink} text-sm`}>Sudah punya akun? Masuk</a>
    </AccountPanel>
  );
}
