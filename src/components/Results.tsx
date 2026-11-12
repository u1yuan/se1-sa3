"use client";

import { useEffect, useRef, useState } from "react";
import type { QuestionBank } from "@/lib/types";
import type { Attempt } from "@/lib/attempt";
import { answerTexts, correctAnswerTexts, gradeAnswer, scoreAttempt } from "@/lib/grade";
import RunningHead from "./RunningHead";

export default function Results({ bank, attempt, onRestart }: { bank: QuestionBank; attempt: Attempt; onRestart: () => void }) {
  const { correct, total, percent } = scoreAttempt(bank.questions, attempt.answers);
  const [filter, setFilter] = useState<"all" | "incorrect" | "correct">("all");
  const reviewRef = useRef<HTMLHeadingElement>(null);
  const incorrect = total - correct;
  const questions = bank.questions.filter((q) => filter === "all" || gradeAnswer(q, attempt.answers[q.id]) === (filter === "correct"));
  const headRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headRef.current?.focus({ preventScroll: true }), []);

  return (
    <main className="sheet sheet--results">
      <RunningHead bank={bank} mode={attempt.mode} />

      <section className="score" aria-labelledby="score-head">
        <p className="eyebrow">Results · {bank.title}</p>
        <h1 id="score-head" className="score__figure" ref={headRef} tabIndex={-1}>
          {correct}
          <span className="score__total">/{total}</span>
        </h1>
        <p className="score__pct">{percent}%</p>
        <p className="score__line">
          {correct} correct, {total - correct} incorrect.
        </p>
        <div className="actions actions--center">
          {incorrect > 0 ? (
            <>
              <button type="button" className="btn btn--primary" onClick={() => { setFilter("incorrect"); reviewRef.current?.focus(); }}>Review incorrect answers</button>
              <button type="button" className="btn btn--ghost" onClick={onRestart}>Start a new attempt</button>
            </>
          ) : <button type="button" className="btn btn--primary" onClick={onRestart}>Start a new attempt</button>}
        </div>
      </section>

      <section aria-labelledby="review-head" className="review">
        <h2 id="review-head" className="review__head" ref={reviewRef} tabIndex={-1}>Answer review</h2>
        <div className="filters" role="group" aria-label="Filter answer review">
          {(["all", "incorrect", "correct"] as const).map((value) => (
            <button type="button" key={value} className="filter-btn" aria-pressed={filter === value} onClick={() => setFilter(value)}>
              {value === "all" ? "All" : value === "incorrect" ? "Incorrect" : "Correct"} ({value === "all" ? total : value === "incorrect" ? incorrect : correct})
            </button>
          ))}
        </div>
        <p className="review__count" role="status">{questions.length} {questions.length === 1 ? "question" : "questions"} shown</p>
        {questions.length === 0 && <div className="empty-state"><h3>No {filter} answers</h3><p>{filter === "incorrect" ? "You answered every question correctly. Nice work!" : "Keep practicing. Review the answers to prepare for your next attempt."}</p><button type="button" className="btn btn--ghost" onClick={() => setFilter("all")}>Show all answers</button></div>}
        <ol className="review__list">
          {questions.map((q) => {
            const a = attempt.answers[q.id];
            const ok = gradeAnswer(q, a);
            const right = correctAnswerTexts(q);
            const yours = answerTexts(q, a);
            return (
              <li value={q.number} key={q.id} className={`review__item ${ok ? "is-correct" : "is-wrong"}`}>
                <div className="review__top">
                  <span className="review__num">Question {q.number}</span>
                  <span className={`verdict ${ok ? "verdict--correct" : "verdict--wrong"}`}>{ok ? "\u2713 Correct" : "\u2715 Incorrect"}</span>
                </div>
                <p className="review__prompt">{q.prompt}</p>
                <dl className="review__grid">
                  <div>
                    <dt>Your answer</dt>
                    <dd>{yours.length ? yours.map((y) => <span key={y}>{y}</span>) : <span>—</span>}</dd>
                  </div>
                  <div>
                    <dt>{q.type === "fill" && right.length > 1 ? "Accepted" : right.length > 1 ? "Correct answers" : "Correct answer"}</dt>
                    <dd>{right.map((r) => <span key={r}>{r}</span>)}</dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ol>
        <div className="actions actions--center">
          <button type="button" className="btn btn--ghost" onClick={onRestart}>
            Start a new attempt
          </button>
        </div>
      </section>
    </main>
  );
}
