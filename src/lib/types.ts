export type QuestionType = "truefalse" | "single" | "multi" | "fill" | "matching";

export interface Choice {
  id: string;
  text: string;
  correct: boolean;
}

export interface Exhibit {
  /** Path under /public, e.g. /exhibits/devnet-m5-q9.jpg */
  src: string;
  alt: string;
  width: number;
  height: number;
}

interface BaseQuestion {
  id: string;
  /** 1-based position within the assessment being played (assigned on resolve). */
  number: number;
  prompt: string;
  instruction: string;
  explanation?: string;
  exhibits?: Exhibit[];
  /** Monospace block shown under the prompt (one entry per line). */
  code?: string[];
}

export interface ChoiceQuestion extends BaseQuestion {
  type: "truefalse" | "single" | "multi";
  choices: Choice[];
  /** "Choose two" style hint for multi questions. Grading is still exact-set. */
  choose?: number;
}

export interface FillQuestion extends BaseQuestion {
  type: "fill";
  acceptedAnswers: string[];
}

export interface MatchPrompt {
  id: string;
  text: string;
  /** Must be one of the question's options. */
  answer: string;
}

export interface MatchingQuestion extends BaseQuestion {
  type: "matching";
  prompts: MatchPrompt[];
  /** Dropdown options in source order. Some may be unused; one may fit several prompts. */
  options: string[];
}

export type Question = ChoiceQuestion | FillQuestion | MatchingQuestion;

/** A resolved, playable assessment: catalog metadata plus its questions in fixed order. */
export interface QuestionBank {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  assessmentId: string;
  title: string;
  examLabel: string | null;
  topic: string | null;
  questionCount: number;
  /** Exam-mode countdown in minutes; null = untimed. Prep mode is always untimed. */
  examTimerMinutes: number | null;
  questions: Question[];
}

/** A student's response. */
export type Answer =
  | { kind: "choice"; choiceIds: string[] }
  | { kind: "fill"; text: string }
  /** Matching picks keyed by prompt id. */
  | { kind: "match"; picks: Record<string, string> };

export type Mode = "prep" | "exam";

// ---- Data files ----

export interface CatalogAssessment {
  id: string;
  bankId: string;
  title: string;
  examLabel: string | null;
  topic: string | null;
  questionCount: number;
  examTimerMinutes: number | null;
}

export interface CatalogStudyGuide {
  id: string;
  title: string;
  description: string;
  /** Self-contained HTML under /public/study-guides/<courseId>/<id>.html. */
  artifactPath: string;
}

export interface CatalogCourse {
  id: string;
  code: string;
  title: string;
  assessments: CatalogAssessment[];
  studyGuides: CatalogStudyGuide[];
}

export interface Catalog {
  courses: CatalogCourse[];
}

/** Questions as stored on disk: number is assigned per assessment on resolve. */
export type StoredQuestion = Omit<ChoiceQuestion, "number"> | Omit<FillQuestion, "number"> | Omit<MatchingQuestion, "number">;

export interface QuestionPool {
  id: string;
  title: string;
  questions: (StoredQuestion & { sections?: string[] })[];
}

/** An assessment file either carries its own questions or lists ids from a shared pool. */
export type AssessmentFile =
  | { id: string; questions: StoredQuestion[] }
  | { id: string; pool: string; questionIds: string[] };
