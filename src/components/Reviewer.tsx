"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Answer, Mode, QuestionBank } from "@/lib/types";
import {
  advance, expireIfDue, lockAnswer, loadAttempt, newAttempt, remainingMs, saveAttempt, type Attempt,
} from "@/lib/attempt";
import StartScreen from "./StartScreen";
import QuestionView from "./QuestionView";
import Results from "./Results";
import StatusBar from "./StatusBar";

export default function Reviewer({ bank }: { bank: QuestionBank }) {
  const [hydrated, setHydrated] = useState(false);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [backNotice, setBackNotice] = useState(0);
  const [resumed, setResumed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  // The current question's unsubmitted pick, so a timeout can lock it.
  const draftRef = useRef<Answer | null>(null);

  const update = useCallback(
    (next: Attempt | null) => {
      saveAttempt(bank.id, next);
      setAttempt(next);
    },
    [bank.id],
  );

  // Restore this assessment's attempt after a refresh or navigation back here.
  useEffect(() => {
    const t = Date.now();
    const loaded = loadAttempt(bank);
    const settled = loaded ? expireIfDue(bank, loaded, t) : null;
    if (settled !== loaded) saveAttempt(bank.id, settled);
    setAttempt(settled);
    setResumed(!!settled && !settled.finished && (settled.index > 0 || Object.keys(settled.answers).length > 0));
    setNow(t);
    setHydrated(true);
  }, [bank]);

  const active = !!attempt && !attempt.finished;
  const timed = active && attempt.endsAt !== null;

  // Countdown tick. endsAt is absolute, so throttled background tabs stay accurate.
  useEffect(() => {
    if (!timed) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [timed]);

  useEffect(() => {
    if (!attempt || attempt.finished || attempt.endsAt === null || now < attempt.endsAt) return;
    update(expireIfDue(bank, attempt, now, draftRef.current));
  }, [attempt, now, bank, update]);

  // Trap the browser Back button while an attempt is running. The URL never
  // changes per question, so Back can't reopen anything; re-pushing a guard
  // entry keeps Back from silently leaving the attempt too.
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

  useEffect(() => {
    if (!resumed) return;
    const t = window.setTimeout(() => setResumed(false), 6000);
    return () => window.clearTimeout(t);
  }, [resumed]);

  const screenKey = !attempt ? "start" : attempt.finished ? "results" : `q-${attempt.index}`;
  useEffect(() => {
    draftRef.current = null;
    if (hydrated) window.scrollTo({ top: 0 });
  }, [screenKey, hydrated]);

  if (!hydrated) {
    return (
      <div className="page" aria-busy="true">
        <StatusBar crumbs={[{ label: bank.courseCode }, { label: bank.title }]} locked />
      </div>
    );
  }

  if (!attempt) {
    return (
      <StartScreen
        bank={bank}
        onStart={(mode: Mode) => {
          const t = Date.now();
          setNow(t);
          setResumed(false);
          update(newAttempt(bank, mode, t));
        }}
      />
    );
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
      remaining={remainingMs(attempt, now)}
      notice={backNotice > 0 ? "back" : resumed ? "resumed" : null}
      onDraft={(d) => {
        draftRef.current = d;
      }}
      onSubmit={(answer: Answer) => {
        // A submit that lands after the deadline is handled by the timeout path.
        if (attempt.endsAt !== null && Date.now() >= attempt.endsAt) {
          update(expireIfDue(bank, attempt, Date.now(), answer));
          return;
        }
        setResumed(false);
        update(lockAnswer(bank, attempt, answer));
      }}
      onNext={() => update(advance(bank, attempt))}
      onQuit={() => {
        if (window.confirm("Discard this attempt? Your locked answers will be lost and you'll return to mode select.")) {
          update(null);
        }
      }}
    />
  );
}
