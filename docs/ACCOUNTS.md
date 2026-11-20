# EVAL-002 student accounts

The account routes live in `src/app/(account)`. Visit `/sign-in` or `/sign-up` on the isolated preview. The landing page remains static. In a build without the account configuration, public account pages show availability, private pages require sign-in, and the export endpoint returns 401.

## Isolated development setup

Use the local Supabase project in `supabase/config.toml` with synthetic addresses and the local Mailpit inbox. The project uses separate loopback client endpoints on ports 55321 (API), 55322 (database), and 55324 (mail). From the repository root:

1. Run `supabase start`. Use the printed API URL and publishable key in `.env.local` or the Cloud environment. Set `NEXT_PUBLIC_APP_URL=http://127.0.0.1:3100` for Playwright.
2. Generate an independent `EVALIO_RECOVERY_SECRET` with `openssl rand -hex 32` and keep it server-side. Use the publishable key with the Next.js app. The app requires no Supabase secret or service-role key.
3. Run `npm ci` and `npm run build`. Use `npm run start -- --hostname 127.0.0.1 --port 3100` for a manual preview.
4. Run `supabase test db --local` for the migration and RLS tests. Run `EVALIO_TEST_LOCAL_SUPABASE=1 npm run test:e2e` with the same app and Supabase settings exported to the test process. Playwright starts Next.js for this command. The integration scenarios themselves accept only the configured loopback API.
5. Stop the test stack after the run. If you need a clean database, confirm the target is the disposable local instance before running `supabase db reset --local`.

For staging, use a separate access-restricted project and synthetic accounts. Set the HTTPS preview origin as Supabase Auth's Site URL and add its exact `/auth/confirm` route to the redirect allowlist. Enable email confirmations, use safe test email delivery, and configure the [confirmation and recovery templates](../supabase/templates/). Keep Auth rate limits enabled and omit confirmation query strings from logs and analytics. Use the checked-in migration in the approved staging project only. The privacy acknowledgment version in the signup action must match the profile initialization function. Update both together when the notice changes.

## Authorization and recovery

Next.js 16 `proxy.ts` refreshes Supabase cookies on protected and recovery routes. It forwards cookie updates to the server request and response, with private, no-store caching. Cookies are HttpOnly and SameSite=Lax. HTTPS origins use Secure cookies. Protected pages, mutations and exports verify identity with Supabase Auth. Queries use the verified ID, and PostgreSQL also enforces ownership. Only nickname, target year and study goal are user-writable. The separate `evalio_private.user_roles` table is accessible to database operators. Signup metadata never grants elevated roles.

Email links open a confirmation form. An explicit POST verifies the one-time token, so a mail scanner's GET does not consume it. The callback sends no referrer and dispatches to the provider’s separate signup and recovery purposes. Recovery has a separate cookie namespace scoped to `/reset-password`. A server-signed grant expires after 15 minutes and is bound to the verified recovery session ID. After the password changes, the app requests global refresh-token revocation and clears its recovery cookies. As with Supabase JWT sessions generally, already issued access tokens can remain valid until expiry where a consumer checks only the JWT signature.

The signup acknowledgment records which preview notice the user read. It provides no evidence of age, identity, or guardian consent. The preview uses synthetic data. Before opening registration to students, the founder must review the notice, age-appropriate safeguards, any applicable consent requirements, retention, and a contact channel for data requests.

## Account deletion procedure

1. From the signed-in profile, the student can export their own data as JSON and submit a deletion request. The owner-scoped RPC records the first timestamp. The page shows that the request is pending.
2. An authorized staging operator checks the queue using the SQL below. Work from the request UUID. Keep exports, tokens, and personal identifiers out of logs and tickets.
3. The operator confirms the intended staging project and the applicable retention policy, then uses the Supabase Auth user management interface to **hard-delete** the requested Auth account. The database cascades the deletion to its profile, acknowledgment, and restricted role rows. Handle any external test email or future external records under their applicable retention rules.
4. Verify the Auth user and associated database rows are gone. A fresh page load must require sign-in. Record completion using the team's restricted operational process.

```sql
select user_id, delete_requested_at
from public.profiles
where delete_requested_at is not null
order by delete_requested_at;
```

References [Supabase SSR for Next.js](https://supabase.com/docs/guides/auth/server-side/creating-a-client) and [password-based Auth](https://supabase.com/docs/guides/auth/passwords).
