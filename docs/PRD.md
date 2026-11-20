# EVALIO — PRODUCT REQUIREMENTS DOCUMENT

**Version:** 1.0 (greenfield; for Codex Cloud)  
**Date:** 20 November 2026  
**Product:** Evalio — UTBK Preparation & PTN Planner  
**Launch cohort:** SNBT 2027, with exam configuration versioned by year  
**Status:** Draft — founder approval and legal/content review required  
**Implementation mode:** New GitHub repository, clean codebase, Codex Cloud (GPT-6.1 Sol / Medium if available)  
**Primary language:** Indonesian (Bahasa Indonesia), localized IDR and WIB; optional English only for relevant exam content.

> **MANDATORY GREENFIELD RULE:** This is a NEW product implementation. Never clone, import, modify, migrate from, or depend on `Suryadharmaa/evalio` or its legacy admissions engine. The old project remains untouched. A separate repository (suggested name `evalio-snbt`) will be connected to Codex Cloud. The name and brand may be reused by the owner, but no old application code, databases, deployments, credentials, tests, or CI should be carried over.

## 1. Executive summary

Evalio helps Indonesian high-school students study for UTBK-SNBT affordably and choose PTN/programs with credible, dated information. Rather than selling a static pile of questions, it connects **practice → explained results → recommended next practice → PTN exploration/shortlist**. It is independent, not affiliated with SNPMB or any PTN.

**Initial user discovery:** Founder informally asked ~20–23 classmates; they expressed a need for low-cost learning resources. This validates interest in the problem, **not** conversion, satisfaction, willingness to pay, representative market demand, or prices. Pilot interviews and payment testing remain necessary.

**Platform:** Mobile-first responsive web app (PWA-ready later), optimized for low-end Android devices and accessible on desktop for full tryouts. No native iOS/Android app for MVP.

**North-star measure (proposed):** Weekly Active Learners completing a useful learning activity: ≥10 questions + review of explanations, or a diagnostic/tryout, instead of superficial sign-ups.

## 2. Audience, jobs, and problems

**Primary:** Kelas 12 SMA/SMK/MA preparing for SNBT, using mobile-first internet access with limited budget. **Secondary:** Eligible graduates taking a gap year. **Content operations:** Reviewer/editor/admin.

Core jobs to be done:
- Find affordable, current, organized practice across all 7 subtests.
- Understand *why* an answer was wrong and *what* to study next.
- Simulate time pressure with an exam-like UI and reliable save/resume semantics.
- Compare PTN and programs by location, level, historical demand/capacity and verified information.
- Build a realistic *shortlist*, without deceptive passing-grade or “guaranteed admission” claims.
- Access quality materials even with unstable connections, without losing submitted answers.

## 3. Goals and non-goals

### P0 goals (MVP / first closed beta)
1. Free onboarding and short diagnostic covering all seven subtests.
2. Reviewed and original question bank with topic filters, passage support, math rendering and thorough explanations.
3. Practice sessions, bookmarks, wrong-answer review and a simple personalized plan based on transparent rules.
4. Timed tryout with persistent attempts, autosave feedback, flag/navigation, submit/review and deterministic raw metrics.
5. PTN Explorer and program shortlist with sources, year labels and explicit missing data.
6. Editor/reviewer/admin workflow for content, source, license and change tracking.
7. Accounts, per-user privacy, essential accessibility, security, monitoring and reliable tests.
8. Free/premium feature flags; **real checkout is P1 after closed beta**.

### Out of scope for P0
- AI tutor chat, AI grading, official UTBK score simulation, ranking with precise acceptance probabilities.
- Social feeds, private direct messages, public class leaderboard, ads in exam mode.
- Native apps, offline downloadable exam packs, video lessons, school-wide dashboards, automated scraping, SNBP grade prediction.
- Full machine-learning adaptive testing or psychometrically validated IRT scaled scores.
- Bulk “real UTBK questions” copied from PDFs, publishers, coaching competitors or leaked exam material.

## 4. Regulatory and content integrity

### Historical official exam baseline (2026, NOT a 2027 assertion)
Official SNPMB 2026 source documents specify seven subtests, 160 total questions and 195 total minutes. Model as **versioned config data**, not constants hardcoded into software. Subtest names and 2026 counts:

| Category | Subtest | Code | Questions (2026) |
|---|---|---|---:|
| TPS | Penalaran Umum (10 induktif, 10 deduktif, 10 kuantitatif) | PU | 30 |
| TPS | Pengetahuan dan Pemahaman Umum | PPU | 20 |
| TPS | Pemahaman Bacaan dan Menulis | PBM | 20 |
| TPS | Pengetahuan Kuantitatif | PK | 20 |
| Literasi | Literasi dalam Bahasa Indonesia | LBI | 30 |
| Literasi | Literasi dalam Bahasa Inggris | LBE | 20 |
| Literasi | Penalaran Matematika | PM | 20 |
| | **TOTAL** | | **160** |

- Current baseline source: https://snpmb.id/fr/ and https://snpmb.id/utbk-snbt/informasi-umum (2026).
- At PRD creation, 2027 official rules/timing had not been confirmed from the cited pages. `exam_blueprint_year=2026` is marked “historical reference”. 2027 displays “Menunggu ketentuan resmi” until validated.
- Maintain `rules_versions`: year, version, source URL, verified date, status draft/official/superseded; no public marking as official until manually approved.
- Historic number of applicants and available seats is **not** a score cutoff or chance-of-admission formula.

### Question licensing, editorial QA
- Use original authored questions or content with **explicit commercial redistribution rights**. No copyrighted paid PDFs, test prep materials, or private/leaked examination items.
- Record provenance and license for every item; if authored internally, tag `ORIGINAL` with author/reviewer; if licensed, retain agreement metadata.
- AI can draft original practice items **for human review**, never auto-publish. A reviewer independently solves the question, validates option uniqueness, rationale, subtest fit and math rendering.
- Display `Soal latihan orisinal Evalio` / licensing language accurately. No official certification or endorsement implied.
- Question corrections create a new version, preserve previous snapshots for historical attempts.

## 5. Product modules and detailed feature requirements

### F-01 — Public landing & discovery (P0)
**User story:** As a student, I see pricing, value, and a credible start path without signing in.
- Hero: “Belajar UTBK lebih terarah. Pilih PTN lebih terencana.”
- Show four concrete benefits: 7 subtests, transparent explanations, tryout + progress, source-backed PTN Explorer.
- CTA: “Coba Diagnostik Gratis” and secondary “Jelajahi PTN”.
- Pricing preview labeled tentative until validated; no fake testimonials or artificial scarcity.
- Explicit disclaimer not affiliated with SNPMB/PTN.
**Acceptance:** Mobile 360px and desktop, visible focus, 1 main CTA, good loading/empty states, no substantial CLS, accessible semantic sections.

### F-02 — Account and learner profile (P0)
**Story:** Start in guest mode, then save progress by signing in. Use Supabase Auth with email/password or passwordless (select one initially); avoid social login complexity until needed.
**Fields:** `auth_user_id`, nickname (optional), exam year, study goal, target programs (optional), learning availability (optional). Do not request school name, date of birth, phone, precise location, real name by default.
**Acceptance:** Protected session restoration, auth failures handled, consent/privacy copy, deletion/export requests supported, access checks server-side; safeguards for under-18 users and parental/guardian consent where required by applicable law.

### F-03 — Question bank & explanations (P0)
**Story:** Filter questions by subtest > topic > difficulty, solve them and review credible explanations.
**Item model:** Versioned question stem, optional passage/table/image/mathematics, type (single-choice initially), options, correct key held in a restricted server-only table, explanation, tags, estimated difficulty, provenance, review status, author, reviewer, reviewed_at, license, source year (if applicable).
**Acceptance:** Only reviewed/published questions shown. Safe markdown/math rendering. No answer keys in initial client payload. Invalid/retired questions excluded from new tests. Report-a-question action stored for editors.

### F-04 — Practice and diagnostic (P0)
**Story:** Finish a 21-item starter diagnostic (3 per subtest, indicative only) then practice mistakes by topic.
- Diagnostic deliberately uses small sample sizes: show “indikasi awal — bukan ukuran pasti kemampuan” and recommend exploring subtests before any rank.
- Practice: configurable sets of 5/10/20, answer check after commit, explanation and next action, bookmarks and history.
- Deterministic recommendation: choose frequently missed topics above minimum evidence threshold; with little evidence give balanced practice.
**Acceptance:** Correct/wrong/blank counts reconcile; duplicate submit never duplicates records; refresh preserves server-saved results; do not imply official scaled score.

### F-05 — Timed tryout engine (P0)
**Story:** Take a full/mock test with exam-like concentration and reliable autosave.
- Blueprint decides sections, order, time budgets, question counts; full 2026-reference simulation is 160 items/195 min *when published content is sufficient*.
- Support small mocks initially with appropriately labeled durations. One full mock requires 160 unique, reviewed items reserved appropriately; don't recycle diagnostic items into paid exams unintentionally.
- State machine `created -> in_progress -> submitted | expired | invalidated`. Server timestamp authoritative.
- Per-question answers saved via idempotent authenticated API with clear “Tersimpan” / “Belum tersimpan” indicators.
- Timer on client reflects server deadline; no dependence on client clock accuracy. Confirmation on manual submission; auto-finalize at expiry.
- Multi-tab conflicts, late answers, duplicate submissions and reconnect must have defined deterministic outcomes.
- Result: raw per-subtest correct/wrong/unanswered, attempt duration, question review and explanations only after allowed submission.
**Acceptance:** 2 concurrent submit requests yield 1 immutable result; expired attempts reject edits; unanswered counted correctly; tested browser refresh/reconnect; attempts private; key not exposed before finish.

### F-06 — Progress dashboard and study plan (P0)
**Story:** Know what to study today rather than drown in charts.
- Display completed questions, recent raw accuracy by topic (with sample size), next recommended three tasks, target PTN shortlist, study streak only if useful (no compulsive nudges).
- Suggested 15/30/45-minute sessions. No punitive messaging about rank/score.
- Never describe a practice score as official SNBT score.
**Acceptance:** Insights always explain evidence; zero activity gives friendly empty-state; heavy charts lazy-load only when needed.

### F-07 — PTN Explorer (P0)
**Story:** Search and filter programs with reliable sources.
- Institution, campus/location, fakultas (when official), program, degree (S1/D4/D3), route, historical seats/applicants where licensed and verified, current official URL, last_verified.
- Data ingestion: sourced manual CSV + admin verification for initial curated PTN subset; expand coverage based on data availability. **Do not promise full 145-PTN database on day one.**
- Unknown = null (“Data belum tersedia”), never 0; historical 2026 values labeled 2026.
- Ranking by historical demand/capacity labeled “indikator persaingan historis”, no fake passing grade, cutoff, or admission likelihood.
**Acceptance:** Filters work on mobile; sources open correctly; stale/missing facts distinguishable; no unsupported data claims.

### F-08 — PTN Choice Planner (P0)
**Story:** Save target programs and compare them, then see whether my planned combination follows verified official rules.
- Shortlist candidate programs with private notes and priority.
- Display historical comparisons by year and a source-quality indicator.
- Disable authoritative “valid SNBT 2027 combination” checks until confirmed 2027 official rule set is published and reviewed; use tentative guidance with clear warning if necessary.
**Acceptance:** Private data by user, program IDs stable, missing data handled, no predictions or admissions guarantee.

### F-09 — Editorial console (P0)
**Roles:** learner, editor, reviewer, admin (least privilege). Reviewer cannot approve own content if policy requires two-person review.
- Import JSON/CSV into `draft`, preview for typos/math, editorial checks, review, publish, retire.
- Maintain license/owner/source metadata, review notes, immutable version history and audit trail.
- Import rejects items without correct key, 2+ distinct options, valid rationale, subtest and license status.
**Acceptance:** Published item requires reviewer approval, answer key never exposed to learner via generic catalog API; admin endpoints role-protected; all changes auditable.

### F-10 — Monetization (P1 after first beta)
**Hypotheses (not validated):** Free tier + Student Monthly ~Rp19,000 / 30 days + UTBK Season Pass ~Rp69,000 until clearly disclosed season end. Test willingness to pay with real users before setting price.
- Paid: extra practice sets, full mock availability, richer analytics; **essential discovery and some quality free content remain free**.
- Provider options: one Indonesian payment gateway (e.g. Midtrans or Xendit), *sandbox first*, choose after verifying merchant eligibility, terms, fees and legal obligations.
- Server-only checkout; verified webhook signature, amount/currency match, idempotency and refund/revocation policy; never grant entitlement from client redirect alone.
- Seasonal purchase must disclose expiry and no hidden auto-renewal.
**Acceptance:** Duplicate webhook doesn't double-grant, canceled/failed orders don't unlock premium, user can view receipts and terms. No production payment before founder approves.

## 6. Screen inventory and primary navigation

| Route | Screen | One primary job | P0? |
|---|---|---|---|
| `/` | Landing | Understand value, start diagnostic | Yes |
| `/auth` | Sign-in | Save progress safely | Yes |
| `/onboarding` | Setup | Choose exam year / 1–2 goal programs | Yes |
| `/dashboard` | Home | Know what to study next | Yes |
| `/practice` | Question sets | Choose subtest/topic and practice | Yes |
| `/practice/[sessionId]` | Practice player | Answer and review with explanations | Yes |
| `/tryout` | Tryout library | Find available timed mocks | Yes |
| `/tryout/[attemptId]` | Exam runner | Work through timed test without distractions | Yes |
| `/results/[attemptId]` | Results | Inspect raw metrics & improve | Yes |
| `/ptn` | PTN Explorer | Discover and compare verified programs | Yes |
| `/planner` | PTN Planner | Shortlist and review program options | Yes |
| `/account` | Account | Access, privacy, delete/export, plan | Yes |
| `/pricing` | Membership | Understand free/premium packages | UI P0, payment P1 |
| `/admin` | Editorial CMS | Review and publish questions & PTN facts | Yes, internal |

Dashboard main navigation: **Belajar · Tryout · PTN · Rencana · Profil**. On mobile use bottom nav for primary destinations; editor routes never appear for learners.

## 7. End-to-end user flows

**First success:** Landing → Start Diagnostic → optional short onboarding → 21 questions → raw diagnostic findings with caveat → targeted 10-question practice → explanation + progress → optional account to keep history. Avoid forcing login before user experiences value unless persistence/security requires it.

**Tryout:** Select blueprint → confirm exam rules → server creates an attempt+item snapshot → timer starts → answer/navigation/autosave → submit/expire → immutable raw result → explanation and next steps.

**PTN planning:** Search institution → filter programs → inspect 2026 dated stats/source → save shortlist → compare → annotate desired options → rule checks only for verified year.

**Payments (P1):** Pricing → authenticated order → hosted gateway sandbox/production checkout → provider webhook → server validates order + entitlement → premium library unlocks → receipt; failed callback shows pending with retry/check status.

## 8. Data entities (conceptual schema)

Core: `profiles`, `consents`, `roles`, `user_settings`. Question content: `subtests`, `topics`, `passages`, `questions`, `question_versions`, `question_options`, `question_answer_keys` (**server restricted**), `question_reviews`, `question_reports`, `question_license_records`. Exam: `exam_blueprints`, `blueprint_sections`, `practice_sessions`, `practice_answers`, `exam_attempts`, `attempt_items` (version/snapshot), `attempt_answers`, `attempt_results`. PTN: `institutions`, `faculties`, `programs`, `program_stats_by_year`, `source_records`, `shortlists`, `shortlist_items`, `selection_rules_by_year`. Operations: `orders`, `payment_events`, `entitlements`, `audit_logs`.

Required keys: every user-scoped row has an authenticated owner; every externally supplied statistic has `source_url`, `source_year`, `verified_at`, `license_or_access_status`; every question has `version`, `review_status`, and `license_status`. Important foreign keys, check constraints, unique idempotency keys, and explicit deletion behavior; migrations must have safe rollback plans.

**Isolation:** Use Supabase PostgreSQL + Auth (new project). Supabase row-level security (RLS) on private tables. Use Next.js server-side route handlers / server actions for privileged logic. Direct public client should never be able to select answer keys or change role/entitlement.

## 9. Technical implementation (greenfield decisions)

- **Frontend/full-stack:** Next.js App Router + React + TypeScript, with server route handlers for protected endpoints. Select a currently supported, patched Next.js release at bootstrap. No historical pinned version from old Evalio.
- **UI:** Tailwind CSS + selected shadcn/ui accessible components (Radix-based where appropriate); Lucide icons; responsive mobile-first.
- **Data:** New Supabase project (Postgres, Auth, Storage if needed), SQL migrations checked in; use `@supabase/ssr` on server and `supabase-js`. Shared validation through Zod.
- **Math:** KaTeX with safe rendering and robust LaTeX/content validation; responsive formulas and text accessibility alternatives.
- **Charts/tables:** Recharts for results and TanStack Table for large PTN tables **only when needed**, not automatically added at bootstrap.
- **Tests:** Vitest + Testing Library (unit/component), Playwright (mobile & desktop E2E), GitHub Actions (lint/typecheck/test/build/security audit), optional PostgreSQL test fixture/isolated Supabase for integration.
- **Hosting:** Vercel (dynamic Next.js) + Supabase (DB/Auth) as the initial proposal. Do not deploy premium content via purely static GitHub Pages.
- **Observability:** Structured server logs without question answers/PII, error monitoring only after consent/privacy review; feature event instrumentation with minimal identifiers.
- **No mandatory runtime LLM:** recommendations and grading are deterministic; LLM generation belongs to reviewed editorial pipeline, not interactive product critical path.

## 10. Security, privacy and reliability requirements

- Use HTTPS, secure session cookies and server-side session validation; protect CSRF-sensitive operations and rate-limit auth/answer endpoints. Avoid secrets in `NEXT_PUBLIC_` or client bundles.
- Authorize every attempt, shortlist, order, admin action and premium content access. Add negative tests for cross-account access and role escalation.
- Server owns exam deadlines, key validation, result aggregation, pricing/entitlement, and payment processing. Use atomic/idempotent writes.
- Validate and sanitize rendered markdown; prevent XSS via raw HTML and reject unsafe SVG/code payloads. Review CSP policy and deploy-specific headers.
- For students under 18, apply appropriate data protection, transparent notices, parental/guardian consent when required, age-appropriate collection and deletion/export requests. Don't collect exact DOB, financial details, precise location or school by default.
- Protect access to learning content; don't expose the entire premium bank in JSON, build artifacts, or browser bundle. Note: perfect prevention of screenshots/copying is impossible; prioritize honest access controls.
- Backups/retention/incident response documented before paid launch. Staging database isolated from production; no prod service keys in Codex Cloud planning tasks.
- Mobile autosave includes explicit statuses; never pretend “saved” if network persistence fails.
- Performance target hypotheses: LCP <=2.5s on representative mid-range mobile on decent connection; exam interactions immediate; optimize after measurements rather than invent pass rates.

## 11. Content acquisition & editorial throughput

Pilot deliverable: **at least 70** original, reviewed questions (≥10 per subtest) for short practice/diagnostic and a functional test runner with *synthetic* mock data. Before a genuine 160-question full tryout, editorial team must approve at least 160 distinct eligible items allocated to that blueprint; before selling a substantial bank aim for **400–600** reviewed practice items, later **800–1,000** if quality capacity supports it. These are **aspirational planning targets**, not claims about existing inventory or promises of completion.

Importer must support passages, mathematical formulas, table/graph image asset license metadata, tags, 1 correct answer (initially), explanation, independent review, and one-click retire/replace with attempt-history safety.

## 12. Pricing, business tests and measurement

- Initial free/premium hypothesis: 0 IDR, 19,000 IDR / 30 days, 69,000 IDR season pass. No prices should be presented as finalized until user testing and cost modelling.
- Collect anonymized product signals: landing-to-diagnostic start, diagnostic completion, completed practice, weekly learners, first-week retention, question issue rate, reviewer time per question, actual conversion among willing test purchasers.
- Pilot from initial 20–23 school interviewees *only with permission*, plus learners from additional schools to avoid one-class selection bias.
- Target gates (proposed, not observed): >=70% unassisted diagnostic completion in moderated usability pilot, >=95% editorial QA pass across sampled published content, zero unresolved critical security and billing issues, 10 genuine voluntary paying customers outside the founding team before scaling marketing.
- Include gateway fees, infrastructure costs, reviewer costs, customer support, tax and chargebacks in unit economics before adjusting price.

## 13. Acceptance / release gates

**Gate G0 Design:** Brand tokens, navigable clickable prototype for landing/dashboard/practice/tryout/PTN; mobile 360px + desktop 1280px, keyboard accessible, no borrowed assets.
**Gate G1 Alpha:** 7 subtests represented, 70 reviewed original questions, diagnostic + practice usable, reliable auth, positive & negative tests.
**Gate G2 Tryout:** Timed mock works under refresh, reconnect, multi-tab and expiry; raw reports reproducible; no answer-key leak.
**Gate G3 PTN:** Verified dated sources, shortlist works, missing data not misrepresented, 2027 rules not asserted.
**Gate G4 Closed Beta:** Selected students complete core journey; editorial bug reports triaged; security/deletion/retention ready.
**Gate G5 Paid:** Gateway sandbox and reconciliation verified, service/legal approvals and merchant account in place, founder explicitly authorizes production payments.

**Definition of done for any engineering ticket:** small isolated diff; typed/validated interfaces; unit/E2E negative cases; docs updated; meaningful screenshots for visual changes; `lint`, `typecheck`, relevant tests and build actually run and reported; no production changes without signoff.

## 14. Dependencies and Codex Cloud skills/plugins

There are **four distinct things**, and Codex must not confuse them:
1. **Connection**: GitHub repo connection for Codex Cloud (necessary). Vercel/Supabase connectors optional; least-privilege credentials only when integration needs them.
2. **Agent Skills**: Markdown instruction folders loaded on demand. Adopt UI/UX Pro Max, Vercel React Best Practices, Vercel Web Design Guidelines; optionally Anthropic Frontend Design as alternative, *not concurrently* with UI/UX Pro Max for the same screen. Custom Evalio skills in `.agents/skills` are included in the starter package.
3. **npm libraries**: Next.js, React, Tailwind, Zod, Supabase, KaTeX, shadcn/ui, Playwright, Vitest; charts/table later.
4. **MCP servers / plugins**: None mandatory for MVP. Add only when concrete task requires them and permission/security is assessed; do not install miscellaneous MCP servers or allow broad permissions to production resources.

| GitHub resource | Category | When to use | Decision |
|---|---|---|---|
| https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | Design Agent Skill | Brand exploration, layout hierarchy and design tokens | Recommended, review third-party installer |
| https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices | Performance Agent Skill | Every React optimization / data fetching task | Recommended on demand |
| https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines | UI audit Agent Skill | Accessibility, forms, keyboard and mobile review | Recommended on demand |
| https://github.com/anthropics/skills/tree/main/skills/frontend-design | Alternative design Agent Skill | Optional concept exploration, license review | Optional, use instead of Pro Max, not both |
| https://github.com/openai/plugins | Reference for plugin/skill packaging | Custom skills and integrations | Read only; **not** a needed package |
| https://github.com/shadcn-ui/ui | Component library | Inputs, dialogs, dropdown, skeleton | Suggested for UI |
| https://github.com/KaTeX/KaTeX | JS math library | All subtests containing notation | P0 |
| https://github.com/TanStack/table | Headless table | PTN Explorer comparison sorting/filter | P1 |
| https://github.com/recharts/recharts | Chart library | Learning analytics visuals | P1 |
| https://github.com/microsoft/playwright | E2E testing | Device and security behavior | P0 |
| https://github.com/colinhacks/zod | Schema validation | API and import validation | P0 |

**Cloud installation:** See `docs/CODEX_CLOUD.md`. External install commands may evolve; inspect GitHub README/current skill name before running. Do not run a network install script as root with production credentials. Pin versions through lockfile after approval. External Agent Skills are task-time developer tools, not app runtime dependencies.

## 15. Design system intent

**Theme:** “Academic Ambition”: inviting and aspirational, but scholarly, legible and focused. Editorial typography, university/campus-inspired photography ONLY with rights, restrained violet, calm off-white backgrounds, charcoal text, progress green for verified completion. **Exam runner visually quiet**: no distracting animation or notification. See `docs/DESIGN.md` for tokens, layout and component specification. Don't imitate official PTN/SNPMB branding or reuse campus logos without permissions.

## 16. Development order and Codex task constraints

Execute one small PR at a time: `EVAL-000` new repo bootstrap → `001` design foundation → `002` auth/profiles → `003` content schema + admin reviewer → `004` practice → `005` diagnostic → `006` tryout engine → `007` results/dashboard → `008` PTN catalog → `009` planner → `010` security/closed beta → `011` sandbox payment → `012` production launch approval. Details and test gates in `docs/TASKS.md`.

Codex Cloud default **GPT-6.1 Sol Medium**, when selectable. If unavailable, select the closest supported option without inventing API model IDs. Keep `AGENTS.md` terse, read one task and related spec per session, limit file discovery, provide concise final report. Never merge PR or deploy production automatically.

## 17. Explicit open decisions for the founder

[Confirm] Greenfield GitHub repo name/visibility; [Confirm] public website domain; [Confirm] final logo/brand assets and legal ownership; [Confirm] initial number of questions an editorial reviewer can validate each week; [Confirm] PTN data usage/API rights; [Confirm] final pricing, expiry and payment provider; [Confirm] privacy/parental consent and legal policies; [Confirm] production hosting budget and support channel. None of these block a mock-data prototype.

## 18. Primary references (checked 2026-11-20)
- SNPMB 2026 exam framework: https://snpmb.id/fr/
- SNPMB 2026 general and program choice requirements: https://snpmb.id/utbk-snbt/informasi-umum
- Official timeline reference (2026, **not 2027**): https://www.snpmb.id/jadwal-penting
- Codex Cloud: https://help.openai.com/en/articles/20001545-using-codex-cloud
- Codex Skills and AGENTS.md design: https://developers.openai.com/plugins/concepts/skills
- Repository-specific agent skill links: see §14.
