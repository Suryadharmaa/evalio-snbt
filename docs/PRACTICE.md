# Authenticated practice

`/practice` lists all seven subtests and the exact counts of eligible questions under the latest published reference blueprint. Counts reflect distinct questions with published versions. Selecting a topic counts only that topic. Learners can start a session of 5, 10, or 20 questions when the selected pool has enough items. Practice under the historical taxonomy uses Evalio’s own content.

`/practice/[session]` loads the first unanswered question by default. The learner can navigate among questions, submit one final choice per question, or finish with unanswered questions. Results store correct, incorrect, and unanswered counts, with topic breakdowns and raw accuracy calculated as correct divided by all session items. History shows the 50 most recent sessions, including active sessions.

## Server and database contracts

Next.js pages and Server Actions verify the user through the existing Supabase account guard. Zod validates action inputs and the database response shapes. The public Supabase RPC schema exposes the following operations to the authenticated role. Each operation derives identity from `auth.uid()` without taking a user ID.

| Operation | Contract |
| --- | --- |
| `practice_catalog` | Returns the reference blueprint and counts per subtest and topic, or an empty state. |
| `practice_start` | Accepts a blueprint, subtest, optional topic, allowed length, and idempotency UUID. Locks eligible versions and atomically pins a complete set of distinct questions. |
| `practice_session` | Returns owner progress and at most one item. Feedback for that item requires a committed answer from its owner. |
| `practice_answer` | Locks the session, validates the choice against its pinned version, and stores the evaluated answer. The response carries no grading details. The next request loads feedback separately. An identical retry succeeds. The database rejects changes to the submitted choice. |
| `practice_finish` | Locks the same session, reconciles totals and topic breakdowns, and stores one immutable result. Repeated finalization succeeds without changing the result. |
| `practice_history` | Returns the authenticated owner’s recent sessions and stored summaries. |

All four tables live in `evalio_private`. RLS and revoked direct table grants require access through the scoped functions. The ordered session items use foreign keys to stable question identities and immutable versions, preserving passages, choices and results when editorial staff retire a version. Results and submitted answers have no update operation. Account deletion cascades through private practice records. Unanswered items expose no key or explanation, including when the session is finished.

## Content and verification

The EVAL-004 inventory contains 14 AI-assisted drafts, zero independently approved items, and zero published items. The 70-item independent editorial review criterion remains open. The six published items used for browser verification are synthetic and exist only in the disposable loopback fixture database. The optional fixture seeds these items through the normal independent review and publication workflow.

Run the pgTAP suite `supabase/tests/practice.test.sql` and the accounts, blueprint, and question-bank regression suites against an isolated Supabase database. For the browser suite, use the local Auth/PostgREST/Mailpit stack at `127.0.0.1:55321` with PostgreSQL at `127.0.0.1:55322`, and the synthetic staff and learner accounts documented in [Question bank](QUESTION_BANK.md). Build and serve the app with its local Supabase URL and publishable key, as described in [Accounts](ACCOUNTS.md).

1. With an empty published inventory, set `EVALIO_TEST_PRACTICE_EMPTY=1` and run `npm run test:e2e -- --project=chromium-desktop tests/e2e/practice.spec.ts`.
2. Apply `supabase/tests/fixtures/practice_seed.sql` via `psql` to the disposable loopback database. The script requires empty published inventory and local fixture identities.
3. Set `EVALIO_TEST_PRACTICE=1` instead of the empty flag and run the same Playwright command. The run covers answer feedback, refresh/resume, cross-user access, history, and concurrent answer/finalize operations. Screenshots at 360px and 1280px are written to Playwright’s test output directory.
