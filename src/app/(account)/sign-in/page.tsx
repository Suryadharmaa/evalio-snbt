import { signIn } from "@/features/account/actions";
import { AccountForm } from "@/features/account/account-form";
import { AccountNotice, AccountPanel, accountLink } from "@/features/account/account-panel";
import { unavailableMessage } from "@/features/account/form-state";
import { getAuthConfig } from "@/lib/auth/config";

const notices: Record<string, string> = {
  required: "Masuk untuk membuka halaman akun. Jika sebelumnya sudah masuk, sesi mungkin telah berakhir.",
  "signed-out": "Kamu sudah keluar.",
  "password-reset": "Kata sandi diperbarui. Masuk dengan kata sandi baru.",
};

export default async function SignInPage({ searchParams }: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const { status } = await searchParams;
  const notice = typeof status === "string" && Object.hasOwn(notices, status) ? notices[status] : undefined;

  return (
    <AccountPanel title="Masuk ke Evalio" description="Gunakan email akun uji yang sudah dikonfirmasi.">
      {notice && <AccountNotice>{notice}</AccountNotice>}
      {getAuthConfig() ? (
        <AccountForm action={signIn} submitLabel="Masuk" fields={[
          { name: "email", label: "Email", type: "email", required: true, autoComplete: "email" },
          { name: "password", label: "Kata sandi", type: "password", required: true, autoComplete: "current-password" },
        ]} />
      ) : <AccountNotice>{unavailableMessage}</AccountNotice>}
      <div className="flex flex-wrap gap-x-5 text-sm">
        <a href="/sign-up" className={accountLink}>Buat akun uji</a>
        <a href="/forgot-password" className={accountLink}>Lupa kata sandi</a>
      </div>
    </AccountPanel>
  );
}
