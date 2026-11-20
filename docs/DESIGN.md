# Evalio Design Specification — Academic Ambition

**Purpose:** A clean, inspiring Indonesian PTN environment, not a generic AI dashboard. The user should feel focused while solving questions and optimistic while exploring future universities.

## 1. Brand / visual language

Direction: **Academic Ambition**. Combining admissions editorial identity with a serious exam workspace. Student-friendly, measured, accessible, calm. Distinct Evalio brand; **not** a copy of a PTN, SNPMB, Ruangguru, or other EdTech visual identity.

Suggested starting tokens (proposal; validate with prototype):

```css
:root {
  --ev-ink: #24173f;
  --ev-primary: #6252e8;
  --ev-primary-hover: #503dd5;
  --ev-bg: #faf9fd;
  --ev-surface: #ffffff;
  --ev-surface-lavender: #f3f0ff;
  --ev-border: #dfdaed;
  --ev-text-muted: #665d75;
  --ev-success: #167a51;
  --ev-warning: #a56916;
  --ev-danger: #b33747;
  --ev-radius: 12px;
}
```

Typography: open-licensed or system sans for body; tasteful contrasting display serif **only on marketing**. Exam player uses an exceptionally legible sans with 16px+ body and ample line-height. No downloadable font asset is required in starter.

Layout: mobile 360px–430px and desktop 1280px/1440px, generous but disciplined whitespace; content max-width 1120–1200px marketing; exam passage + answers in readable columns with distinct mobile fallback.

## 2. Page templates

- **Landing:** discreet editorial hero, academic cue/photography, CTA diagnostic, demo snippet, honest features and pricing. If photography, use licensed image with credit and avoid misleading official affiliation.
- **Dashboard:** next learning action in first viewport, 7 subtests summary, low-distraction program shortlist, recent learning history.
- **Practice:** focus pane; topic, progress bar, stem, optional passage and KaTeX, large choices, explicit submit; explanation only after submission.
- **Full tryout:** top progress/timer/save state; question palette; mark review; accessible navigation; submit confirmation; no promotion, videos, confetti, countdown pressure effects or unrelated UI.
- **Results:** raw correct/wrong/blank counts, explainable weakness areas, transparent sample size and suggested next set.
- **PTN Explorer:** image (where licensed) + institution/program identity, dated facts, filters, source freshness, responsive table/cards.
- **Planner:** comparison of chosen programs with source/year, user notes and clear policy uncertainty; non-judgmental wording.
- **Editor console:** compact editorial queue, review states, preview of math, license fields and audit history.

## 3. Components to prioritize

Button, input, select, dialog, tabs, drawer, toast, skeleton, empty/error states, top navigation and mobile bottom bar. Then custom `QuestionPlayer`, `PassagePane`, `MathText`, `AnswerChoice`, `ExamTimer`, `QuestionPalette`, `AutosaveStatus`, `SourceYear`, `ProgramCard`, `ComparisonTable`, `ScoreSummary`, `ContentReviewBadge`.

Accessibility: WCAG 2.2 AA as target, meaningful HTML, keyboard access, 44x44px-ish comfortable targets, focus states, screen reader labels, visible errors and recovery steps, no meaning by color alone. Test at 360px and 1280px plus keyboard-only.

## 4. Asset policy

No scraping official logos/photos as if they were free assets. Use appropriately licensed photos with credits; for alpha use custom geometric/typographic compositions to avoid licensing blockers. Icons from Lucide; verify licenses of every external asset before publication. Avoid fabricated “official partner” badges.

## 5. Workflow for design skills

1. Optionally activate `ui-ux-pro-max` in early visual exploration; read this file first to keep brand grounded.
2. Create one *consistent* design-system proposal, then freeze tokens in `src/styles/tokens.css` or tailwind configuration.
3. Implement one page and inspect Playwright screenshots at phone/desktop widths.
4. Review with Vercel `web-design-guidelines` and manual keyboard/assistive checks.
5. Use `frontend-design` only **as an alternative concept exploration tool**, not mixed into the same task by default.
6. Never require the design skill to generate hundreds of assets or redesign all pages in one task.
