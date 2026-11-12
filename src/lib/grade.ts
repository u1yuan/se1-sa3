// Pure grading logic. No React, no DOM, no runtime imports, so it can be
// unit-tested directly with `node --test`.
import type { Answer, MatchingQuestion, Question } from "./types.ts";

const has = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);

/** Trim, collapse internal whitespace, uppercase. */
export function normalizeFill(text: string): string {
  return text.trim().replace(/\s+/g, " ").toUpperCase();
}

/** Whether an answer is complete enough to submit for this question. */
export function isAnswerValid(question: Question, answer: Answer | null | undefined): boolean {
  if (!answer) return false;
  if (question.type === "fill") {
    return answer.kind === "fill" && typeof answer.text === "string" && normalizeFill(answer.text).length > 0;
  }
  if (question.type === "matching") {
    if (answer.kind !== "match" || !answer.picks || typeof answer.picks !== "object") return false;
    const keys = Object.keys(answer.picks);
    if (keys.length !== question.prompts.length) return false;
    const options = new Set(question.options);
    // Every prompt needs a pick from the option list. Options are not exclusive.
    return question.prompts.every((p) => has(answer.picks, p.id) && options.has(answer.picks[p.id]!));
  }
  if (answer.kind !== "choice" || !Array.isArray(answer.choiceIds)) return false;
  const known = new Set(question.choices.map((c) => c.id));
  const ids = new Set(answer.choiceIds);
  if (ids.size !== answer.choiceIds.length) return false; // no duplicates
  if (![...ids].every((id) => known.has(id))) return false;
  if (question.type === "multi") return ids.size >= 1;
  return ids.size === 1; // single / truefalse
}

/** Per-prompt correctness for a matching answer (false where nothing valid was picked). */
export function matchResults(question: MatchingQuestion, answer: Answer | null | undefined): boolean[] {
  const picks = answer?.kind === "match" && answer.picks ? answer.picks : {};
  return question.prompts.map((p) => has(picks, p.id) && picks[p.id] === p.answer);
}

/** Grade one answer. Invalid or missing answers are always incorrect. */
export function gradeAnswer(question: Question, answer: Answer | null | undefined): boolean {
  if (!answer || !isAnswerValid(question, answer)) return false;
  if (question.type === "fill") {
    if (answer.kind !== "fill") return false;
    const given = normalizeFill(answer.text);
    return question.acceptedAnswers.some((a) => normalizeFill(a) === given);
  }
  if (question.type === "matching") {
    // All-or-nothing: every prompt must match.
    return matchResults(question, answer).every(Boolean);
  }
  if (answer.kind !== "choice") return false;
  const correct = new Set(question.choices.filter((c) => c.correct).map((c) => c.id));
  const picked = new Set(answer.choiceIds);
  if (picked.size !== correct.size) return false;
  for (const id of picked) if (!correct.has(id)) return false;
  return true;
}

/** Human-readable correct answer(s). Matching gives "prompt → answer" lines. */
export function correctAnswerTexts(question: Question): string[] {
  if (question.type === "fill") return [...question.acceptedAnswers];
  if (question.type === "matching") return question.prompts.map((p) => `${p.text} → ${p.answer}`);
  return question.choices.filter((c) => c.correct).map((c) => c.text);
}

/** Human-readable version of what the student gave. */
export function answerTexts(question: Question, answer: Answer | null | undefined): string[] {
  if (!answer) return [];
  if (question.type === "fill") {
    return answer.kind === "fill" ? [normalizeFill(answer.text)] : [];
  }
  if (question.type === "matching") {
    if (answer.kind !== "match" || !answer.picks) return [];
    return question.prompts.map((p) => `${p.text} → ${has(answer.picks, p.id) ? answer.picks[p.id] : "—"}`);
  }
  if (answer.kind !== "choice") return [];
  const ids = new Set(answer.choiceIds);
  return question.choices.filter((c) => ids.has(c.id)).map((c) => c.text);
}

export function scoreAttempt(
  questions: Question[],
  answers: Record<string, Answer | undefined>,
): { correct: number; total: number; percent: number } {
  const total = questions.length;
  const correct = questions.filter((q) => gradeAnswer(q, answers[q.id])).length;
  const percent = total === 0 ? 0 : Math.round((correct / total) * 1000) / 10;
  return { correct, total, percent };
}
