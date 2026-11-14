// Server-side data access. Only the resolved bank for the open assessment is
// passed to the client; the catalog pages only need metadata.
import catalogJson from "../../data/catalog.json";
import softeng1 from "../../data/assessments/cs0025-m3-m6-m7.json";
import mlSa3 from "../../data/assessments/cs0075-sa3-mock-exam.json";
import mlSa3B from "../../data/assessments/cs0075-sa3-mock-set-b.json";
import mlConcepts from "../../data/assessments/cs0075-sa3-concepts-hyperparameters.json";
import devnetM5 from "../../data/assessments/devnet-m5.json";
import devnetM6 from "../../data/assessments/devnet-m6.json";
import devnetFa6 from "../../data/assessments/devnet-fa6.json";
import devnetAll from "../../data/assessments/devnet-all.json";
import devnetPool from "../../data/pools/devnet.json";
import type { AssessmentFile, Catalog, QuestionBank, QuestionPool } from "./types.ts";
import { findAssessment, findCourse, resolveBank, type DataSet } from "./resolve.ts";

const files = [softeng1, devnetM5, devnetM6, devnetFa6, devnetAll, mlSa3, mlSa3B, mlConcepts] as unknown as AssessmentFile[];

const data: DataSet = {
  catalog: catalogJson as Catalog,
  assessments: Object.fromEntries(files.map((f) => [f.id, f])),
  pools: { devnet: devnetPool as unknown as QuestionPool },
};

export const catalog: Catalog = data.catalog;

export function getCourse(courseId: string) {
  return findCourse(data.catalog, courseId);
}

export function getBank(courseId: string, assessmentId: string): QuestionBank | undefined {
  const course = findCourse(data.catalog, courseId);
  const a = course && findAssessment(course, assessmentId);
  return course && a ? resolveBank(data, course, a) : undefined;
}
