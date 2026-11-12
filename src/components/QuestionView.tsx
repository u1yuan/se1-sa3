"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { Answer, Question, QuestionBank } from "@/lib/types";
import type { Attempt } from "@/lib/attempt";
import { answerTexts, correctAnswerTexts, gradeAnswer, isAnswerValid } from "@/lib/grade";
import RunningHead from "./RunningHead";
import Progress from "./Progress";

const LETTERS = "ABCDEFGHIJ";

interface Props {
  bank: QuestionBank;
  attempt: Attempt;
  question: Question;
  backNotice: boolean;
  onSubmit: (answer: Answer) => void;
  onNext: () => void;
  onQuit: () => void;
}

export default function QuestionView({ bank, attempt, question, backNotice, onSubmit, onNext, onQuit }: Props) {
  const locked: Answer | undefined = attempt.answers[question.id];
  const isLocked = locked !== undefined;
  const prep = attempt.mode === "prep";
  const total = bank.questions.length;
  const isLast = attempt.index === total - 1;

  const [picked, setPicked] = useState<string[]>([]);
  const [text, setText] = useState("");

  const draft: Answer = question.type === "fill" ? { kind: "fill", text } : { kind: "choice", choiceIds: picked };
  const shown: Answer = locked ?? draft;
  const valid = isAnswerValid(question, draft);
  const correct = isLocked ? gradeAnswer(question, locked) : false;

  const headingRef = useRef<HTMLHeadingElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (isLocked) nextRef.current?.focus({ preventScroll: true });
  }, [isLocked]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isLocked) onNext();
    else if (valid) onSubmit(draft);
  }

  // Enter on a radio/checkbox submits (browsers don't do this natively).
  function handleKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    const t = e.target as HTMLElement;
    if (e.key === "Enter" && t instanceof HTMLInputElement && (t.type === "radio" || t.type === "checkbox")) {
      e.preventDefault();
      e.currentTarget.requestSubmit();
    }
  }

  const selectedIds = shown.kind === "choice" ? new Set(shown.choiceIds) : new Set<string>();
  const multi = question.type === "multi";
  const fieldName = `answer-${question.id}`;

  return (
    <main className="sheet">
      <RunningHead bank={bank} mode={attempt.mode} />
      <Progress current={attempt.index} total={total} lockedCurrent={isLocked} />

      {backNotice && (
        <p className="notice" role="status">
          Answers are locked. You can’t go back to earlier questions.
        </p>
      )}

      <form className="question" onSubmit={handleSubmit} onKeyDown={handleKeyDown} noValidate>
        <h1 className="prompt" ref={headingRef} tabIndex={-1} id={`${question.id}-prompt`}>
          <span className="prompt__num" aria-hidden="true">
            {question.number}
          </span>
          <span className="visually-hidden">Question {question.number}. </span>
          <span className="prompt__text">{question.prompt}</span>
        </h1>

        <p className="instruction" id={`${question.id}-instr`}>
          {question.instruction}
        </p>

        {question.type === "fill" ? (
          <div className="fill">
            <label className="visually-hidden" htmlFor={fieldName}>
              Your answer
            </label>
            <input
              id={fieldName}
              className={`fill__input${isLocked ? (prep ? (correct ? " is-correct" : " is-wrong") : " is-locked") : ""}`}
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              aria-describedby={`${question.id}-instr`}
              value={isLocked && locked?.kind === "fill" ? locked.text : text}
              onChange={(e) => setText(e.target.value.toUpperCase())}
              readOnly={isLocked}
              aria-readonly={isLocked}
              placeholder="TYPE YOUR ANSWER"
            />
          </div>
        ) : (
          <fieldset
            className="choices"
            aria-labelledby={`${question.id}-prompt`}
            aria-describedby={`${question.id}-instr`}
            disabled={isLocked}
          >
            {question.choices.map((c, i) => {
              const selected = selectedIds.has(c.id);
              let state = "";
              let tag: string | null = null;
              if (isLocked) {
                if (prep) {
                  if (c.correct && selected) {
                    state = "is-correct";
                    tag = "Your answer · correct";
                  } else if (c.correct) {
                    state = "is-missed";
                    tag = multi ? "Correct · not selected" : "Correct answer";
                  } else if (selected) {
                    state = "is-wrong";
                    tag = "Your answer · incorrect";
                  } else state = "is-dim";
                } else {
                  state = selected ? "is-locked-selected" : "is-dim";
                }
              } else if (selected) state = "is-selected";
              return (
                <label key={c.id} className={`choice ${multi ? "choice--multi" : ""} ${state}`}>
                  <input
                    className="visually-hidden"
                    type={multi ? "checkbox" : "radio"}
                    name={fieldName}
                    value={c.id}
                    checked={selected}
                    onChange={(e) => {
                      if (isLocked) return;
                      if (multi) {
                        setPicked((p) => (e.target.checked ? [...p, c.id] : p.filter((x) => x !== c.id)));
                      } else setPicked([c.id]);
                    }}
                  />
                  <span className="choice__mark" aria-hidden="true">
                    {LETTERS[i]}
                  </span>
                  <span className="choice__text">{c.text}</span>
                  {tag && <span className="choice__tag">{tag}</span>}
                </label>
              );
            })}
          </fieldset>
        )}

        <div className="feedback-slot" aria-live="polite">
          {isLocked && prep && (
            <Feedback
              correct={correct}
              yours={feedbackItems(question, locked, false)}
              right={feedbackItems(question, locked, true)}
              label={
                question.type === "fill"
                  ? question.acceptedAnswers.length > 1 ? "Accepted answers" : "Correct answer"
                  : question.type === "multi" ? "Correct answers" : "Correct answer"
              }
              yoursLabel={question.type === "multi" ? "Your answers" : "Your answer"}
            />
          )}
          {isLocked && !prep && (
            <div className="feedback feedback--locked" role="status">
              <span className="feedback__verdict">Answer locked.</span>
              <span className="feedback__hint">Results appear after question {total}.</span>
            </div>
          )}
        </div>

        <div className="actions">
          {isLocked ? (
            <button ref={nextRef} type="submit" className="btn btn--primary">
              {isLast ? "See results" : "Next question"}
              <span className="btn__arrow" aria-hidden="true">→</span>
            </button>
          ) : (
            <button type="submit" className="btn btn--primary" disabled={!valid} aria-disabled={!valid}>
              Submit answer
            </button>
          )}
          <span className="actions__hint" aria-hidden="true">
            {isLocked ? "Press Enter to continue" : valid ? "Press Enter to submit" : multi ? "Select one or more" : question.type === "fill" ? "Type an answer" : "Select an answer"}
          </span>
        </div>
      </form>

      <footer className="sheet__foot">
        <button type="button" className="link-btn" onClick={onQuit}>
          Discard attempt
        </button>
      </footer>
    </main>
  );
}

/** Fill-ins show text; multi shows letters (choices above carry the text); single shows "B. text". */
function feedbackItems(question: Question, answer: Answer | undefined, wantCorrect: boolean): string[] {
  if (question.type === "fill") return wantCorrect ? correctAnswerTexts(question) : answerTexts(question, answer);
  const picked = answer?.kind === "choice" ? new Set(answer.choiceIds) : new Set<string>();
  const items = question.choices
    .map((c, i) => ({ c, letter: LETTERS[i] ?? "?" }))
    .filter(({ c }) => (wantCorrect ? c.correct : picked.has(c.id)));
  if (question.type === "multi") return [items.map((x) => x.letter).join(", ")].filter(Boolean);
  return items.map(({ c, letter }) => `${letter}. ${c.text}`);
}

function Feedback({
  correct,
  yours,
  right,
  label,
  yoursLabel,
}: {
  correct: boolean;
  yours: string[];
  right: string[];
  label: string;
  yoursLabel: string;
}) {
  return (
    <div className={`feedback ${correct ? "feedback--correct" : "feedback--wrong"}`} role="status">
      <p className="feedback__verdict">{correct ? "Correct." : "Incorrect."}</p>
      <dl className="feedback__grid">
        <div>
          <dt>{yoursLabel}</dt>
          <dd>{yours.length ? yours.map((y) => <span key={y}>{y}</span>) : <span>—</span>}</dd>
        </div>
        <div>
          <dt>{label}</dt>
          <dd>{right.map((r) => <span key={r}>{r}</span>)}</dd>
        </div>
      </dl>
    </div>
  );
}
