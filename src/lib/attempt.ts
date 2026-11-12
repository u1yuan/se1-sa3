// Attempt state + sessionStorage persistence. Answers only ever get appended:
// there is no operation that edits or removes a locked answer.
import type { Answer, Mode, QuestionBank } from "./types";
import { isAnswerValid } from "./grade";

export interface Attempt {
  v: 1;
  bankId: string;
  mode: Mode;
  /** Index of the question currently on screen. */
  index: number;
  /** Locked answers keyed by question id. */
  answers: Record<string, Answer>;
  finished: boolean;
  startedAt: number;
}

const KEY = "exam-reviewer:attempt";

export function newAttempt(bank: QuestionBank, mode: Mode): Attempt {
  return { v: 1, bankId: bank.id, mode, index: 0, answers: {}, finished: false, startedAt: Date.now() };
}

export function isLocked(attempt: Attempt, questionId: string): boolean {
  return Object.prototype.hasOwnProperty.call(attempt.answers, questionId);
}

/** Lock an answer for the current question. No-op if it's already locked or invalid. */
export function lockAnswer(bank: QuestionBank, attempt: Attempt, answer: Answer): Attempt {
  const q = bank.questions[attempt.index];
  if (!q || attempt.finished || isLocked(attempt, q.id) || !isAnswerValid(q, answer)) return attempt;
  return { ...attempt, answers: { ...attempt.answers, [q.id]: answer } };
}

/** Move forward. Only allowed once the current question is locked. */
export function advance(bank: QuestionBank, attempt: Attempt): Attempt {
  const q = bank.questions[attempt.index];
  if (!q || attempt.finished || !isLocked(attempt, q.id)) return attempt;
  const next = attempt.index + 1;
  if (next >= bank.questions.length) return { ...attempt, finished: true };
  return { ...attempt, index: next };
}

export function saveAttempt(attempt: Attempt | null): void {
  try {
    if (attempt) sessionStorage.setItem(KEY, JSON.stringify(attempt));
    else sessionStorage.removeItem(KEY);
  } catch {
    /* storage unavailable (private mode, quota): attempt just won't survive refresh */
  }
}

/** Restore a saved attempt, rejecting anything inconsistent with no-backtracking. */
export function loadAttempt(bank: QuestionBank): Attempt | null {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const a = JSON.parse(raw) as Partial<Attempt>;
    const n = bank.questions.length;
    if (a.v !== 1 || a.bankId !== bank.id) return null;
    if (a.mode !== "prep" && a.mode !== "exam") return null;
    if (typeof a.index !== "number" || !Number.isInteger(a.index) || a.index < 0 || a.index >= n) return null;
    if (!a.answers || typeof a.answers !== "object") return null;
    const answers = a.answers as Record<string, Answer>;
    // Every question before the current one must be locked; nothing after it may be.
    for (let i = 0; i < n; i++) {
      const q = bank.questions[i]!;
      const has = Object.prototype.hasOwnProperty.call(answers, q.id);
      if (i < a.index && (!has || !isAnswerValid(q, answers[q.id]))) return null;
      if (i > a.index && has) return null;
      if (i === a.index && has && !isAnswerValid(q, answers[q.id])) return null;
    }
    const finished = a.finished === true;
    if (finished && (a.index !== n - 1 || !Object.prototype.hasOwnProperty.call(answers, bank.questions[n - 1]!.id))) {
      return null;
    }
    return {
      v: 1,
      bankId: bank.id,
      mode: a.mode,
      index: a.index,
      answers,
      finished,
      startedAt: typeof a.startedAt === "number" ? a.startedAt : Date.now(),
    };
  } catch {
    return null;
  }
}
