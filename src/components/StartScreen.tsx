"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Mode, QuestionBank } from "@/lib/types";
import StatusBar from "./StatusBar";

export default function StartScreen({ bank, onStart }: { bank: QuestionBank; onStart: (mode: Mode) => void }) {
  const [mode, setMode] = useState<Mode>("prep");
  const n = bank.questions.length;
  const minutes = bank.examTimerMinutes;
  const courseHref = `/courses/${bank.courseId}`;
  const headRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headRef.current?.focus({ preventScroll: true }), []);

  return (
    <div className="page">
      <StatusBar
        crumbs={[{ label: bank.courseCode, href: courseHref }, { label: bank.title }]}
        right={<span className="statusbar__label">start</span>}
      />
      <main className="content content--narrow">
        <p className="eyebrow">
          {bank.courseCode} · {bank.courseTitle}
        </p>
        <h1 className="heading" ref={headRef} tabIndex={-1}>
          {bank.title}
        </h1>
        {bank.examLabel && <p className="label-line">{bank.examLabel}</p>}
        {bank.topic && <p className="subhead">{bank.topic}</p>}

        <dl className="facts">
          <div>
            <dt>questions</dt>
            <dd>{n}</dd>
          </div>
          <div>
            <dt>order</dt>
            <dd>fixed</dd>
          </div>
          <div>
            <dt>exam timer</dt>
            <dd>{minutes ? `${minutes}:00` : "none"}</dd>
          </div>
        </dl>

        <section className="panel rules" aria-labelledby="rules-head">
          <h2 id="rules-head" className="panel__head">Before you begin</h2>
          <ul>
            <li>One question at a time, in a fixed order.</li>
            <li>Submit locks your answer. Next is the only way forward: no going back, no skipping.</li>
            <li>Every question needs an answer before you can submit.</li>
            <li>Refreshing restores submitted answers; unsubmitted input is not saved. Closing the tab ends the attempt.</li>
          </ul>
        </section>

        <form onSubmit={(e) => { e.preventDefault(); onStart(mode); }}><fieldset className="modes"><legend>Choose your mode</legend>
          <label className={`mode-card${mode === "prep" ? " is-selected" : ""}`}><input type="radio" name="mode" value="prep" checked={mode === "prep"} onChange={() => setMode("prep")} />
            <span className="mode-card__name">Prep mode</span>
            <span className="mode-card__desc">
              Correct or incorrect, the right answer{bank.questions.some((q) => q.explanation) ? ", and an explanation" : ""} after every submit. No timer.
            </span>
            <span className="mode-card__go" aria-hidden="true">SELECT →</span>
          </label>
          <label className={`mode-card${mode === "exam" ? " is-selected" : ""}`}><input type="radio" name="mode" value="exam" checked={mode === "exam"} onChange={() => setMode("exam")} />
            <span className="mode-card__name">Exam mode</span>
            <span className="mode-card__desc">
              No feedback until the end. Score and full review after question {n}.
              {minutes ? ` ${minutes}-minute countdown; at 00:00 the attempt submits itself and unanswered questions count as incorrect.` : ""}
            </span>
            <span className="mode-card__go" aria-hidden="true">SELECT →</span>
          </label>
        </fieldset><button type="submit" className="btn btn--primary start-button">Start {mode === "prep" ? "Prep" : "Exam"}</button></form>

        <p className="back-link">
          <Link href={courseHref}>← back to {bank.courseCode}</Link>
        </p>
      </main>
    </div>
  );
}
