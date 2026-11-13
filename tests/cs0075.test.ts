import { test } from "node:test";
import assert from "node:assert/strict";
import { gradeAnswer, isAnswerValid, scoreAttempt } from "../src/lib/grade.ts";
import { newAttempt, timerMs } from "../src/lib/attempt.ts";
import type { Answer } from "../src/lib/types.ts";
import { bankFor } from "./helpers.ts";

const bank = bankFor("cs0075", "sa-3-mock-exam");

test("CS0075: metadata, 60 unique source IDs in fixed order, and type counts", () => {
  assert.equal(bank.id, "cs0075-sa3-mock-exam");
  assert.equal(bank.courseCode, "CS0075");
  assert.equal(bank.courseTitle, "Machine Learning and Algorithms");
  assert.equal(bank.title, "SA 3 Mock Exam");
  assert.equal(bank.topic, "Decision Trees, Random Forests, Gradient Boosting, and SVM");
  assert.equal(bank.questionCount, 60);
  assert.equal(new Set(bank.questions.map((q) => q.id)).size, 60);
  assert.deepEqual(bank.questions.map((q) => q.id), ["DT", "RF", "GB", "SVM"].flatMap(
    (topic) => Array.from({ length: 15 }, (_, i) => `${topic}-${String(i + 1).padStart(2, "0")}`),
  ));
  const counts: Record<string, number> = {};
  bank.questions.forEach((q, i) => {
    assert.equal(q.number, i + 1);
    counts[q.type] = (counts[q.type] ?? 0) + 1;
    assert.ok(q.prompt.length > 0);
    assert.match(q.explanation!, /\n\nSources:\n.+(?:page|cell) \d+:/);
  });
  assert.deepEqual(counts, { truefalse: 24, single: 21, fill: 15 });
});

test("CS0075: every choice key is valid, unique, and grades only its marked answer", () => {
  for (const q of bank.questions) {
    if (q.type !== "single" && q.type !== "truefalse") continue;
    assert.equal(new Set(q.choices.map((c) => c.id)).size, q.choices.length, q.id);
    assert.equal(q.choices.filter((c) => c.correct).length, 1, q.id);
    if (q.type === "truefalse") assert.deepEqual(q.choices.map((c) => [c.id, c.text]), [["t", "True"], ["f", "False"]]);
    for (const c of q.choices) {
      const answer: Answer = { kind: "choice", choiceIds: [c.id] };
      assert.ok(isAnswerValid(q, answer), q.id);
      assert.equal(gradeAnswer(q, answer), c.correct, `${q.id}/${c.id}`);
    }
  }
});

test("CS0075: all accepted blanks ignore case and whitespace but require spelling and punctuation", () => {
  for (const q of bank.questions) {
    if (q.type !== "fill") continue;
    assert.ok(q.acceptedAnswers.length > 0, q.id);
    assert.match(q.instruction, /case.*whitespace/);
    assert.match(q.instruction, /spelling, underscores, hyphens and punctuation/);
    for (const text of q.acceptedAnswers) {
      const normalized = ` \t${text.toUpperCase().replace(/ /g, " \n\t ")}\n `;
      assert.ok(gradeAnswer(q, { kind: "fill", text: normalized }), q.id);
      assert.equal(gradeAnswer(q, { kind: "fill", text: text + "x" }), false, q.id);
      const missingPunctuation = text.replace(/[_.-]/g, "");
      if (missingPunctuation !== text) assert.equal(gradeAnswer(q, { kind: "fill", text: missingPunctuation }), false, q.id);
    }
  }
});

test("CS0075: ten code excerpts retain line breaks and indentation outside the prose", () => {
  const codeQuestions = bank.questions.filter((q) => q.code);
  assert.deepEqual(codeQuestions.map((q) => q.id), ["DT-13", "DT-14", "DT-15", "RF-13", "RF-14", "RF-15", "GB-12", "GB-13", "GB-14", "GB-15"]);
  assert.deepEqual(codeQuestions.find((q) => q.id === "DT-14")!.code, ["model = (", "  DecisionTreeClassifier(", "    ____=20", "  )", ")"]);
  assert.deepEqual(codeQuestions.find((q) => q.id === "RF-15")!.code, ["grid_search = ____(", "  estimator=rf,", "  param_grid=params, cv=4,", "  n_jobs=-1, verbose=1,", "  scoring=\"accuracy\"", ")"]);
  for (const q of codeQuestions) assert.ok(!q.prompt.includes("\n\n"), q.id);
});

test("CS0075: perfect answers grade 60/60; Prep untimed and Exam 60 minutes", () => {
  const answers: Record<string, Answer> = {};
  for (const q of bank.questions) {
    if (q.type === "fill") answers[q.id] = { kind: "fill", text: q.acceptedAnswers[0]! };
    else if (q.type !== "matching") answers[q.id] = { kind: "choice", choiceIds: q.choices.filter((c) => c.correct).map((c) => c.id) };
  }
  assert.deepEqual(scoreAttempt(bank.questions, answers), { correct: 60, total: 60, percent: 100 });
  assert.equal(timerMs(bank, "prep"), null);
  assert.equal(timerMs(bank, "exam"), 60 * 60_000);
  assert.equal(newAttempt(bank, "prep", 1_000).endsAt, null);
  assert.equal(newAttempt(bank, "exam", 1_000).endsAt, 3_601_000);
});
