import { readFileSync } from "node:fs";
import type { AssessmentFile, Catalog, QuestionBank, QuestionPool } from "../src/lib/types.ts";
import { findAssessment, findCourse, resolveBank, type DataSet } from "../src/lib/resolve.ts";

const read = <T>(rel: string): T => JSON.parse(readFileSync(new URL(`../data/${rel}`, import.meta.url), "utf8")) as T;

export function loadData(): DataSet {
  const catalog = read<Catalog>("catalog.json");
  const assessments: Record<string, AssessmentFile> = {};
  for (const c of catalog.courses) for (const a of c.assessments) assessments[a.bankId] = read<AssessmentFile>(`assessments/${a.bankId}.json`);
  return { catalog, assessments, pools: { devnet: read<QuestionPool>("pools/devnet.json") } };
}

export function bankFor(courseId: string, assessmentId: string, data: DataSet = loadData()): QuestionBank {
  const course = findCourse(data.catalog, courseId);
  const a = course && findAssessment(course, assessmentId);
  if (!course || !a) throw new Error(`no ${courseId}/${assessmentId}`);
  return resolveBank(data, course, a);
}
