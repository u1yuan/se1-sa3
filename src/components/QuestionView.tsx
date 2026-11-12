"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { Answer, ChoiceQuestion, MatchingQuestion, Question, QuestionBank } from "@/lib/types";
import { formatClock, type Attempt } from "@/lib/attempt";
import { answerTexts, correctAnswerTexts, gradeAnswer, isAnswerValid, matchResults } from "@/lib/grade";
import StatusBar from "./StatusBar";
import QuestionIndex, { ProgressLine } from "./QuestionIndex";
import QuestionMedia from "./QuestionMedia";

export const LETTERS = "ABCDEFGHIJKLMNOP";

interface Props {
  bank: QuestionBank;
  attempt: Attempt;
  question: Question;
  remaining: number | null;
  notice: "back" | "resumed" | null;
  onDraft: (draft: Answer | null) => void;
  onSubmit: (answer: Answer) => void;
  onNext: () => void;
  onQuit: () => void;
}

export default function QuestionView({ bank, attempt, question, remaining, notice, onDraft, onSubmit, onNext, onQuit }: Props) {
  const locked: Answer | undefined = attempt.answers[question.id];
  const isLocked = locked !== undefined;
  const prep = attempt.mode === "prep";
  const total = bank.questions.length;
  const isLast = attempt.index === total - 1;

  const [picked, setPicked] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [picks, setPicks] = useState<Record<string, string>>({});

  const draft: Answer = useMemo(
    () =>
      question.type === "fill"
        ? { kind: "fill", text }
        : question.type === "matching"
          ? { kind: "match", picks }
          : { kind: "choice", choiceIds: picked },
    [question.type, text, picks, picked],
  );
  const valid = isAnswerValid(question, draft);
  const correct = isLocked ? gradeAnswer(question, locked) : false;

  useEffect(() => {
    onDraft(isLocked ? null : draft);
  }, [draft, isLocked, onDraft]);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => headingRef.current?.focus({ preventScroll: true }), []);
  useEffect(() => {
    if (isLocked) nextRef.current?.focus({ preventScroll: true });
  }, [isLocked]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isLocked) onNext();
    else if (valid) onSubmit(draft);
  }

  // Enter on a radio, checkbox, or closed select submits (browsers don't do this natively).
  function handleKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    if (e.key !== "Enter" || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target as HTMLElement;
    const isToggle = t instanceof HTMLInputElement && (t.type === "radio" || t.type === "checkbox");
    if (isToggle || t instanceof HTMLSelectElement) {
      e.preventDefault();
      e.currentTarget.requestSubmit();
    }
  }

  const hint = isLocked
    ? isLast ? "Enter shows results." : "Enter goes to the next question."
    : valid ? "Enter submits. Answer locks." : question.type === "matching" ? "Choose a match for every item." : question.type === "fill" ? "Type an answer." : question.type === "multi" ? "Select one or more." : "Select an answer.";

  const timerState = remaining === null ? null : remaining <= 60_000 ? "critical" : remaining <= 5 * 60_000 ? "urgent" : "normal";
  const announce = remaining === null ? "" : remaining <= 60_000 ? "One minute remaining." : remaining <= 5 * 60_000 ? "Five minutes remaining." : "";

  return (
    <div className="page page--player">
      <StatusBar
        locked
        crumbs={[{ label: bank.courseCode }, { label: bank.title }]}
        mode={attempt.mode}
        right={
          remaining !== null ? (
            <>
              <span className={`timer timer--${timerState}`} role="timer" aria-label={`Time remaining ${formatClock(remaining)}`}>
                {formatClock(remaining)}
              </span>
              <span className="visually-hidden" aria-live="polite">{announce}</span>
            </>
          ) : undefined
        }
      />

      {notice && (
        <p className="notice" role="status">
          {notice === "back"
            ? "Answers are locked. You can’t go back to earlier questions."
            : `Resumed at question ${attempt.index + 1} of ${total}. Earlier answers stay locked.`}
        </p>
      )}

      <div className="player">
        <form className="panel qcard" onSubmit={handleSubmit} onKeyDown={handleKeyDown} noValidate aria-labelledby={`${question.id}-prompt`}>
          <div className="qcard__head">
            <div>
              <p className="qcard__count">
                Question {question.number} of {total}
              </p>
              <p className="qcard__meta">
                {bank.title} · 1 pt · locked after submit
              </p>
            </div>
            <p className="qcard__instr" id={`${question.id}-instr`}>
              {question.instruction}
            </p>
          </div>

          <div className="qcard__progress-mobile">
            <ProgressLine current={attempt.index} total={total} lockedCurrent={isLocked} />
          </div>

          <h1 className="prompt" ref={headingRef} tabIndex={-1} id={`${question.id}-prompt`}>
            <span className="visually-hidden">Question {question.number}. </span>
            {question.prompt}
          </h1>

          <QuestionMedia question={question} />

          {question.type === "fill" ? (
            <FillInput question={question.id} locked={locked} prep={prep} correct={correct} text={text} setText={setText} />
          ) : question.type === "matching" ? (
            <MatchingInput question={question} locked={locked} prep={prep} picks={picks} setPicks={setPicks} />
          ) : (
            <ChoiceInput question={question} locked={locked} prep={prep} picked={picked} setPicked={setPicked} />
          )}

          <div className="feedback-slot" aria-live="polite">
            {isLocked && prep && <Feedback question={question} answer={locked} correct={correct} />}
            {isLocked && !prep && (
              <div className="feedback feedback--locked" role="status">
                <p className="feedback__verdict">Answer locked.</p>
                <p className="feedback__hint">Results appear after question {total}.</p>
              </div>
            )}
          </div>

          <div className="actions">
            {isLocked ? (
              <button ref={nextRef} type="submit" className="btn btn--primary">
                {isLast ? "See results" : "Next"} <span aria-hidden="true">→</span>
              </button>
            ) : (
              <button type="submit" className="btn btn--primary" disabled={!valid}>
                Submit
              </button>
            )}
            <span className="actions__hint">{hint}</span>
          </div>
        </form>

        <aside className="panel side" aria-label="Question index and progress">
          <QuestionIndex current={attempt.index} total={total} lockedCurrent={isLocked} />
          <ProgressLine current={attempt.index} total={total} lockedCurrent={isLocked} />
        </aside>
      </div>

      <footer className="player__foot">
        <button type="button" className="link-btn" onClick={onQuit}>
          Discard attempt
        </button>
      </footer>
    </div>
  );
}

function ChoiceInput({
  question,
  locked,
  prep,
  picked,
  setPicked,
}: {
  question: ChoiceQuestion;
  locked: Answer | undefined;
  prep: boolean;
  picked: string[];
  setPicked: (fn: (p: string[]) => string[]) => void;
}) {
  const isLocked = locked !== undefined;
  const multi = question.type === "multi";
  const shown = locked?.kind === "choice" ? locked.choiceIds : picked;
  const selectedIds = new Set(shown);
  const fieldName = `answer-${question.id}`;
  return (
    <fieldset className="choices" aria-labelledby={`${question.id}-prompt`} aria-describedby={`${question.id}-instr`} disabled={isLocked}>
      {question.choices.map((c, i) => {
        const selected = selectedIds.has(c.id);
        let state = "";
        let tag: string | null = null;
        if (isLocked) {
          if (prep) {
            if (c.correct && selected) [state, tag] = ["is-correct", "Your answer · correct"];
            else if (c.correct) [state, tag] = ["is-missed", multi ? "Correct · not selected" : "Correct answer"];
            else if (selected) [state, tag] = ["is-wrong", "Your answer · incorrect"];
            else state = "is-dim";
          } else state = selected ? "is-locked-selected" : "is-dim";
        } else if (selected) state = "is-selected";
        const mark = multi ? (selected ? "[x]" : "[ ]") : selected ? "(*)" : "( )";
        return (
          <label key={c.id} className={`choice ${state}`}>
            <input
              className="visually-hidden"
              type={multi ? "checkbox" : "radio"}
              name={fieldName}
              value={c.id}
              checked={selected}
              onChange={(e) => {
                if (isLocked) return;
                if (multi) setPicked((p) => (e.target.checked ? [...p, c.id] : p.filter((x) => x !== c.id)));
                else setPicked(() => [c.id]);
              }}
            />
            <span className="choice__mark" aria-hidden="true">{mark}</span>
            <span className="choice__letter" aria-hidden="true">{LETTERS[i]}</span>
            <span className="choice__text">{c.text}</span>
            {tag && <span className="choice__tag">{tag}</span>}
          </label>
        );
      })}
    </fieldset>
  );
}

function FillInput({
  question,
  locked,
  prep,
  correct,
  text,
  setText,
}: {
  question: string;
  locked: Answer | undefined;
  prep: boolean;
  correct: boolean;
  text: string;
  setText: (t: string) => void;
}) {
  const isLocked = locked !== undefined;
  const id = `answer-${question}`;
  return (
    <div className="fill">
      <label className="fill__label" htmlFor={id}>
        Your answer
      </label>
      <input
        id={id}
        className={`fill__input${isLocked ? (prep ? (correct ? " is-correct" : " is-wrong") : " is-locked") : ""}`}
        type="text"
        autoComplete="off"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        aria-describedby={`${question}-instr`}
        value={isLocked && locked?.kind === "fill" ? locked.text : text}
        onChange={(e) => setText(e.target.value.toUpperCase())}
        readOnly={isLocked}
        placeholder="TYPE YOUR ANSWER"
      />
    </div>
  );
}

function MatchingInput({
  question,
  locked,
  prep,
  picks,
  setPicks,
}: {
  question: MatchingQuestion;
  locked: Answer | undefined;
  prep: boolean;
  picks: Record<string, string>;
  setPicks: (fn: (p: Record<string, string>) => Record<string, string>) => void;
}) {
  const isLocked = locked !== undefined;
  const shown = locked?.kind === "match" ? locked.picks : picks;
  const results = isLocked ? matchResults(question, locked) : [];
  return (
    <fieldset className="matching" aria-labelledby={`${question.id}-prompt`} aria-describedby={`${question.id}-instr`} disabled={isLocked}>
      {question.prompts.map((p, i) => {
        const value = shown[p.id] ?? "";
        const ok = results[i];
        const state = isLocked ? (prep ? (ok ? "is-correct" : "is-wrong") : "is-locked-selected") : value ? "is-selected" : "";
        const id = `match-${p.id}`;
        return (
          <div key={p.id} className={`match ${state}`}>
            <label className="match__prompt" htmlFor={id}>
              <span className="match__num" aria-hidden="true">{i + 1}.</span>
              <span>{p.text}</span>
            </label>
            <div className="match__pick">
              <span className="match__select">
                <select
                  id={id}
                  value={value}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPicks((prev) => {
                      const next = { ...prev };
                      if (v) next[p.id] = v;
                      else delete next[p.id];
                      return next;
                    });
                  }}
                >
                  <option value="">[ select ]</option>
                  {question.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </span>
              {value.length > 44 && <span className="match__full">{value}</span>}
              {isLocked && prep && (
                <span className="choice__tag">{ok ? "Your answer · correct" : `Incorrect · answer: ${p.answer}`}</span>
              )}
            </div>
          </div>
        );
      })}
    </fieldset>
  );
}

/** Text for prep feedback: "B. nslookup" for choices, plain text for fill/matching. */
export function feedbackLines(question: Question, answer: Answer | undefined, wantCorrect: boolean): string[] {
  if (question.type === "fill" || question.type === "matching") {
    return wantCorrect ? correctAnswerTexts(question) : answerTexts(question, answer);
  }
  const picked = answer?.kind === "choice" ? new Set(answer.choiceIds) : new Set<string>();
  return question.choices
    .map((c, i) => ({ c, letter: LETTERS[i] ?? "?" }))
    .filter(({ c }) => (wantCorrect ? c.correct : picked.has(c.id)))
    .map(({ c, letter }) => `${letter}. ${c.text}`);
}

function Feedback({ question, answer, correct }: { question: Question; answer: Answer | undefined; correct: boolean }) {
  const yours = feedbackLines(question, answer, false);
  const right = feedbackLines(question, answer, true);
  const many = right.length > 1;
  const rightLabel = question.type === "fill" ? (many ? "Accepted answers" : "Correct answer") : many ? "Correct answers" : "Correct answer";
  return (
    <div className={`feedback ${correct ? "feedback--correct" : "feedback--wrong"}`} role="status">
      <p className="feedback__verdict">{correct ? "Correct" : "Incorrect"}</p>
      <dl className="feedback__grid">
        <div>
          <dt>{yours.length > 1 ? "Your answers" : "Your answer"}</dt>
          <dd>{yours.length ? yours.map((y, i) => <span key={i}>{y}</span>) : <span>—</span>}</dd>
        </div>
        <div>
          <dt>{rightLabel}</dt>
          <dd>{right.map((r, i) => <span key={i}>{r}</span>)}</dd>
        </div>
        {question.explanation && (
          <div>
            <dt>Explanation</dt>
            <dd className="feedback__explain">{question.explanation}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
