# EVAL-000 bootstrap

## Source layout

| Path | Responsibility |
|---|---|
| `src/app/` | Next.js App Router, root metadata, Indonesian document language and global styles |
| `src/app/(marketing)/` | Public homepage and its layout, scoped so later learner and admin routes can use their own shells |
| `src/components/` | Shared UI, beginning with the marketing shell |
| `src/styles/tokens.css` | Academic Ambition tokens and Tailwind theme mapping |
| `tests/unit/`, `tests/e2e/` | Component checks and production-build browser smoke test |
| `.github/workflows/ci.yml` | Lockfile install, lint, types, unit tests, build, Chromium smoke test and dependency audit |

The homepage is statically rendered. It uses system fonts and original CSS geometry. The navigation links point to content on the page.

## Future modules

Add feature-specific modules under `src/features/<domain>/` when a ticket introduces its first behavior. Use App Router route groups for the student dashboard, practice, diagnostic, tryouts, results, PTN explorer and planner, admin and account screens. Keep feature logic in its owning module and shared UI in `src/components/`. Protected mutations and HTTP entry points belong in Server Functions and Route Handlers. Use Zod at those server boundaries.

Supabase Auth and PostgreSQL client libraries are pinned. EVAL-002 will add the SSR cookie integration, server-side session and ownership checks, migrations and row-level security in an isolated development project. `.env.example` documents the future configuration. Keep secrets in the Cloud secret manager and server-side code.

Later assessment tickets should keep public question content, restricted answer keys and student attempts separate. Bind each attempt to immutable blueprint and question versions, enforce deadlines and ownership on the server, and record the deterministic scoring version. Store PTN facts with year and source. Subscriptions will use verified server-side entitlements. See [Architecture](ARCHITECTURE.md) for detailed contracts.

## Third-party review

The four included skills cover design, exam engineering, content QA and PTN data. EVAL-000 used `evalio-design`. The upstream documentation for the following resources was reviewed. Their installers and packages are deferred to the tickets that need them.

| Resource | License | Suggested use |
|---|---|---|
| [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill#installation) | MIT | Prioritize for EVAL-001 design exploration. The Codex CLI installer is invoked through `uipro init --ai codex`. Review the pinned CLI source, bundled templates and repository write paths before execution. The search scripts use Python 3. |
| [Vercel React Best Practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices) | MIT | Prioritize for Next.js component and data-fetching work. Install the selected skill from a reviewed revision after inspecting the installer. |
| [Vercel Web Design Guidelines](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines) | MIT | Use for a dedicated keyboard, mobile and accessibility review. Inspect its upstream guideline fetch before use. |
| [shadcn/ui](https://github.com/shadcn-ui/ui) | MIT | Add selected primitives when requirements call for them. Review the generated source and its dependencies. |
| [KaTeX](https://github.com/KaTeX/KaTeX) | MIT | Introduce with practice math rendering, with untrusted input validation and trust disabled. |
| [TanStack Table](https://github.com/TanStack/table) | MIT | Consider for PTN comparison once the table's filtering and sorting needs are established. |
