"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { QuestionBank } from "@/lib/types";
import { formatClock, timeUsedMs, timerMs, type Attempt } from "@/lib/attempt";
import { gradeAnswer, scoreAttempt } from "@/lib/grade";
import StatusBar from "./StatusBar";
import { feedbackLines } from "./QuestionView";

export default function Results({ bank, attempt, onRestart }: { bank: QuestionBank; attempt: Attempt; onRestart: () => void }) {
  const { correct, total, percent } = scoreAttempt(bank.questions, attempt.answers);
  const [filter, setFilter] = useState<"all" | "incorrect" | "correct">("all");
  const reviewRef = useRef<HTMLHeadingElement>(null);
  const questions = bank.questions.filter((q) => filter === "all" || gradeAnswer(q, attempt.answers[q.id]) === (filter === "correct"));
  const headRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headRef.current?.focus({ preventScroll: true }), []);
  const courseHref = `/courses/${bank.courseId}`;
  const limit = timerMs(bank, attempt.mode);
  const unanswered = bank.questions.filter((q) => !(q.id in attempt.answers)).length;

  return (
    <div className="page">
      <StatusBar
        crumbs={[{ label: bank.courseCode, href: courseHref }, { label: bank.title }]}
        mode={attempt.mode}
        right={<span className="statusbar__label">results</span>}
      />
      <main className="content content--results">
        <section className="panel score" aria-labelledby="score-head">
          <h1 id="score-head" className="score__figure" ref={headRef} tabIndex={-1}>
            <span className="visually-hidden">Score: </span>
            {correct} / {total}
          </h1>
          <p className="score__pct">{percent}%</p>
          <p className="score__line">
            {bank.title} · {attempt.mode}
            {limit !== null && <> · {formatClock(timeUsedMs(bank, attempt))} used of {formatClock(limit)}</>}
          </p>
          {attempt.timedOut && (
            <p className="score__note">
              Time ran out.{unanswered > 0 ? ` ${unanswered} unanswered question${unanswered === 1 ? "" : "s"} counted as incorrect.` : ""}
            </p>
          )}
        </section>

        <div className="results-actions">
          {correct < total && <button type="button" className="btn btn--outline" onClick={() => { setFilter("incorrect"); reviewRef.current?.focus(); }}>Review incorrect answers</button>}
          <button type="button" className="btn btn--primary btn--wide" onClick={onRestart}>
            Start a new attempt
          </button>
          <Link className="btn btn--outline btn--wide" href={courseHref}>
            Back to course
          </Link>
        </div>

        <section aria-labelledby="review-head" className="panel review">
          <h2 id="review-head" className="panel__head" ref={reviewRef} tabIndex={-1}>
            Review · {total} questions
          </h2>
          <div className="filters" role="group" aria-label="Filter answer review">
            {(["all", "incorrect", "correct"] as const).map((value) => <button key={value} type="button" className="filter-btn" aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === "all" ? "All" : value === "incorrect" ? "Incorrect" : "Correct"} ({value === "all" ? total : value === "correct" ? correct : total - correct})</button>)}
          </div>
          <p className="review-count" role="status">{questions.length} questions shown</p>
          {questions.length === 0 && <p className="review-count">No {filter} answers. <button type="button" className="link-btn" onClick={() => setFilter("all")}>Show all answers</button></p>}
          <ol className="review__list">
            {questions.map((q) => {
              const a = attempt.answers[q.id];
              const ok = gradeAnswer(q, a);
              const yours = a ? feedbackLines(q, a, false) : [];
              const right = feedbackLines(q, a, true);
              return (
                <li value={q.number} key={q.id} className={`review__item ${ok ? "is-correct" : "is-wrong"}`}>
                  <span className="review__num">{q.number}</span>
                  <span className={`verdict ${ok ? "verdict--correct" : "verdict--wrong"}`}>{ok ? "Correct" : "Incorrect"}</span>
                  <div className="review__body">
                    <p className="review__prompt">{q.prompt}</p>
                    <dl className="review__answers">
                      <div className={ok ? "is-correct" : "is-wrong"}>
                        <dt>your:</dt>
                        <dd>{yours.length ? yours.map((y, i) => <span key={i}>{y}</span>) : <span>— no answer</span>}</dd>
                      </div>
                      {!ok && (
                        <div className="is-correct">
                          <dt>correct:</dt>
                          <dd>{right.map((r, i) => <span key={i}>{r}</span>)}</dd>
                        </div>
                      )}
                    </dl>
                    {q.explanation && <p className="review__explain">{q.explanation}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <div className="results-actions">
          {correct < total && <button type="button" className="btn btn--outline" onClick={() => { setFilter("incorrect"); reviewRef.current?.focus(); }}>Review incorrect answers</button>}
          <button type="button" className="btn btn--primary btn--wide" onClick={onRestart}>
            Start a new attempt
          </button>
          <Link className="btn btn--outline btn--wide" href={courseHref}>
            Back to course
          </Link>
        </div>
      </main>
    </div>
  );
}
