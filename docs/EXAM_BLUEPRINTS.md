# EVAL-003 exam blueprints

## SNBT 2026 historical reference

The seed publishes 2026 version 1 as a `historical_reference`. SNPMB’s 2026 framework and launch materials were checked on **2026-11-20**. The durations are stored in seconds, including the two 42½-minute sections. [SNPMB framework](https://snpmb.id/fr/) · [SNPMB 2026 launch materials](https://files.snpmb.id/web2026/Paparan%20Informasi%20SNPMB%202026%20untuk%20Peluncuran.pdf)

| Order | Code | Questions | Duration in seconds |
|---|---|---|---|
| 1 | PU | 30 | 1800 |
| 2 | PPU | 20 | 900 |
| 3 | PBM | 20 | 1500 |
| 4 | PK | 20 | 1200 |
| 5 | LBI | 30 | 2550 |
| 6 | LBE | 20 | 1200 |
| 7 | PM | 20 | 2550 |
| **Total** | | **160** | **11700 (195 minutes)** |

The 16 starter topics are Evalio editorial study tags. Their relationship to a subtest does not specify an official topic list or a question allocation. The seed contains a single historical year. A request for 2027 returns an explicit unavailable state pending an approved version for that year.

## Read-only API

| GET path | Response |
|---|---|
| `/api/v1/exam-blueprints` | Catalog, ordered by newest year and version. Optional `?year=YYYY`. |
| `/api/v1/exam-blueprints/{year}/{version}` | Blueprint, ordered subtests, and topic hierarchy. |
| `/api/v1/exam-blueprints/{year}/{version}/subtests` | Blueprint and ordered subtests. |
| `/api/v1/exam-blueprints/{year}/{version}/topics` | Blueprint and topic hierarchy, tagged `evalio_editorial`. |

Approved versions identify the year, version, classification, publication status, source URLs and verification dates, and the latest check in `source_verified_on`. Topics use `subtest_code`, `code`, and a nullable `parent_code`. Together with the blueprint version and subtest, the parent code identifies its parent. Duration values are seconds. A future draft can leave all section durations unspecified while recording the overall duration.

An empty catalog returns HTTP 200 with `state: "unavailable"` and `reason: "no_approved_blueprint"`. A missing exact version returns the same state with HTTP 404. Invalid paths and parameters return 400. Missing database configuration, connectivity problems, or malformed database data return 503. The API uses Supabase’s publishable key without a user session or account recovery secret.

## Database and publishing

`subtests` holds stable identities. `blueprint_sections` snapshots names, categories, order, counts and timing for each version. `topics` and `exam_rule_sources` are version-specific. Composite foreign keys keep topic parents within the same version and subtest. RLS lets anonymous and signed-in readers see previously approved snapshots and their associated records. Both roles have read privileges only. The restricted EVAL-002 role table remains in the private schema.

An authorized database operator creates a draft, records verified sources, and updates its status to published. The database validates section order, question counts, and any section timings. Draft child writes update the parent row so publishing and concurrent child changes serialize. Approved snapshots are immutable. To correct one, prepare a new draft and supersede the active version and publish the replacement in one transaction. Only one version per year can be published at once. Superseded snapshots remain readable for reproducibility.

Apply the schema migration and then the reference seed on an isolated Supabase project. The seed can be reapplied safely and preserves an already approved or superseded version. Run the SQL suites with `supabase test db --local`. For the opt-in Playwright API and account scenarios use the loopback configuration in [Student accounts](ACCOUNTS.md). Standard CI runs the credential-free browser scenarios.
