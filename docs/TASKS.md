# Evalio Greenfield — Implementation Task Board

Each ticket: one bounded Codex Cloud task and GitHub PR. “Done” means measured acceptance criteria, not just code generated.

| ID | Phase | Deliverable | Pass conditions | Dependencies |
|---|---|---|---|---|
| EVAL-000 | 0 | New Next.js/TS/Tailwind repo, lockfile, Vitest, Playwright, GitHub Actions, .env.example | `lint/typecheck/unit/e2e/build/audit` run; one functional homepage; old repo untouched | Docs only |
| EVAL-001 | 1 | Design tokens, shell, nav, mobile/desktop marketing landing | 360px +1280px, focus, responsive, no unlicensed art | 000 |
| EVAL-002 | 1 | Supabase Auth & minimal student profile; privacy UI, role model | user-owned data; sign-in/out; test session/role denial; staging only | 000 |
| EVAL-003 | 2 | Versioned 2026 reference blueprints, 7-subtest/topic schema | source dates, no fake 2027 official data, migration and tests | 002 |
| EVAL-004 | 2 | Question versions, passages, restricted keys, editorial review CMS | reviewer approval, license fields, role/RLS tests, 70 original QA sample items | 003 |
| EVAL-005 | 2 | Practice question UI/API, KaTeX and explanations | key hidden pre-answer; safe rendering; 5/10/20 sets; owner tests | 004,001 |
| EVAL-006 | 3 | Short diagnostic (3 questions/subtest) and weak-topic rules | indicative warnings, raw scoring, recommendations with sample-size caveat | 005 |
| EVAL-007 | 3 | Timed tryout engine states, server timer, randomized snapshot | multi-tab, duplicate, expiry, reconnect, integrity tests; test data allowed | 004 |
| EVAL-008 | 3 | Distraction-free exam UI, autosave indicators, results | responsive + keyboard accessible; no lost saved answers, raw results only | 007,001 |
| EVAL-009 | 3 | Student dashboard and progressive analytics | evidence-linked insight, no official score/prediction, empty state | 006,008 |
| EVAL-010 | 4 | PTN program/source/year schema, initial curated verified dataset | source/license reviewed; missing != 0; no invented passing grade | 002 |
| EVAL-011 | 4 | PTN Explorer and shortlist planner | mobile filters; private shortlist; historical years; rules gated by verification | 010,001 |
| EVAL-012 | 5 | Closed beta hardening: content QA, auth/RLS, retries, metrics, backup | 0 critical findings; editorial QA, deletion/export, positive and negative tests | 009,011 |
| EVAL-013 | 5 | Premium schema and **sandbox** checkout + webhook idempotency | amount/signature verification, refunds/failed states, safe entitlement; no prod payment | 012 |
| EVAL-014 | 6 | Founder launch review, protected production deployment | approved content/licenses/rules/privacy, full CI, rollback plan | 013 |

## PR convention

PR title: `feat(EVAL-005): add authenticated practice sessions`.

Every PR description must include:
- Goal, scope and **out-of-scope**; tests and screenshots where relevant.
- Databases and APIs affected, privacy/licensing impact, migration plan (if any).
- Actual commands/outputs (do not claim tests passed without running).
- Rollback approach and one recommended next ticket.

## First sprint (no arbitrary deadlines)

**Sprint 0:** EVAL-000 bootstrap + EVAL-001 design shell. **Sprint 1:** EVAL-002 auth + EVAL-003 versioned rules. **Sprint 2:** EVAL-004 licensed question content + EVAL-005 practice. **Sprint 3:** EVAL-006 diagnostic + EVAL-007/008 tryout. **Sprint 4:** EVAL-009–011 dashboard/PTN. **Sprint 5:** user beta, then payments. No public launch dates until engineering/content velocity is known.

## Non-technical founder gates

- Validate willingness to pay beyond the initial 20–23 interested school peers.
- Secure editorial capacity and question rights.
- Approve use of official data / public source wording and SNBT 2027 updates.
- Review data privacy/guardian consent/legal wording.
- Approve merchant agreement, payment pricing and deployment budget.
