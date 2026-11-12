# Exam Reviewer

A no-backtracking exam reviewer for **SoftEng1 — CS0025 · "M6 and M7"**
(`[M3-SUMMATIVE] [AI-Prohibited]`, 20 questions). It is the first piece of a
planned school dashboard; for now it is only the reviewer player and this one
question bank. There is no calendar sync, sign-in, file upload, or database yet.

## How it works

- **Start screen:** choose **Prep mode** or **Exam mode**.
- **One question at a time**, in the bank's original order, with progress
  ("6 of 20"). There is no Previous button, question list, search, or jumping.
- **Explicit Submit** for every question type. Submit stays disabled until the
  answer is valid (one choice for single / true-false, at least one for
  select-all, non-empty text for fill-ins). After Submit the answer is
  **locked** for the rest of the attempt and **Next** is the only way forward.
- **Prep mode:** instant feedback after each Submit: correct or incorrect, your
  answer, and the correct answer(s).
- **Exam mode:** after Submit you only see "Answer locked." No correctness
  is shown until the end.
- **Results (both modes):** score X/20 and percentage, then a read-only review
  of every question (your answer vs. the correct answer, marked right or wrong),
  and a button to start a new attempt.
- **No backtracking:** the browser Back button is trapped during an attempt, and
  the page never changes URL per question, so Back cannot reopen an earlier one.
- **Refresh-safe:** the attempt is saved in `sessionStorage`. A refresh resumes
  at the current question with earlier answers still locked. Closing the tab
  ends the attempt.
- The historical 17/20 score from the original QuizFetch export is not shown.

### Grading

`src/lib/grade.ts` is a pure module:

- `single` / `truefalse`: the one correct choice.
- `multi`: exact set match (every correct option selected, no extras).
- `fill`: trim, collapse internal whitespace, uppercase, then exact match
  against `acceptedAnswers`. Q8 accepts `STATE MACHINE DIAGRAM` and
  `STATECHART DIAGRAM`; Q14 accepts `USE CASE DIAGRAM`.

## Project layout

```
data/questions.json        source of truth for the bank (imported directly)
data/questions.raw.json    raw extraction from the QuizFetch export (reference only)
src/lib/grade.ts           pure grading functions
src/lib/attempt.ts         attempt state + sessionStorage restore/validation
src/components/            Start screen, question player, results
src/app/                   Next.js App Router entry, fonts, styles
tests/grade.test.ts        grading tests (node:test)
```

## Run locally

Requires Node.js 22.18 or newer (the tests use Node's built-in TypeScript type
stripping).

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # grading tests
npm run lint       # TypeScript type check
npm run build      # production build
npm start          # serve the production build
```

Fonts (Newsreader, IBM Plex Sans) are loaded with `next/font/google`, which
downloads them at build time and self-hosts them, so the running app makes no
external requests. The build machine needs internet access.

## Deployment

Not deployed yet. It is meant to be deployed to Vercel later as a standard
Next.js project (no environment variables or secrets are needed for this
version).

## Notes

- Everything runs in the browser, including grading, so the answer key ships to
  the client. That is fine for a personal reviewer but it is not a secure exam.
- No analytics. To also turn off Next.js's own CLI telemetry on your machine,
  run `npx next telemetry disable`.
