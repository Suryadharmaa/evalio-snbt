# Codex Cloud Development Runbook — Evalio Greenfield

**Target:** Codex Cloud, model selection **GPT-6.1 Sol, Medium reasoning** when available in your account/workspace. **No local development setup**.

## A. What is required vs optional?

| Item | Type | Install/connect | Need? |
|---|---|---|---|
| GitHub integration into Codex Cloud | Connection | Authorize new `evalio-snbt` repo only | **Required** |
| Node.js + npm | Cloud environment toolchain | Present in cloud image or configured in environment | **Required** |
| Next.js, TypeScript, React, Tailwind, Supabase, Zod | Application packages | Add via npm in cloud task / lockfile | **Required during scaffold** |
| Playwright, Vitest, Testing Library | Test packages | Add in cloud task, run in CI | **Required** |
| shadcn/ui, KaTeX | App components/math | Add in feature tasks | **Required before relevant features** |
| UI/UX Pro Max | External Agent Skill | Install in cloud task after reviewing source | Recommended for design discovery |
| Vercel React Best Practices | External Agent Skill | Install/read on relevant coding tasks | Recommended |
| Vercel Web Design Guidelines | External Agent Skill | Install/read for UI review | Recommended |
| Anthropic Frontend Design | External Agent Skill | Alternative visual exploration | Optional; review license |
| TanStack Table, Recharts | App packages | Add only if data complexity warrants it | Later |
| OpenAI `plugins` repository | Packaging reference | Read docs only | Not required to install |
| Arbitrary MCP servers | Connector/agent tool | Do **not** install by default | Not required |
| Supabase project | Managed database/auth | Create new isolated project outside old Evalio | Required before persistent integration |
| Vercel project | Production/preview hosting | Connect after prototype/security review | Required for deployment, not initial planning |
| Payment gateway | External service | Sandbox integration after closed beta | Later |

### Verified GitHub resources (2026-11-20)
- UI design: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- React and web UX: https://github.com/vercel-labs/agent-skills
- Optional design alternative: https://github.com/anthropics/skills/tree/main/skills/frontend-design
- Official plugin packaging reference: https://github.com/openai/plugins
- Components: https://github.com/shadcn-ui/ui
- Math: https://github.com/KaTeX/KaTeX
- PTN table: https://github.com/TanStack/table
- Charts: https://github.com/recharts/recharts
- Test: https://github.com/microsoft/playwright

**Install commands (cloud terminal only):**

```bash
# OPTIONAL design exploration. Inspect project README and scripts before running.
npx ui-ux-pro-max-cli init --ai codex

# OPTIONAL targeted skills (name is SKILL.md metadata, verify current CLI before use)
npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices
npx skills add vercel-labs/agent-skills --skill web-design-guidelines
```

These commands install **agent skills**, not app dependencies. Do not run all of them for every task. Only the GitHub connection and toolchain are mandatory at setup. Read third-party license and installation behavior before running any remote installer. **Do not** run Claude-specific `/plugin` marketplace commands in Codex. Existing custom Evalio skills in `.agents/skills/` require no additional download.

## B. New repository and cloud setup (founder action)

1. Create **new** GitHub repository (suggested `evalio-snbt`, private initially). Leave `Suryadharmaa/evalio` untouched and do not reuse its CI, database, secrets or deployment.
2. Add this starter package to the new repository root, including `docs/`, `.agents/skills/`, `AGENTS.md` and `scripts/`. There is deliberately no existing application code or lockfile.
3. Open Codex on **web or desktop** and connect the **new** GitHub repository. Create/publish a reusable Codex Cloud environment there. The published environment may then be used from supported web/desktop/mobile clients. See official https://help.openai.com/en/articles/20001545-using-codex-cloud.
4. Select a supported Linux image with Node.js 22 LTS (or another supported patched major), npm, Git, and a browser-capable test environment. Python3 is useful for UI/UX Pro Max tooling, but not needed for Evalio app runtime.
5. **Empty repo bootstrap:** first Codex task builds the Next.js scaffold. Do NOT set `npm ci` as environment setup command until a valid `package-lock.json` is created and committed.
6. After bootstrap, configure reusable setup command `bash scripts/codex-cloud-setup.sh` (installs lockfile-pinned dependencies when present). Access to npm registry/allowed hosts might require an environment network policy change. Restrict ongoing network access when not necessary.
7. Keep production keys away from Codex at planning/alpha. For authenticated integration tests use a separate development Supabase project and test-only credentials in the cloud secret manager. **Never** put service-role key into `NEXT_PUBLIC_*`, prompts, screenshots or GitHub commits.
8. In Codex project interface, choose **GPT-6.1 Sol → Medium** if selectable. If the model menu differs, select available model+effort and document the choice; no invented model IDs.
9. Require a PR per scoped task; CI runs `npm ci`, `lint`, `typecheck`, tests, build, dependency audits. Founder reviews and merges; never automatic production deployment.

## C. Bootstrap prompt (copy to Codex first cloud task)

```text
TASK EVAL-000 — GREENFIELD REPOSITORY BOOTSTRAP

You are the lead engineer working ONLY in the new Evalio SNBT repository via Codex Cloud.
Model preference: GPT-6.1 Sol, Medium when available.

Read AGENTS.md, docs/PRD.md sections 1–4, 9, 13–16, docs/ARCHITECTURE.md,
and docs/TASKS.md ticket EVAL-000. Do not inspect, fetch, clone, import,
or modify Suryadharmaa/evalio. This is a clean codebase.

Implement the smallest clean Next.js App Router + TypeScript + Tailwind
scaffold at the repository root, compatible with current patched versions.
Set up lint, typecheck, Vitest, Testing Library, Playwright, GitHub Actions
and app shell + one / page with placeholder brand identity.
No production Supabase keys, real user data, payments, unlicensed
images, 2027 rules assertions or AI API runtime.

Use npm lockfile, do not install unnecessary packages. Add .env.example
with placeholder variable names only. Keep docs and .agents/skills intact.

Run npm ci (after generating lockfile), lint, typecheck, unit tests, build,
E2E smoke test and npm audit. Show actual results and limitations.
If a check fails, fix or accurately document it. Open PR. Do not merge,
publish or deploy to production.

Return: file tree, commands + results, dependency versions, PR URL,
security/open questions and next ticket.
```

## D. Token-efficient agent workflow

- `AGENTS.md` is short and always relevant. Task-specific full docs loaded **on demand**, not at every session.
- Each task should be one PR, ideally <=10 touched app files unless a migration legitimately requires more.
- Search only needed paths; prefer `rg`/targeted files over printing complete repository.
- Use exactly one selected design skill in an implementation task; audit with web guidelines in a separate review.
- Use one acceptance checklist; do not rewrite unrelated code to “clean up” the project.
- In final summary, show changed files, tests (run/passed/failed), security concerns, unresolved assumptions, next ticket, no verbose terminal dump.
- A fresh cloud task may not inherit local state from a previous task; put durable decisions into docs/PR, git commits and project-specific skills.
- Escalate complex architecture/security questions narrowly; don't spend expensive thinking on repetitive UI adjustments.
- Do **not** ask Codex to generate hundreds of question items in one prompt; use editorial batches, independent review and checksums.
- Cost-saving is measured by PR quality and rework avoided, not guaranteed by the presence of a skill.

## E. Task completion report template

```text
Ticket:
Branch / PR:
Changed files:
Implemented behavior:
Checks actually run (pass/fail/skip):
Screenshots / a11y review if UI:
Security/privacy/content licensing notes:
Open risks:
Next smallest ticket:
```

## F. Release protections

No access to production merchant credentials, real student private records, or existing Evalio account data. No auto-merge or production deploy. The founder approves schema changes before running them on any persistent non-test DB, payments, public claims, terms/privacy disclosures and licensing.
