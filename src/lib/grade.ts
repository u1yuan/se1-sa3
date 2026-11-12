// Pure grading logic. No React, no DOM, no imports at runtime, so it can be
// unit-tested directly with `node --test`.
import type { Answer, Question } from "./types";

/** Trim, collapse internal whitespace, uppercase. */
export function normalizeFill(text: string): string {
  return text.trim().replace(/\s+/g, " ").toUpperCase();
}

/** Whether an answer is complete enough to submit for this question. */
export function isAnswerValid(question: Question, answer: Answer | null | undefined): boolean {
  if (!answer) return false;
  if (question.type === "fill") {
    return answer.kind === "fill" && normalizeFill(answer.text).length > 0;
  }
  if (answer.kind !== "choice") return false;
  const known = new Set(question.choices.map((c) => c.id));
  const ids = new Set(answer.choiceIds);
  if (ids.size !== answer.choiceIds.length) return false; // no duplicates
  if (![...ids].every((id) => known.has(id))) return false;
  if (question.type === "multi") return ids.size >= 1;
  return ids.size === 1; // single / truefalse
}

/** Grade one answer. Invalid answers are always incorrect. */
export function gradeAnswer(question: Question, answer: Answer | null | undefined): boolean {
  if (!answer || !isAnswerValid(question, answer)) return false;
  if (question.type === "fill") {
    if (answer.kind !== "fill") return false;
    const given = normalizeFill(answer.text);
    return question.acceptedAnswers.some((a) => normalizeFill(a) === given);
  }
  if (answer.kind !== "choice") return false;
  const correct = new Set(question.choices.filter((c) => c.correct).map((c) => c.id));
  const picked = new Set(answer.choiceIds);
  if (picked.size !== correct.size) return false;
  for (const id of picked) if (!correct.has(id)) return false;
  return true;
}

/** Human-readable correct answer(s). */
export function correctAnswerTexts(question: Question): string[] {
  if (question.type === "fill") return [...question.acceptedAnswers];
  return question.choices.filter((c) => c.correct).map((c) => c.text);
}

/** Human-readable version of what the student gave. */
export function answerTexts(question: Question, answer: Answer | null | undefined): string[] {
  if (!answer) return [];
  if (question.type === "fill") {
    return answer.kind === "fill" ? [normalizeFill(answer.text)] : [];
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
