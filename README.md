# Evalio SNBT

Evalio is an independent Indonesian web app for UTBK-SNBT preparation and PTN planning. EVAL-000 provides the Cloud development foundation and a responsive Indonesian homepage.

## Run in Codex Cloud

Use Node.js 24 LTS (24.15 or newer in that major) and its bundled npm. The homepage runs without environment variables or a Supabase instance.

```bash
bash scripts/codex-cloud-setup.sh
npm run dev -- --hostname 0.0.0.0
```

Open the Cloud preview on port 3000, or use the localhost URL from the Cloud environment. Run the review checks with:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm audit
```

Playwright runs the production build on port 3100 and checks the homepage on desktop and mobile Chromium. CI also installs the required Linux browser packages.

## Project documentation

- [PRD](docs/PRD.md) defines the product and its release gates.
- [Architecture](docs/ARCHITECTURE.md) defines the planned data, security and assessment contracts.
- [Bootstrap notes](docs/BOOTSTRAP.md) describe the implemented structure and third-party skill review.
- [Design](docs/DESIGN.md) defines the Academic Ambition identity.
- [Task board](docs/TASKS.md) and [Cloud runbook](docs/CODEX_CLOUD.md) describe ticket ownership and environment setup.
- [Agent instructions](AGENTS.md) and [.agents/skills/](.agents/skills/) contain repository-specific working guidance.

Official SNBT 2027 details require source verification before publication. Question materials require provenance and independent review. Production deployment and payments require founder approval.
