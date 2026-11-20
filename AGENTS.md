# Evalio Codex Agent Instructions (new greenfield codebase)

- Work ONLY in the new Evalio UTBK-SNBT repository. Do not access/reuse/migrate code, secrets, history, or database from `Suryadharmaa/evalio` (legacy admissions).
- Product and baseline: read `docs/PRD.md` on demand; architecture `docs/ARCHITECTURE.md`; one ticket `docs/TASKS.md`; design `docs/DESIGN.md` for UI tasks.
- Cloud-first: coding/install/testing runs in Codex Cloud, not on the founder's device. Prefer GPT-6.1 Sol Medium if selectable.
- Implement **one bounded ticket per PR**; never merge, change production data, enable production payment or deploy automatically.
- Privacy/security: verify auth/role/ownership on server; answer keys separate from client; version exam data; 2026 SNBT reference is **not** official 2027.
- Questions must be original or explicitly licensed, reviewed before publication; never ingest copyrighted paid/leaked exam content.
- Never fabricate official scaled scores, passing grades, admission chances, applicant numbers, quota, official 2027 rules or campus endorsements.
- Frontend: mobile-first accessible Indonesian, quiet exam UX; read `docs/DESIGN.md`. Reuse app primitives; no unnecessary dependencies.
- Coding: typed schemas; validate on server; DB constraints/RLS; deterministic raw scoring; idempotent attempts/payment events; unit/E2E negative tests.
- Token discipline: targeted file reads, short diffs, single relevant skill, avoid whole-repo dumps and unrelated refactors.
- Final report: changed paths, commands actually run with pass/fail, unverified items, risks, and next ticket; do not claim work succeeded without tests.
