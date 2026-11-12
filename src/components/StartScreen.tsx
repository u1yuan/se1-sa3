import type { Mode, QuestionBank } from "@/lib/types";
import RunningHead from "./RunningHead";

export default function StartScreen({ bank, onStart }: { bank: QuestionBank; onStart: (mode: Mode) => void }) {
  const n = bank.questions.length;
  return (
    <main className="sheet sheet--start">
      <RunningHead bank={bank} />
      <section className="title-block" aria-labelledby="title">
        <p className="eyebrow">Reviewer</p>
        <h1 id="title" className="title">{bank.title}</h1>
        <p className="subtitle">{bank.topic}</p>
        <dl className="facts">
          <div>
            <dt>Questions</dt>
            <dd>{n}</dd>
          </div>
          <div>
            <dt>Order</dt>
            <dd>Fixed</dd>
          </div>
          <div>
            <dt>Label</dt>
            <dd>{bank.examLabel}</dd>
          </div>
        </dl>
      </section>

      <aside className="rules" aria-label="Before you begin">
        <p className="rules__head">Before you begin</p>
        <p>
          Questions appear one at a time. Once you submit an answer it is <strong>locked</strong>: you cannot change it,
          go back, or skip ahead. Refreshing the page resumes where you left off.
        </p>
      </aside>

      <section className="modes" aria-label="Choose a mode">
        <button type="button" className="mode-card" onClick={() => onStart("prep")}>
          <span className="mode-card__name">Prep mode</span>
          <span className="mode-card__desc">See right or wrong, and the correct answer, right after each submit.</span>
          <span className="mode-card__go" aria-hidden="true">Begin →</span>
        </button>
        <button type="button" className="mode-card mode-card--exam" onClick={() => onStart("exam")}>
          <span className="mode-card__name">Exam mode</span>
          <span className="mode-card__desc">No feedback until the end. Score and full review after question {n}.</span>
          <span className="mode-card__go" aria-hidden="true">Begin →</span>
        </button>
      </section>
    </main>
  );
}
