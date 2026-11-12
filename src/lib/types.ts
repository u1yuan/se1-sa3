export type QuestionType = "truefalse" | "single" | "multi" | "fill";

export interface Choice {
  id: string;
  text: string;
  correct: boolean;
}

interface BaseQuestion {
  id: string;
  number: number;
  prompt: string;
  instruction: string;
}

export interface ChoiceQuestion extends BaseQuestion {
  type: "truefalse" | "single" | "multi";
  choices: Choice[];
}

export interface FillQuestion extends BaseQuestion {
  type: "fill";
  acceptedAnswers: string[];
}

export type Question = ChoiceQuestion | FillQuestion;

export interface QuestionBank {
  id: string;
  title: string;
  examLabel: string;
  course: string;
  topic: string;
  questionCount: number;
  questions: Question[];
}

/** A student's response. Choice ids for choice questions, raw text for fill-ins. */
export type Answer =
  | { kind: "choice"; choiceIds: string[] }
  | { kind: "fill"; text: string };

export type Mode = "prep" | "exam";
