"use client";

import { useEffect, useRef, useState } from "react";
import type { Mode, QuestionBank } from "@/lib/types";
import RunningHead from "./RunningHead";

export default function StartScreen({ bank, onStart }: { bank: QuestionBank; onStart: (mode: Mode) => void }) {
  const [mode, setMode] = useState<Mode>("prep");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus({ preventScroll: true }), []);
  return (
    <main className="sheet sheet--start">
      <RunningHead bank={bank} />
      <section className="title-block" aria-labelledby="title">
        <p className="eyebrow">Your study space</p>
        <h1 id="title" className="title" ref={heading} tabIndex={-1}>{bank.title}</h1>
        <p className="subtitle">{bank.topic}</p>
        <p className="bank-count">{bank.questions.length} questions <span aria-hidden="true">&middot;</span> Fixed order</p>
      </section>
      <form onSubmit={(e) => { e.preventDefault(); onStart(mode); }}>
        <fieldset className="modes">
          <legend>Choose your mode</legend>
          {(["prep", "exam"] as const).map((value) => (
            <label key={value} className={`mode-card${mode === value ? " is-selected" : ""}`}>
              <input type="radio" name="mode" value={value} checked={mode === value} onChange={() => setMode(value)} />
              <span>
                <span className="mode-card__name">{value === "prep" ? "Prep" : "Exam"}</span>
                <span className="mode-card__desc">{value === "prep" ? "Learn as you go. See correctness and answers after each submission." : "Test what you know. See correctness and answers at the end."}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <aside className="rules" aria-label="Before you begin">
          <p className="rules__head">One question at a time</p>
          <p>Submitted answers cannot be changed or revisited. You cannot skip questions.</p>
          <p>Refreshing restores submitted answers. Unsubmitted input is not saved.</p>
        </aside>
        <button type="submit" className="btn btn--primary start-button">Start {mode === "prep" ? "Prep" : "Exam"} <span aria-hidden="true">&rarr;</span></button>
      </form>
      <details className="bank-details">
        <summary>Question bank details</summary>
        <p>Source label: <span>{bank.examLabel}</span></p>
      </details>
    </main>
  );
}
