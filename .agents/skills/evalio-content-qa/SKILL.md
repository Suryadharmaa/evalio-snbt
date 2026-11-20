---
name: evalio-content-qa
description: Use for authoring and validating original UTBK practice questions, editorial review, answer explanations, content versioning, licensing and publishing workflows.
---
# Evalio Editorial QA

Read `docs/PRD.md` §4/§11 and relevant item schema. Each item must have source/ownership/license status, a unique unambiguous answer, independently verified solution, tagged subtest/topic, rendering QA and review metadata. AI suggestions may be used only as drafts; reviewer signs off before publish. Never import leaked exam items, purchased competitors' material, copyrighted PDFs without rights or unlicensed question collections.

Use `draft → in_review → published → retired` status; author cannot silently publish unreviewed work. Corrections produce a new version; preserve prior snapshots for submitted attempts. Flag ambiguous problems, insufficient data, unsafe asset provenance and incorrect mathematics. Use small batches of 10–25 for QA; no mass auto-publish.

Deliver audit summary: reviewed count, rejected count and reasons, remaining unknown rights, tests and next item batch.
