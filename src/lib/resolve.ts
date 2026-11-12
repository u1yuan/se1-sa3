// Pure catalog resolution: turns catalog metadata + assessment files + pools
// into playable banks. No JSON imports here so tests can feed it from disk.
import type { AssessmentFile, Catalog, CatalogAssessment, CatalogCourse, Question, QuestionBank, QuestionPool, StoredQuestion } from "./types.ts";

export interface DataSet {
  catalog: Catalog;
  assessments: Record<string, AssessmentFile>;
  pools: Record<string, QuestionPool>;
}

function strip(q: StoredQuestion & { sections?: string[]; mergedFrom?: string; note?: string }): StoredQuestion {
  // Data-only fields (sections, merge notes, key flags) never reach the client.
  const { sections: _s, mergedFrom: _m, note: _n, ...rest } = q;
  return rest as StoredQuestion;
}

export function resolveQuestions(file: AssessmentFile, pools: Record<string, QuestionPool>): Question[] {
  let stored: StoredQuestion[];
  if ("questions" in file) {
    stored = file.questions;
  } else {
    const pool = pools[file.pool];
    if (!pool) throw new Error(`assessment ${file.id}: unknown pool ${file.pool}`);
    const byId = new Map(pool.questions.map((q) => [q.id, q]));
    if (new Set(file.questionIds).size !== file.questionIds.length) throw new Error(`assessment ${file.id}: duplicate question ids`);
    stored = file.questionIds.map((id) => {
      const q = byId.get(id);
      if (!q) throw new Error(`assessment ${file.id}: unknown question ${id}`);
      return q;
    });
  }
  return stored.map((q, i) => ({ ...strip(q), number: i + 1 }) as Question);
}

export function resolveBank(data: DataSet, course: CatalogCourse, a: CatalogAssessment): QuestionBank {
  const file = data.assessments[a.bankId];
  if (!file) throw new Error(`missing assessment file ${a.bankId}`);
  if (file.id !== a.bankId) throw new Error(`assessment file id ${file.id} does not match ${a.bankId}`);
  const questions = resolveQuestions(file, data.pools);
  if (questions.length !== a.questionCount) {
    throw new Error(`${a.bankId}: catalog says ${a.questionCount} questions, data has ${questions.length}`);
  }
  return {
    id: a.bankId,
    courseId: course.id,
    courseCode: course.code,
    courseTitle: course.title,
    assessmentId: a.id,
    title: a.title,
    examLabel: a.examLabel,
    topic: a.topic,
    questionCount: a.questionCount,
    examTimerMinutes: a.examTimerMinutes,
    questions,
  };
}

export function findCourse(catalog: Catalog, courseId: string): CatalogCourse | undefined {
  return catalog.courses.find((c) => c.id === courseId);
}

export function findAssessment(course: CatalogCourse, assessmentId: string): CatalogAssessment | undefined {
  return course.assessments.find((a) => a.id === assessmentId);
}
