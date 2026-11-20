# Evalio Greenfield Architecture & Data Contracts

## 1. Context and deployment

```text
Browser (responsive Next.js PWA-ready)
  ├─ Public pages (SSR/SSG where appropriate)
  └─ Authenticated learner/admin UI
     ↓ [validated typed requests]
Next.js Route Handlers / Server Actions (Vercel)
  ├─ auth & authorization
  ├─ exam/practice service (server-owned keys, deadlines, result scoring)
  ├─ PTN catalog / source ingestion approvals
  └─ entitlement/payment service (later)
     ↓
Supabase Auth + Postgres (RLS and migrations)
  └─ server-restricted answer keys, owned attempts, program facts
```

**No Python/FastAPI for MVP.** No existing Evalio migrations/repositories may be reused. Use one full-stack TypeScript monorepo/app initially; split services only after measured demand.

## 2. Proposed directory layout

```text
src/
  app/(marketing)/page.tsx
  app/(auth)/auth/page.tsx
  app/(app)/dashboard/page.tsx
  app/(account)/(student)/practice/...
  app/(app)/tryout/...
  app/(app)/results/...
  app/(app)/ptn/...
  app/(app)/planner/...
  app/(admin)/admin/...
  app/api/v1/...
  components/ui/                 # selected shadcn primitives
  components/exam/               # focus-only exam UI
  components/ptn/
  lib/auth/
  lib/db/
  lib/exam/                     # scoring, time rules; pure functions
  lib/content/
  lib/ptn/
  lib/entitlements/
  lib/validation/               # Zod schemas
  styles/
supabase/migrations/
tests/unit/
tests/integration/
tests/e2e/
docs/
.agents/skills/
AGENTS.md
```

The paths are targets; Codex may adapt them for the chosen scaffold while documenting any deviation.

## 3. Core table contracts

`profiles(user_id PK -> auth.users, alias?, cohort_year, created_at, delete_requested_at?)`
`user_consents(id, user_id, policy_version, consent_type, granted_at, revoked_at)`
`user_roles(user_id, role)` (write-only via privileged admin service)
`subtests(code PK)`
`topics(blueprint_id, subtest_code, code, parent_code?, name)`
`exam_blueprints(id, exam_year, version, classification, total_questions, duration_seconds, status, published_at?)`
`blueprint_sections(blueprint_id, subtest_code, name, category, question_count, duration_seconds?, ordinal)`
`exam_rule_sources(blueprint_id, url, title, publisher, verified_on)`
[Question bank](QUESTION_BANK.md) tables live in `evalio_private`.

- `passages(id)` and `passage_versions(id, passage_id, version, body, render_payload, license_id)`
- `questions(id, created_at)` and `question_versions(id, question_id, version, revision, author_id, blueprint_id, subtest_code, topic_code, passage_version_id?, license_id, format, stem, render_payload, difficulty, tags, status)`
- `question_options(version_id, position, body)`
- `question_answer_keys(version_id, correct_position, explanation)`
- `question_reviews(version_id, revision, reviewer_id, decision, notes, reviewed_at)`
- `question_license_records(id, kind, owner_name, provenance, agreement_ref?, source_url?)`
- `question_audit_events(id, version_id, actor_id, event, revision, occurred_at)`
- `question_reports(version_id, reporter_id, reason, notes, reported_at)`

[Practice](PRACTICE.md) uses private `practice_sessions`, `practice_items`, `practice_answers`, and `practice_results` tables. Session items pin an ordered set of distinct question versions. Answers and calculated results are immutable.

`exam_attempts(id, user_id, blueprint_id, status, started_at, deadline_at, submitted_at?, idempotency_key, result_version)`
`attempt_items(id, attempt_id, question_version_id, item_order, choice_shuffle_seed)`
`attempt_answers(id, attempt_id, attempt_item_id, selected_choice_id?, updated_at, UNIQUE(attempt_item_id))`
`attempt_results(attempt_id PK, correct, incorrect, blank, per_subtest_json, scoring_version, computed_at)`
`institutions(id, official_id?, name, location, official_url?, source_record_id)`
`faculties(id, institution_id, name, official_id?)`
`programs(id, institution_id, faculty_id?, official_id?, name, degree, active_from?, active_until?)`
`program_stats_by_year(id, program_id, admission_year, route, capacity?, applicants?, source_record_id, verified_at?)`
`source_records(id, source_url, retrieved_at, valid_for_year, publication_date?, use_permission, reviewed_by?)`
`shortlists(id, user_id, exam_year, created_at)`
`shortlist_items(id, shortlist_id, program_id, priority, note)`
`selection_rules_by_year(id, year, version, official_source_url, approved_at, rule_json, status)`
`orders(id, user_id, provider_ref?, amount_idr, status, created_at, settled_at?)` (P1)
`payment_events(id, order_id, provider_event_id UNIQUE, payload_hash, received_at)` (P1)
`entitlements(id, user_id, product, starts_at, ends_at, status, order_id)` (P1)
`audit_logs(id, actor_id, action, entity, entity_id, at, metadata)` (privileged)

See [Exam blueprints](EXAM_BLUEPRINTS.md) for the implemented blueprint, source, and taxonomy contracts. Ensure DB-level foreign keys, unique constraints, `CHECK` on statuses and arithmetic invariants. Never use locally generated user IDs as proof of ownership. Every data migration checked and documented.

## 4. Server-side exam contracts

- [Practice](PRACTICE.md) uses authenticated Next.js Server Actions and owner-scoped Supabase operations for discovery, session creation, answer submission, post-commit feedback, and results.
- `POST /api/v1/tryout`: server creates immutable attempt snapshot based on published blueprint and available, distinct item versions.
- `PATCH /api/v1/tryout/{id}/answers/{itemId}`: owner-only, idempotent upsert, attempts `in_progress` only and deadline enforced.
- `POST /api/v1/tryout/{id}/submit`: transaction; exactly once finalization; returns existing result on duplicate retries.
- `GET /api/v1/results/{id}`: owner-only, after submitted/expired; raw scoring and explanations.
- `GET /api/v1/ptn?...`: filtered publicly readable verified facts with source metadata and paginated results.
- `POST /api/v1/shortlists`: authenticated and owner-scoped.
- `/api/v1/admin/...`: gated editor/reviewer/admin, audit required.

JSON schemas validated on server with Zod. Form inputs validated client-side for usability *and* server-side for security. Rate-limit answer spam and export endpoints.

## 5. Scoring and recommendation

MVP raw correctness only: `correct + incorrect + blank = totalItems`. Option shuffle normalization must not alter key mapping. Keep `scoring_version` in every result, store question version and blueprint version at attempt start. Do **not** compute “official SNBT 2027 score,” simulated IRT, admission percentages, or passing grades.

Recommendation: weighted recent topic-error share only after >=5 questions in a topic; otherwise “data belum cukup” plus balanced exploration. These thresholds are proposed and can be tested; do not label scientifically validated. Explain every recommendation with sample size.

## 6. State and testing invariants

- Attempts only transition `created → in_progress → submitted/expired/invalidated`, no reopening finished exams.
- Server `deadline_at` controls clock; multiple tabs must not create extra attempts or modify closed attempt.
- Protect answer keys in a separate table and privileged query path. Never return explanation before allowed review.
- RLS and API both reject cross-user reads/writes; editor role only covers assigned actions.
- Stored license/source dates and missing-data semantics `null != 0`.
- Payment webhook replay always idempotent, provider signature verified and amount checked (P1).
- Test mobile refresh, network drop, duplicate submit, back-button, account deletion, expired session, admin escalation attempts.

## 7. Cloud environment distinction

Codex Cloud is a **development runtime** only. Production is a separate Vercel/Supabase deployment requiring manual connection, cost approval, secrets review and release signoff. The user is not required to install Node/Python on their laptop. See `docs/CODEX_CLOUD.md`.
