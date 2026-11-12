"use client";

import { useEffect, useRef } from "react";
import type { QuestionBank } from "@/lib/types";
import type { Attempt } from "@/lib/attempt";
import { answerTexts, correctAnswerTexts, gradeAnswer, scoreAttempt } from "@/lib/grade";
import RunningHead from "./RunningHead";

export default function Results({ bank, attempt, onRestart }: { bank: QuestionBank; attempt: Attempt; onRestart: () => void }) {
  const { correct, total, percent } = scoreAttempt(bank.questions, attempt.answers);
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
          <button type="button" className="btn btn--primary" onClick={onRestart}>
            Start a new attempt
          </button>
        </div>
      </section>

      <section aria-labelledby="review-head" className="review">
        <h2 id="review-head" className="review__head">Review</h2>
        <ol className="review__list">
          {bank.questions.map((q) => {
            const a = attempt.answers[q.id];
            const ok = gradeAnswer(q, a);
            const right = correctAnswerTexts(q);
            const yours = answerTexts(q, a);
            return (
              <li key={q.id} className={`review__item ${ok ? "is-correct" : "is-wrong"}`}>
                <div className="review__top">
                  <span className="review__num">{q.number}</span>
                  <span className={`verdict ${ok ? "verdict--correct" : "verdict--wrong"}`}>{ok ? "Correct" : "Incorrect"}</span>
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
