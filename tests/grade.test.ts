import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  normalizeFill,
  isAnswerValid,
  gradeAnswer,
  scoreAttempt,
  correctAnswerTexts,
} from "../src/lib/grade.ts";
import type { Answer, ChoiceQuestion, FillQuestion, Question } from "../src/lib/types.ts";

const SOFTENG1 = new URL("../data/assessments/cs0025-m3-m6-m7.json", import.meta.url);
const bank: { id: string; questions: Question[] } = JSON.parse(readFileSync(SOFTENG1, "utf8"));
const byId = (id: string) => {
  const q = bank.questions.find((x) => x.id === id);
  if (!q) throw new Error(`missing ${id}`);
  return q;
};
const choice = (...choiceIds: string[]): Answer => ({ kind: "choice", choiceIds });
const fill = (text: string): Answer => ({ kind: "fill", text });
const correctIds = (q: Question) => (q as ChoiceQuestion).choices.filter((c) => c.correct).map((c) => c.id);
const wrongIds = (q: Question) => (q as ChoiceQuestion).choices.filter((c) => !c.correct).map((c) => c.id);

test("bank shape: 20 questions in order, no historical score", () => {
  assert.equal(bank.questions.length, 20);
  bank.questions.forEach((q, i) => assert.equal(q.number, i + 1));
  const raw = readFileSync(SOFTENG1, "utf8");
  assert.ok(!/17\s*\/\s*20/.test(raw));
});

test("normalizeFill trims, collapses whitespace, uppercases", () => {
  assert.equal(normalizeFill("  state   machine\tdiagram \n"), "STATE MACHINE DIAGRAM");
  assert.equal(normalizeFill("   "), "");
});

test("single choice: correct and incorrect", () => {
  const q = byId("q2");
  assert.equal(gradeAnswer(q, choice(...correctIds(q))), true);
  assert.equal(gradeAnswer(q, choice(wrongIds(q)[0]!)), false);
});

test("true/false grades by choice id", () => {
  const q = byId("q1");
  assert.equal(gradeAnswer(q, choice(...correctIds(q))), true);
  assert.equal(gradeAnswer(q, choice(...wrongIds(q))), false);
});

test("single choice with two picks is invalid and wrong", () => {
  const q = byId("q2");
  const two = choice(correctIds(q)[0]!, wrongIds(q)[0]!);
  assert.equal(isAnswerValid(q, two), false);
  assert.equal(gradeAnswer(q, two), false);
});

test("multi: exact set match only", () => {
  const q = byId("q18");
  const right = correctIds(q);
  assert.equal(right.length, 3);
  assert.equal(gradeAnswer(q, choice(...right)), true);
  assert.equal(gradeAnswer(q, choice(...[...right].reverse())), true, "order does not matter");
  assert.equal(gradeAnswer(q, choice(...right.slice(0, 2))), false, "missing one");
  assert.equal(gradeAnswer(q, choice(...right, ...wrongIds(q))), false, "extra pick");
  assert.equal(gradeAnswer(q, choice(...wrongIds(q))), false);
});

test("q18 key: statements 2-4 correct, statement 1 wrong", () => {
  const q = byId("q18") as ChoiceQuestion;
  assert.deepEqual(q.choices.map((c) => c.correct), [false, true, true, true]);
});

test("q10 key is Flexibility", () => {
  const q = byId("q10") as ChoiceQuestion;
  assert.deepEqual(q.choices.filter((c) => c.correct).map((c) => c.text), ["Flexibility"]);
});

test("fill: case and whitespace normalization", () => {
  const q = byId("q14");
  assert.equal(gradeAnswer(q, fill("use case diagram")), true);
  assert.equal(gradeAnswer(q, fill("  Use   Case\tDiagram  ")), true);
  assert.equal(gradeAnswer(q, fill("USECASE DIAGRAM")), false);
});

test("q8 accepts both STATE MACHINE DIAGRAM and STATECHART DIAGRAM, nothing else", () => {
  const q = byId("q8") as FillQuestion;
  assert.deepEqual(correctAnswerTexts(q), ["STATE MACHINE DIAGRAM", "STATECHART DIAGRAM"]);
  assert.equal(gradeAnswer(q, fill("STATE MACHINE DIAGRAM")), true);
  assert.equal(gradeAnswer(q, fill("statechart diagram")), true);
  assert.equal(gradeAnswer(q, fill("STATE DIAGRAM")), false);
  assert.equal(gradeAnswer(q, fill("COMPONENT DIAGRAM")), false);
});

test("empty answers are invalid and wrong", () => {
  assert.equal(isAnswerValid(byId("q8"), fill("   ")), false);
  assert.equal(gradeAnswer(byId("q8"), fill("")), false);
  assert.equal(isAnswerValid(byId("q16"), choice()), false);
  assert.equal(isAnswerValid(byId("q2"), choice()), false);
  assert.equal(isAnswerValid(byId("q2"), null), false);
  assert.equal(gradeAnswer(byId("q2"), undefined), false);
});

test("wrong answer kind and unknown ids are rejected", () => {
  assert.equal(isAnswerValid(byId("q8"), choice("q2-6848")), false);
  assert.equal(isAnswerValid(byId("q2"), fill("anything")), false);
  assert.equal(isAnswerValid(byId("q2"), choice("not-a-choice")), false);
});

test("scoreAttempt: perfect run is 20/20, empty run is 0/20", () => {
  const perfect: Record<string, Answer> = {};
  for (const q of bank.questions) {
    perfect[q.id] = q.type === "fill" ? fill(q.acceptedAnswers[0]!) : choice(...correctIds(q));
  }
  assert.deepEqual(scoreAttempt(bank.questions, perfect), { correct: 20, total: 20, percent: 100 });
  assert.deepEqual(scoreAttempt(bank.questions, {}), { correct: 0, total: 20, percent: 0 });
  const { q1: _drop, ...nineteen } = perfect;
  assert.deepEqual(scoreAttempt(bank.questions, nineteen), { correct: 19, total: 20, percent: 95 });
});
