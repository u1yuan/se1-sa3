import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { newAttempt, storageKey, timerMs, validateAttempt } from "../src/lib/attempt.ts";
import { gradeAnswer, scoreAttempt } from "../src/lib/grade.ts";
import type { Answer } from "../src/lib/types.ts";
import { bankFor, loadData } from "./helpers.ts";

const sourcePath = "../public/reviewers/cs0075-sa3-concepts-hyperparameters-reviewer";
const source = JSON.parse(readFileSync(new URL(`${sourcePath}.json`, import.meta.url), "utf8")) as {
  questions: {
    id: string; type: "mcq" | "true_false" | "blank"; prompt: string;
    answer: string | string[]; explanation: string; sources: string[];
    choices?: { id: string; text: string }[];
  }[];
};
const bank = bankFor("cs0075", "sa3-concepts-hyperparameters");

test("Concepts: registered as the third native CS0075 assessment with independent state", () => {
  const course = loadData().catalog.courses.find((c) => c.id === "cs0075")!;
  assert.equal(course.assessments[2]!.id, bank.assessmentId);
  assert.equal(bank.id, "cs0075-sa3-concepts-hyperparameters");
  assert.equal(bank.title, "SA 3 Concepts & Hyperparameters");
  assert.equal(bank.questionCount, 50);
  assert.equal(timerMs(bank, "prep"), null);
  assert.equal(timerMs(bank, "exam"), 60 * 60_000);
  const attempt = newAttempt(bank, "exam", 1_000);
  assert.equal(attempt.endsAt, 3_601_000);
  assert.deepEqual(validateAttempt(bank, attempt), attempt);
  for (const id of ["sa-3-mock-exam", "sa3-mock-set-b"]) {
    const other = bankFor("cs0075", id);
    assert.notEqual(storageKey(bank.id), storageKey(other.id));
    assert.equal(validateAttempt(other, attempt), null);
    assert.equal(validateAttempt(bank, newAttempt(other, "exam")), null);
  }
});

test("Concepts: every question, choice, key, accepted answer, source, and code line matches the original", () => {
  const html = readFileSync(new URL(`${sourcePath}.html`, import.meta.url), "utf8");
  assert.deepEqual(JSON.parse(html.match(/id="reviewer-data">(.*?)<\/script>/s)![1]!).bank, source);
  assert.deepEqual(bank.questions.map((q) => q.id), source.questions.map((q) => q.id));
  assert.equal(new Set(bank.questions.map((q) => q.id)).size, 50);
  const counts: Record<string, number> = {};
  for (const [i, q] of bank.questions.entries()) {
    const original = source.questions[i]!;
    counts[q.type] = (counts[q.type] ?? 0) + 1;
    assert.equal(q.number, i + 1);
    assert.equal(q.type, { mcq: "single", true_false: "truefalse", blank: "fill" }[original.type]);
    assert.equal(q.code ? `${q.prompt}\n\n${q.code.join("\n")}` : q.prompt, original.prompt, q.id);
    assert.equal(q.explanation, `${original.explanation}\n\nSources:\n${original.sources.join("\n")}`, q.id);
    if (q.type === "fill") assert.deepEqual(q.acceptedAnswers, original.answer, q.id);
    else if (q.type !== "matching") {
      assert.deepEqual(q.choices, original.choices!.map((c) => ({ ...c, correct: c.id === original.answer })), q.id);
      assert.equal(q.choices.filter((c) => c.correct).length, 1, q.id);
    }
  }
  assert.deepEqual(counts, { single: 20, truefalse: 10, fill: 20 });
  assert.equal(bank.questions.filter((q) => q.code).length, 6);
});

test("Concepts: all accepted answers grade correctly, punctuation stays significant, perfect run scores 50/50", () => {
  const answers: Record<string, Answer> = {};
  for (const q of bank.questions) {
    if (q.type === "fill") {
      for (const text of q.acceptedAnswers) {
        assert.ok(gradeAnswer(q, { kind: "fill", text: `  ${text.toUpperCase().replace(/ /g, " \n ")}  ` }), q.id);
        assert.equal(gradeAnswer(q, { kind: "fill", text: `${text}.` }), false, q.id);
      }
      answers[q.id] = { kind: "fill", text: q.acceptedAnswers[0]! };
    } else if (q.type !== "matching") {
      for (const c of q.choices) assert.equal(gradeAnswer(q, { kind: "choice", choiceIds: [c.id] }), c.correct, q.id);
      answers[q.id] = { kind: "choice", choiceIds: q.choices.filter((c) => c.correct).map((c) => c.id) };
    }
  }
  assert.deepEqual(scoreAttempt(bank.questions, answers), { correct: 50, total: 50, percent: 100 });
});
