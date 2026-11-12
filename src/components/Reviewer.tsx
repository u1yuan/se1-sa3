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
  const [backNotice, setBackNotice] = useState(0);

  // Restore an in-progress attempt after a refresh.
  useEffect(() => {
    setAttempt(loadAttempt(bank));
    setHydrated(true);
  }, [bank]);

  const update = useCallback((next: Attempt | null) => {
    saveAttempt(next);
    setAttempt(next);
  }, []);

  const active = !!attempt && !attempt.finished;

  // Trap the browser Back button while an attempt is running. The page never
  // changes URL per question, so Back can't reopen anything; we also re-push a
  // guard entry so Back doesn't silently leave the attempt either.
  useEffect(() => {
    if (!active) return;
    const guard = { examReviewerGuard: true };
    if (!(window.history.state && window.history.state.examReviewerGuard)) {
      window.history.pushState(guard, "", window.location.href);
    }
    const onPop = () => {
      window.history.pushState(guard, "", window.location.href);
      setBackNotice((n) => n + 1);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [active]);

  useEffect(() => {
    if (!backNotice) return;
    const t = window.setTimeout(() => setBackNotice(0), 4000);
    return () => window.clearTimeout(t);
  }, [backNotice]);

  // Keep the top of each new screen in view.
  const screenKey = !attempt ? "start" : attempt.finished ? "results" : `q-${attempt.index}`;
  useEffect(() => {
    if (hydrated) window.scrollTo({ top: 0 });
  }, [screenKey, hydrated]);

  if (!hydrated) {
    return <main className="sheet" aria-busy="true" />;
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
      backNotice={backNotice > 0}
      onSubmit={(answer: Answer) => update(lockAnswer(bank, attempt, answer))}
      onNext={() => update(advance(bank, attempt))}
      onQuit={() => {
        if (window.confirm("Discard this attempt? Your locked answers will be lost and you'll return to mode select.")) {
          update(null);
        }
      }}
    />
  );
}
