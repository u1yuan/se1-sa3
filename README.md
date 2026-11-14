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
| **CS0075 · Machine Learning and Algorithms** | SA3 Mock Set A — Decision Trees, Random Forests, Gradient Boosting, and SVM | 60 | 60 min |
| | SA3 Mock Set B (same questions, separate attempt) | 60 | 60 min |
| | SA 3 Concepts & Hyperparameters | 50 | 60 min |

Module 6's 15 questions all also appear in Formative Assessment 6. They are
stored **once** in `data/pools/devnet.json` and referenced by id from both
assessments, so their keys can't drift.

CS0075's SA3 Mock Set A and SA3 Mock Set B each import all 60 questions from `cs0075-sa3-reviewer.html`:
24 true/false, 21 single choice, and 15 fill-ins. Question IDs, question and
choice order, answer keys, accepted answers, and explanations follow that source.
References are appended to explanations, and ten code excerpts use the existing
monospace code blocks. Fill-ins ignore case and surrounding/repeated whitespace;
spelling, underscores, hyphens, and punctuation still matter. The hub uses fixed
order and locked answers, untimed Prep, and a 60-minute Exam, overriding the
standalone reviewer's shuffle settings. Standalone saved progress is not imported.
The identical Set B is intentional. Set A keeps its original route
`/courses/cs0075/sa-3-mock-exam/` and bank ID `cs0075-sa3-mock-exam`, so
existing hub attempts still restore. Set B uses `/courses/cs0075/sa3-mock-set-b/`
and bank ID `cs0075-sa3-mock-set-b` with independent attempt storage.

## SA 3 Concepts & Hyperparameters

This native CS0075 assessment is available at
`/courses/cs0075/sa3-concepts-hyperparameters/` with bank ID
`cs0075-sa3-concepts-hyperparameters`. It uses the same RevHub start screen,
player, feedback, results, grading, countdown, and independent session storage
as every other assessment: fixed source order, locked submitted answers,
no backtracking, untimed Prep, and a 60-minute Exam.

Its 50 questions comprise 20 single choice, 10 true/false, and 20 blanks
(12 hyperparameter identifiers and 8 conceptual identification items).
All wording, choices, accepted answers, explanations, PDF/notebook references,
and six code excerpts are preserved from the source. Original source exports
and the authoring record remain unchanged under `public/reviewers/` as archival
references. Progress from the original standalone HTML player is not migrated.

To reproduce or verify the native import:

```bash
python scripts/import-cs0075.py public/reviewers/cs0075-sa3-concepts-hyperparameters-reviewer.html --bank-id cs0075-sa3-concepts-hyperparameters
python scripts/import-cs0075.py public/reviewers/cs0075-sa3-concepts-hyperparameters-reviewer.html --bank-id cs0075-sa3-concepts-hyperparameters --check
```

## Reviewer import convention

Every reviewer import belongs in the native catalog, assessment data loader,
and shared `/courses/[courseId]/[assessmentId]/` flow. Reuse RevHub's components,
grading, timer, and per-bank attempt storage. Convert source HTML into question
data and preserve its content and keys; source player behavior does not replace
RevHub's fixed-order, no-backtracking rules. Do not present imports as standalone
HTML players, embedded pages, or special course cards. This convention is also
recorded in `AGENTS.md` for future agents.

## Routes

- `/` — course list
- `/courses/[courseId]/` — Mock exams (default) and Study guides tabs, with
  counts. Assessment cards show "in progress" or "results ready" for attempts
  in this browser tab. `?tab=study-guides` selects the guide library.
- `/courses/[courseId]/study-guides/?guide=<guideId>` — viewport-filling guide
  reader, with a collapsed course sidebar and a mobile modal drawer.
- `/courses/[courseId]/[assessmentId]` — start screen → player → results.
  The URL never changes per question.

## Course study guides

CS0075 includes **Study Guide 1: Trees, Ensembles and SVM**, with eight algorithm
lessons, 39 walkthrough steps and 40 ungraded recall prompts. Open
`/courses/cs0075/study-guides/?guide=study-guide-1` (beneath `/revhub` on Pages).
Its standalone artifact is `public/study-guides/cs0075/study-guide-1.html`.
See [release notes](CHANGELOG.md) for the corrections and validation summary.

Courses with an empty `studyGuides` array display “No study guides yet.”
Guides are reading material and interactive visualizations;
question-based reviewers still follow the **Reviewer import convention** above.

For the CS0075 guide's independent arithmetic and full interaction checks:

```bash
python scripts/verify-cs0075-guide-math.py
# With playwright-core + Chrome/Edge available, against the built /revhub site:
BASE_URL=http://127.0.0.1:3101/revhub node scripts/verify-cs0075-study-guide.cjs
```

To register a guide:

1. Save the original, unchanged HTML at
   `public/study-guides/<courseId>/<guideId>.html`.
2. Add metadata to that course’s `studyGuides` array in `data/catalog.json`:

   ```json
   {
     "id": "concept-map",
     "title": "Concept map",
     "description": "Explore the relationships between course concepts.",
     "artifactPath": "/study-guides/cs0025/concept-map.html"
   }
   ```

3. Run `npm run validate:study-guides`, `npm test`, `npm run lint`, and
   `npm run build`. The build also runs guide validation automatically.
4. Review `/courses/cs0025/?tab=study-guides` and
   `/courses/cs0025/study-guides/?guide=concept-map` in the exported site.
   Publish `out/` through the existing build/deployment process. For a mounted
   site, set `NEXT_PUBLIC_BASE_PATH` at build time, as for assessment routes.
   No additional registration in TypeScript is required.

IDs must be lowercase alphanumeric slugs separated by hyphens and unique within
the course. Titles and descriptions must be nonempty strings. The artifact path
must match the course and guide IDs exactly, without query strings, fragments,
external URLs, or traversal. Validation checks the file exists inside
`public/study-guides`. The assessment route ID `study-guides` is reserved.
Empty libraries are valid and their reader routes are still statically generated.

Artifacts must be complete, self-contained HTML documents: include a UTF-8
charset and viewport meta tag, inline CSS and JavaScript, and embed images/fonts
as data URLs. SVG and canvas work. Do not depend on external services, CDNs,
neighboring files, modules loaded over the network, browser storage, or access
to RevHub. Check these requirements when importing; metadata validation does
not analyze every script or resource reference inside an artifact.

The reader fetches only the selected artifact (with the deployment base path),
then presents its original HTML as `srcDoc` in a titled iframe sandboxed with
`allow-scripts` only. The sandbox gives it an opaque origin, isolating its
document and storage from RevHub; it cannot navigate the top page or open
popups. Styles and scrolling remain inside the artifact. Switching or reopening
a guide starts it afresh. There is no guide progress, annotation, or persistence
feature. Loading failures offer Retry; missing or unknown selections never load
an artifact. Leaving the reader returns to the course’s Study guides tab.

### Browser verification

The new walkthrough uses the same optional `playwright-core` dependency and
Chrome/Edge detection as `scripts/e2e-walkthrough.cjs`. `BASE_URL` must include
the deployment prefix. For example, in PowerShell:

```powershell
$env:NEXT_PUBLIC_BASE_PATH = '/revhub'
npm run build
node scripts/serve-static-test.mjs out 3100 /revhub
# In a second terminal:
$env:BASE_URL = 'http://127.0.0.1:3100/revhub'
node scripts/e2e-study-guides.cjs
$env:SCREENSHOTS_DIR = 'tmp/assessment-walkthrough'
node scripts/e2e-walkthrough.cjs
```

Populated tests use an isolated copy so no sample guide is published. The helper
prints a new directory under ignored `tmp/`, copies the current source, links
the installed dependencies, and registers test-only HTML from
`tests/fixtures/study-guides/interactive.html` in that copy. On Windows it uses
a directory junction; on other systems it uses a symlink.

```powershell
$fixture = node scripts/prepare-study-guide-fixture.mjs
$env:NEXT_PUBLIC_BASE_PATH = '/revhub'
npm --prefix $fixture run build
node scripts/serve-static-test.mjs "$fixture/out" 3101 /revhub
# In a second terminal, set ROOT to the exact directory printed above:
$env:ROOT = '<absolute fixture directory>'
$env:BASE_URL = 'http://127.0.0.1:3101/revhub'
node scripts/e2e-study-guides.cjs
```

This checks tab counts and keyboard controls, direct links, refresh/history,
course-scoped sidebar selection, mobile modal focus/dismissal, iframe scripts,
SVG/canvas/images, scrolling, origin/storage isolation, loading and retryable
failures, and unknown selections. Screenshots go to
`tmp/study-guide-screenshots` unless `SCREENSHOTS_DIR` is set. Repeat builds with
`NEXT_PUBLIC_BASE_PATH` unset to verify root hosting. Fixture directories and
screenshots are disposable and are never included in `out/`.

## How the player works

- **Start screen:** select **Prep** or **Exam**, then press Start.
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
  Filter the read-only review by All, Incorrect, or Correct. No "retake missed". The historical QuizFetch 17/20 score never appears.
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

### Exam timer (DevNet and CS0075 exam modes)

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
data/assessments/cs0075-sa3-mock-exam.json Machine Learning SA3 Set A bank (60 questions inline)
data/assessments/cs0075-sa3-mock-set-b.json Machine Learning SA3 Set B bank (60 questions inline)
data/assessments/cs0075-sa3-concepts-hyperparameters.json Native Concepts & Hyperparameters bank (50 questions)
data/assessments/devnet-*.json       DevNet assessments: ordered question-id lists into the pool
data/pools/devnet.json               46 unique DevNet questions (source order)
public/exhibits/                     exhibit images extracted from the DevNet export
scripts/import-devnet.py             one-off importer for the DevNet HTML export
scripts/import-cs0075.py             SA 3 reviewer HTML importer; --check verifies source fidelity
src/lib/                             types, grading, catalog resolution, attempt/timer
src/components/                      status bar, start screen, player, question index, results
src/app/                             App Router pages, fonts, styles
tests/                               node:test suites (grading, catalog and assessment data, attempt/timer)
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
npx serve out      # preview the static production build
```

IBM Plex Mono is loaded with `next/font/google`, which downloads it at build
time and self-hosts it, so the running app makes no external requests. The
build machine needs internet access.

## Deployment

The existing GitHub Pages workflow deploys `out/` on pushes to `main` or manual dispatch. The repository remote is `https://github.com/u1yuan/revhub.git`, and Pages source must be GitHub Actions. The live site is https://u1yuan.github.io/revhub/. The workflow supplies `NEXT_PUBLIC_BASE_PATH` from the Pages configuration; local builds default to `/`. After renaming the repository, run the workflow again so links and asset URLs are rebuilt with the new repository path. All course and assessment routes are statically generated. `npm start` uses Next server mode and is not supported for this static export.

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

## Consolidated repository

This checkout combines the course hub and original reviewer histories. The original folder remains unchanged. Current attempts use per-assessment version-2 session storage; legacy version-1 attempts reset. Browser Back remains restricted during an active attempt.

Browser verification: build the app, serve `out/` on port 3100, then run `node scripts/e2e-walkthrough.cjs`. Set `BASE_URL` to test a mounted repository path and `CHROME_PATH` if the browser is outside its usual Windows location (Chrome and Edge are detected automatically). Screenshots can be redirected with `SCREENSHOTS_DIR`. The walkthrough requires `playwright-core` (`npm install --no-save --package-lock=false playwright-core`).

The postbuild script normalizes nested Windows RSC segment filenames to the dotted names requested by browsers. It leaves already-correct exports unchanged.

To reproduce or verify the Machine Learning import, run
`python scripts/import-cs0075.py path/to/cs0075-sa3-reviewer.html` (writes the bank)
or add `--check` (compares all converted questions without writing).
The default bank ID remains `cs0075-sa3-mock-exam` (Set A). To import Set B:

```bash
python scripts/import-cs0075.py path/to/cs0075-sa3-reviewer.html --bank-id cs0075-sa3-mock-set-b
python scripts/import-cs0075.py path/to/cs0075-sa3-reviewer.html --bank-id cs0075-sa3-mock-set-b --check
```

`--bank-id` controls both the stored ID and `data/assessments/<bank-id>.json`
destination; it must be a lowercase alphanumeric slug separated by hyphens.
The browser walkthrough also checks all three CS0075 routes, independent saved
attempts, Prep feedback and source references, locked answers and refresh restoration, Exam countdown and hidden
feedback, results, and code excerpts at desktop and 360px widths.
