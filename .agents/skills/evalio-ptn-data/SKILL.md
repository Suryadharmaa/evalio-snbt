---
name: evalio-ptn-data
description: Use for Indonesian PTN/faculty/program catalog, source records, capacity/applicant history, choice planner and year-specific SNBT selection rule implementation.
---
# Evalio PTN Data

Read `docs/PRD.md` F-07/F-08 and `docs/ARCHITECTURE.md`. Source every claim from an authoritative primary page with source URL, applicable year, retrieved/verified timestamps, and reuse permission status. Prefer official SNPMB, institutional admissions and accredited authoritative sources.

Missing historical stats are `null`, never zero. 2026 data cannot be sold as live 2027. Historical selectivity is not a passing grade, official threshold or admission probability. Verify rights/terms before automating acquisition; no aggressive scraping, no copied third-party databases without license. Version program identifiers/names and SNBT choice rules per year. Shortlists must be private.

Test outdated data, missing data, renamed programs, source links, and authorization in one small PR.
