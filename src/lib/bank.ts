import raw from "../../data/questions.json";
import type { QuestionBank } from "./types";

// data/questions.json is the single source of truth for this bank.
export const bank = raw as QuestionBank;
