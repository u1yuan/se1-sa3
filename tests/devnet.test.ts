import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { gradeAnswer, isAnswerValid, matchResults, correctAnswerTexts, scoreAttempt, answerTexts } from "../src/lib/grade.ts";
import type { Answer, ChoiceQuestion, MatchingQuestion, Question } from "../src/lib/types.ts";
import { bankFor, loadData } from "./helpers.ts";

const data = loadData();
const pool = data.pools.devnet!;
const all = bankFor("devnet", "all", data);
const q = (id: string): Question => {
  const found = all.questions.find((x) => x.id === id);
  if (!found) throw new Error(`missing ${id}`);
  return found;
};
const choice = (...choiceIds: string[]): Answer => ({ kind: "choice", choiceIds });
const byText = (question: Question, ...texts: string[]): Answer => {
  const cq = question as ChoiceQuestion;
  return choice(...texts.map((t) => { const c = cq.choices.find((x) => x.text === t); if (!c) throw new Error(t); return c.id; }));
};
const match = (question: Question, answers: string[]): Answer => {
  const mq = question as MatchingQuestion;
  return { kind: "match", picks: Object.fromEntries(mq.prompts.map((p, i) => [p.id, answers[i]!])) };
};
const perfect = (question: Question): Answer => {
  if (question.type === "matching") return match(question, question.prompts.map((p) => p.answer));
  if (question.type === "fill") return { kind: "fill", text: question.acceptedAnswers[0]! };
  return choice(...question.choices.filter((c) => c.correct).map((c) => c.id));
};

test("catalog: two courses, five assessments, counts match data", () => {
  assert.deepEqual(data.catalog.courses.map((c) => c.id), ["cs0025", "devnet"]);
  const counts = Object.fromEntries(data.catalog.courses.flatMap((c) => c.assessments.map((a) => [`${c.id}/${a.id}`, a.questionCount])));
  assert.deepEqual(counts, { "cs0025/m3-m6-m7": 20, "devnet/module-5": 18, "devnet/module-6": 15, "devnet/fa-6": 28, "devnet/all": 46 });
  for (const c of data.catalog.courses) for (const a of c.assessments) {
    const b = bankFor(c.id, a.id, data);
    assert.equal(b.questions.length, a.questionCount);
    b.questions.forEach((x, i) => assert.equal(x.number, i + 1));
  }
});

test("timers: DevNet exams are 60 minutes, SoftEng1 is untimed", () => {
  assert.equal(bankFor("cs0025", "m3-m6-m7", data).examTimerMinutes, null);
  for (const id of ["module-5", "module-6", "fa-6", "all"]) assert.equal(bankFor("devnet", id, data).examTimerMinutes, 60);
});

test("pool: 46 unique questions, 36 single / 6 matching / 4 multi, every one keyed and explained", () => {
  assert.equal(pool.questions.length, 46);
  assert.equal(new Set(pool.questions.map((x) => x.id)).size, 46);
  const types: Record<string, number> = {};
  for (const x of pool.questions) types[x.type] = (types[x.type] ?? 0) + 1;
  assert.deepEqual(types, { single: 36, matching: 6, multi: 4 });
  for (const x of all.questions) {
    assert.ok(x.explanation && x.explanation.length > 10, `${x.id} explanation`);
    if (x.type === "single") assert.equal(x.choices.filter((c) => c.correct).length, 1, x.id);
    if (x.type === "multi") assert.equal(x.choices.filter((c) => c.correct).length, x.choose, x.id);
    if (x.type === "matching") for (const p of x.prompts) assert.ok(x.options.includes(p.answer), `${x.id} ${p.text}`);
    assert.equal(gradeAnswer(x, perfect(x)), true, `${x.id} perfect answer grades correct`);
  }
});

test("assessments follow source order filtered by section; All is the whole pool", () => {
  for (const [id, sec] of [["module-5", "m5"], ["module-6", "m6"], ["fa-6", "fa6"]] as const) {
    const expected = pool.questions.filter((x) => x.sections?.includes(sec)).map((x) => x.id);
    assert.deepEqual(bankFor("devnet", id, data).questions.map((x) => x.id), expected);
  }
  assert.deepEqual(all.questions.map((x) => x.id), pool.questions.map((x) => x.id));
});

test("Module 6 questions are shared with FA 6 (one copy, identical keys)", () => {
  const m6 = bankFor("devnet", "module-6", data);
  const fa6 = bankFor("devnet", "fa-6", data);
  const fa6ById = new Map(fa6.questions.map((x) => [x.id, x]));
  assert.equal(m6.questions.length, 15);
  for (const x of m6.questions) {
    const twin = fa6ById.get(x.id);
    assert.ok(twin, `${x.id} also in FA 6`);
    const { number: _a, ...left } = x;
    const { number: _b, ...right } = twin!;
    assert.deepEqual(left, right);
  }
  // Exactly one stored copy per id in the pool file.
  const rawPool = readFileSync(new URL("../data/pools/devnet.json", import.meta.url), "utf8");
  for (const x of m6.questions) assert.equal(rawPool.split(`"id": "${x.id}"`).length - 1, 1, x.id);
});

test("data-only fields do not reach the client bank", () => {
  for (const x of all.questions) for (const k of ["sections", "note", "mergedFrom"]) assert.ok(!(k in x), `${x.id}.${k}`);
});

test("matching: all-or-nothing", () => {
  const m = q("m5_q9");
  assert.equal(gradeAnswer(m, match(m, ["192.0.2.1", "203.0.113.5", "10.130.5.76"])), true);
  const oneOff = match(m, ["192.0.2.1", "203.0.113.5", "10.130.5.1"]);
  assert.equal(isAnswerValid(m, oneOff), true);
  assert.equal(gradeAnswer(m, oneOff), false);
  assert.deepEqual(matchResults(m as MatchingQuestion, oneOff), [true, true, false]);
});

test("matching: incomplete or out-of-list picks are invalid", () => {
  const m = q("m5_q9") as MatchingQuestion;
  const two: Answer = { kind: "match", picks: { [m.prompts[0]!.id]: "192.0.2.1", [m.prompts[1]!.id]: "203.0.113.5" } };
  assert.equal(isAnswerValid(m, two), false);
  assert.equal(gradeAnswer(m, two), false);
  assert.equal(isAnswerValid(m, match(m, ["192.0.2.1", "203.0.113.5", "8.8.8.8"])), false);
  assert.equal(isAnswerValid(m, { kind: "match", picks: { ...Object.fromEntries(m.prompts.map((p) => [p.id, p.answer])), extra: "1" } }), false);
  assert.equal(isAnswerValid(m, choice("x")), false);
  assert.equal(isAnswerValid(m, { kind: "match", picks: {} }), false);
});

test("matching m5_q10: 9 prompts, 8 options, 'Not used' repeats on two prompts", () => {
  const m = q("m5_q10") as MatchingQuestion;
  assert.equal(m.prompts.length, 9);
  assert.equal(m.options.length, 8);
  const key = ["1", "2", "3", "4", "5", "6", "7", "Not used", "Not used"];
  assert.deepEqual(m.prompts.map((p) => p.answer), key);
  assert.equal(gradeAnswer(m, match(m, key)), true);
  // Swapping the two layers that are "Not used" with a real number fails.
  assert.equal(gradeAnswer(m, match(m, ["1", "2", "3", "4", "5", "6", "7", "3", "Not used"])), false);
  // Same option on many prompts is a valid (if wrong) submission.
  assert.equal(isAnswerValid(m, match(m, Array(9).fill("Not used"))), true);
  assert.equal(gradeAnswer(m, match(m, Array(9).fill("Not used"))), false);
});

test("matching fa6_q19: unused distractor 'public' is listed but never correct", () => {
  const m = q("fa6_q19") as MatchingQuestion;
  assert.ok(m.options.includes("public"));
  assert.ok(!m.prompts.some((p) => p.answer === "public"));
  assert.equal(gradeAnswer(m, match(m, ["private", "hybrid", "edge"])), true);
  assert.equal(gradeAnswer(m, match(m, ["public", "hybrid", "edge"])), false);
  assert.deepEqual(correctAnswerTexts(m).map((t) => t.split(" → ")[1]), ["private", "hybrid", "edge"]);
});

test("fa6_q15 keeps the FA6 environment → description orientation", () => {
  const m = q("fa6_q15") as MatchingQuestion;
  assert.deepEqual(m.prompts.map((p) => p.text), ["development", "testing", "staging", "production"]);
  assert.equal(m.prompts[0]!.answer, "where coding takes place");
});

test("matching answerTexts shows prompt → pick", () => {
  const m = q("fa6_q19");
  assert.deepEqual(answerTexts(m, match(m, ["public", "hybrid", "edge"]))[0]!.endsWith("→ public"), true);
});

test("multi: exact set (m5_q2 network + transport)", () => {
  const m = q("m5_q2");
  assert.equal(m.instruction, "Select all that apply · choose two.");
  assert.equal(gradeAnswer(m, byText(m, "network", "transport")), true);
  assert.equal(gradeAnswer(m, byText(m, "transport", "network")), true);
  assert.equal(gradeAnswer(m, byText(m, "network")), false);
  assert.equal(gradeAnswer(m, byText(m, "network", "transport", "session")), false);
  assert.equal(isAnswerValid(m, choice()), false);
  const three = q("fa6_q23") as ChoiceQuestion;
  assert.equal(three.choose, 3);
  assert.equal(gradeAnswer(three, perfect(three)), true);
});

test("m5_q12 keeps the marked key 209.165.202.129 and the source typo choice", () => {
  const m = q("m5_q12") as ChoiceQuestion;
  assert.deepEqual(m.choices.filter((c) => c.correct).map((c) => c.text), ["209.165.202.129"]);
  assert.ok(m.choices.some((c) => c.text === "192.168.1. 10"));
  assert.equal(gradeAnswer(m, byText(m, "209.165.202.129")), true);
  assert.equal(gradeAnswer(m, byText(m, "203.0.113.2")), false);
});

test("exhibits are files, not data URIs; m5_q13 has a code block", () => {
  const raw = readFileSync(new URL("../data/pools/devnet.json", import.meta.url), "utf8");
  assert.ok(!raw.includes("data:image"));
  for (const id of ["m5_q9", "m5_q12", "m5_q16"]) {
    const ex = q(id).exhibits;
    assert.equal(ex?.length, 1, id);
    assert.ok(statSync(new URL(`../public${ex![0]!.src}`, import.meta.url)).size > 50_000);
    assert.ok(ex![0]!.alt.length > 20);
  }
  assert.deepEqual(q("m5_q13").code, ["D 10.1.1.0/24 [90/2170112] via 209.165.200.226, 00:00:05, Serial0/0/0"]);
});

test("scoreAttempt over All: perfect 46/46, empty 0/46", () => {
  const answers = Object.fromEntries(all.questions.map((x) => [x.id, perfect(x)]));
  assert.deepEqual(scoreAttempt(all.questions, answers), { correct: 46, total: 46, percent: 100 });
  assert.deepEqual(scoreAttempt(all.questions, {}), { correct: 0, total: 46, percent: 0 });
});
