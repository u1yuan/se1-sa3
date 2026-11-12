"use client";

import { useCallback, useEffect, useState } from "react";
import type { Mode, QuestionBank } from "@/lib/types";
import type { Answer } from "@/lib/types";
import { advance, lockAnswer, loadAttempt, newAttempt, saveAttempt, type Attempt } from "@/lib/attempt";
import StartScreen from "./StartScreen";
import QuestionView from "./QuestionView";
import Results from "./Results";

export default function Reviewer({ bank }: { bank: QuestionBank }) {
  const [hydrated, setHydrated] = useState(false);
  const [attempt, setAttempt] = useState<Attempt | null>(null);

  // Restore an in-progress attempt after a refresh.
  useEffect(() => {
    setAttempt(loadAttempt(bank));
    setHydrated(true);
  }, [bank]);

  const update = useCallback((next: Attempt | null) => {
    saveAttempt(next);
    setAttempt(next);
  }, []);

  // Keep the top of each new screen in view.
  const screenKey = !attempt ? "start" : attempt.finished ? "results" : `q-${attempt.index}`;
  useEffect(() => {
    if (hydrated) window.scrollTo({ top: 0 });
  }, [screenKey, hydrated]);

  if (!hydrated) {
    return <main className="sheet loading" aria-busy="true"><p role="status">Restoring your study session...</p></main>;
  }

  if (!attempt) {
    return <StartScreen bank={bank} onStart={(mode: Mode) => update(newAttempt(bank, mode))} />;
  }

  if (attempt.finished) {
    return <Results bank={bank} attempt={attempt} onRestart={() => update(null)} />;
  }

  const question = bank.questions[attempt.index]!;
  return (
    <QuestionView
      key={question.id}
      bank={bank}
      attempt={attempt}
      question={question}
      onSubmit={(answer: Answer) => update(lockAnswer(bank, attempt, answer))}
      onNext={() => update(advance(bank, attempt))}
      onQuit={() => {
        if (window.confirm("Discard this attempt? Your submitted answers will be lost and you'll return to mode selection.")) {
          update(null);
        }
      }}
    />
  );
}
