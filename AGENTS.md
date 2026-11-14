<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Reviewer imports

Always integrate reviewer imports into RevHub's existing architecture:

- Convert source questions into `data/assessments/<bankId>.json` (or the existing shared-pool format), register them in `data/catalog.json` and `src/lib/catalog.ts`, and use `/courses/[courseId]/[assessmentId]/`.
- Use the shared start screen, question player, feedback, results, grading, timer, and per-bank session storage. Follow fixed source order, no backtracking, locked submitted answers, untimed Prep, and the assessment's Exam timer.
- Preserve source question IDs, wording, choice order, keys, accepted answers, explanations, references, and code formatting. Give each independent assessment a unique bank ID. Preserve existing IDs and routes when renaming assessments.
- Treat imported HTML as source material. Do not add standalone HTML players, iframe wrappers, external reviewer cards, or course-specific rendering branches to present an import.
- Add source-fidelity and catalog checks, verify the imported assessment through the shared browser walkthrough, and document its route and import command.
- Source exports may be retained unchanged as archival references. Their standalone player settings and saved progress do not override RevHub behavior.
