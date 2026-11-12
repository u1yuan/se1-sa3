# Reviewer hub

A no-backtracking exam reviewer that now hosts several **courses**, each with
one or more **assessments**. It is the first piece of a planned school
dashboard; there is still no database, sign-in, calendar sync, or upload.

Look: light-mode "Canvas in a terminal" — paper background, white panels,
1px rules, IBM Plex Mono, Canvas blue / green / red / orange accents.

## Courses and assessments

| Course | Assessment | Questions | Exam timer |
| --- | --- | --- | --- |
| **CS0025 · SoftEng1** | M6 and M7 `[M3-SUMMATIVE] [AI-Prohibited]` — Agile Methodologies, System Modeling, and Requirements Analysis | 20 | none |
| **DEVNET · DevNet Associate (v1.0)** | Module 5 | 18 | 60 min |
| | Module 6 | 15 | 60 min |
| | Formative Assessment 6 | 28 | 60 min |
| | All (every unique question; overlaps counted once) | 46 | 60 min |

Module 6's 15 questions all also appear in Formative Assessment 6. They are
stored **once** in `data/pools/devnet.json` and referenced by id from both
assessments, so their keys can't drift.

## Routes

- `/` — course list
- `/courses/[courseId]` — that course's assessments (shows "in progress" or
  "results ready" for attempts in this tab)
- `/courses/[courseId]/[assessmentId]` — start screen → player → results.
  The URL never changes per question.

## How the player works

- **Start screen:** pick **Prep** or **Exam**.
- **One question at a time**, fixed source order. No shuffle of questions or
  choices.
- **Explicit Submit.** Submit stays disabled until the answer is valid: one
  choice for single / true-false, at least one for select-all, non-empty text
  for fill-ins, a pick on **every** row for matching. There is no leave-blank.
- After Submit the answer is **locked** and **Next** is the only way forward.
  No Previous, no jumping; the question index in the sidebar is not clickable.
- **Enter** submits, then advances.
- **Prep mode:** right after Submit you see Correct / Incorrect, your answer,
  the correct answer(s), and the explanation when the question has one.
- **Exam mode:** after Submit you only see "Answer locked. Results appear after
  question N." No colours or right/wrong anywhere until the results screen.
- **Results (both modes):** score X/N and percentage, then a read-only review
  of every question with explanations. "Start a new attempt" clears the run.
  No "retake missed". The historical QuizFetch 17/20 score never appears.
- **Back button:** trapped during an attempt; you stay on the current question
  and see "Answers are locked." The header has no links mid-attempt — leaving
  needs **Discard attempt** (with a confirm), which returns to mode select.

### Question types

- `single`, `truefalse`, `multi` (exact-set grading), `fill` (trim, collapse
  spaces, uppercase, exact match against `acceptedAnswers`).
- `matching` (DevNet): every prompt has a dropdown of the question's options.
  Unused options are listed too, and one option may be picked on several rows
  (Module 5 Q10 has two "Not used" layers). **All-or-nothing**: every row must
  match to score the point.
- Exhibits are JPEG files in `public/exhibits/`; Module 5 Q13 has a monospace
  routing-table block.

### Exam timer (DevNet exam mode only)

- 60:00 countdown in the header. SoftEng1 exam mode and every prep run are
  untimed.
- The deadline is stored as an absolute `endsAt` timestamp in the attempt, so
  a refresh resumes with the time that is actually left.
- Under 5 minutes the clock gets a ▲ marker, and under 1 minute it turns red.
  Screen readers hear "Five minutes remaining" and "One minute remaining".
- At 00:00 the attempt finishes itself: if the current question has a valid
  pick that wasn't submitted yet, it is locked first. Every question without a
  locked answer scores as incorrect. Then results show, with "time used of
  60:00" and a note on how many went unanswered.

### Grading and state

- `src/lib/grade.ts` — pure grading (validation, matching, scoring).
- `src/lib/attempt.ts` — attempt state, timer (`expireIfDue`), and
  `sessionStorage` restore. Each assessment has its own key,
  `exam-reviewer:attempt:<bankId>`, so attempts in one tab don't overwrite
  each other. Restore rejects anything that breaks no-backtracking: a gap
  before the current question, answers after it, the wrong bank, or a timer
  that doesn't match the assessment.
- Only locked answers survive a refresh; an unsubmitted pick is lost. Closing
  the tab ends every attempt in it.

## Project layout

```
data/catalog.json                    courses + assessment metadata (titles, labels, counts, timer)
data/assessments/cs0025-m3-m6-m7.json SoftEng1 bank (questions inline, confirmed keys)
data/assessments/devnet-*.json       DevNet assessments: ordered question-id lists into the pool
data/pools/devnet.json               46 unique DevNet questions (source order)
public/exhibits/                     exhibit images extracted from the DevNet export
scripts/import-devnet.py             one-off importer for the DevNet HTML export
src/lib/                             types, grading, catalog resolution, attempt/timer
src/components/                      status bar, start screen, player, question index, results
src/app/                             App Router pages, fonts, styles
tests/                               node:test suites (grading, DevNet data, attempt/timer)
```

## Run locally

Requires Node.js 22.18 or newer (the tests use Node's built-in TypeScript type
stripping).

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests
npm run lint       # TypeScript type check
npm run build      # production build
npm start          # serve the production build
```

IBM Plex Mono is loaded with `next/font/google`, which downloads it at build
time and self-hosts it, so the running app makes no external requests. The
build machine needs internet access.

## Deployment

Not deployed yet. It is meant to go to Vercel later as a standard Next.js
project (all routes are statically generated; no environment variables or
secrets).

## Notes and caveats

- **Answer keys ship to the browser.** Grading runs client-side, so anyone can
  read the keys in developer tools. Fine for personal review; not a secure exam.
- **DevNet Module 5 Q12** (static NAT, inside global of Host A): the source
  marks `209.165.202.129` as correct, but its explanation lists Inside global
  as `209.165.202.128`. The marked answer `209.165.202.129` is kept, as the
  source did. A note sits on the question in `data/pools/devnet.json` (never
  shown to students).
- FA 6 Q15 and Q19 were merged with their Module 6 counterparts upstream; the
  FA 6 wording and key are used (environment → description; unused distractor
  `public`), so Module 6 shows the same wording.
- Choice text `192.168.1. 10` keeps the source's spacing.
- Course-page topic lines for the DevNet assessments ("Network Fundamentals",
  "Application Deployment and Security") are labels added for the hub, not
  from the source export.
- No analytics. To also turn off Next.js's CLI telemetry on your machine, run
  `npx next telemetry disable`.
