import { confirmEmail } from "@/features/account/actions";
import { AccountForm } from "@/features/account/account-form";
import { AccountNotice, AccountPanel, accountLink } from "@/features/account/account-panel";
import { unavailableMessage } from "@/features/account/form-state";
import { confirmationSchema } from "@/features/account/validation";
import { getAuthConfig } from "@/lib/auth/config";

export default async function ConfirmPage({ searchParams }: {
  searchParams: Promise<{ token_hash?: string | string[]; type?: string | string[] }>;
}) {
  const query = await searchParams;
  const token = confirmationSchema.safeParse(query);
  const recovery = query.type === "recovery";
  const title = recovery ? "Lanjutkan pemulihan" : "Konfirmasi email";
  const retry = recovery ? "/forgot-password" : "/sign-up";

  return (
    <AccountPanel title={title} description="Gunakan tombol di bawah jika kamu meminta tautan ini.">
      {!getAuthConfig() ? <AccountNotice>{unavailableMessage}</AccountNotice> : token.success ? (
        <AccountForm action={confirmEmail} submitLabel={title} hiddenFields={token.data} />
      ) : <AccountNotice>Tautan tidak valid. Minta tautan baru.</AccountNotice>}
      <a href={retry} className={`${accountLink} text-sm`}>Minta tautan baru</a>
    </AccountPanel>
  );
}
