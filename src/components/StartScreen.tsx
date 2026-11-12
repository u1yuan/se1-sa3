"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Mode, QuestionBank } from "@/lib/types";
import StatusBar from "./StatusBar";

export default function StartScreen({ bank, onStart }: { bank: QuestionBank; onStart: (mode: Mode) => void }) {
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
            <li>Refreshing resumes where you left off. Closing the tab ends the attempt.</li>
          </ul>
        </section>

        <section className="modes" aria-label="Choose a mode">
          <button type="button" className="mode-card" onClick={() => onStart("prep")}>
            <span className="mode-card__name">Prep mode</span>
            <span className="mode-card__desc">
              Correct or incorrect, the right answer{bank.questions.some((q) => q.explanation) ? ", and an explanation" : ""} after every submit. No timer.
            </span>
            <span className="mode-card__go" aria-hidden="true">BEGIN →</span>
          </button>
          <button type="button" className="mode-card" onClick={() => onStart("exam")}>
            <span className="mode-card__name">Exam mode</span>
            <span className="mode-card__desc">
              No feedback until the end. Score and full review after question {n}.
              {minutes ? ` ${minutes}-minute countdown; at 00:00 the attempt submits itself and unanswered questions count as incorrect.` : ""}
            </span>
            <span className="mode-card__go" aria-hidden="true">BEGIN →</span>
          </button>
        </section>

        <p className="back-link">
          <Link href={courseHref}>← back to {bank.courseCode}</Link>
        </p>
      </main>
    </div>
  );
}
