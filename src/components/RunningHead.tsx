import type { Mode, QuestionBank } from "@/lib/types";

export default function RunningHead({ bank, mode }: { bank: QuestionBank; mode?: Mode }) {
  return (
    <header className="running-head">
      <span className="running-head__course">{bank.course}</span>
      <span className="running-head__rule" aria-hidden="true" />
      {mode ? (
        <span className={`mode-tag mode-tag--${mode}`}>{mode === "prep" ? "Prep mode" : "Exam mode"}</span>
      ) : (
        <span className="running-head__label">Reviewer</span>
      )}
    </header>
  );
}
