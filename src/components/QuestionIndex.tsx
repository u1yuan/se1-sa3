/** Non-interactive question index: past = locked, current = outlined, future = empty. */
export default function QuestionIndex({ current, total, lockedCurrent }: { current: number; total: number; lockedCurrent: boolean }) {
  return (
    <div className="qindex">
      <h2 className="qindex__head" id="qindex-head">Questions</h2>
      <ol className="qindex__grid" aria-labelledby="qindex-head" aria-describedby="qindex-note">
        {Array.from({ length: total }, (_, i) => {
          const state = i < current ? "locked" : i === current ? "current" : "future";
          const label = `Question ${i + 1}, ${i < current || (i === current && lockedCurrent) ? "locked" : i === current ? "current" : "not reached"}`;
          return (
            <li key={i} className={`qbox qbox--${state}${i === current && lockedCurrent ? " qbox--current-locked" : ""}`} aria-label={label} aria-current={i === current ? "step" : undefined}>
              {state === "locked" ? <LockIcon /> : <span aria-hidden="true">{i + 1}</span>}
            </li>
          );
        })}
      </ol>
      <p id="qindex-note" className="visually-hidden">The question index is for reference only and cannot be clicked.</p>
    </div>
  );
}

export function ProgressLine({ current, total, lockedCurrent }: { current: number; total: number; lockedCurrent: boolean }) {
  const width = 18;
  const done = current + (lockedCurrent ? 1 : 0);
  const filled = Math.round((done / total) * width);
  return (
    <div className="progress-line">
      <span
        className="progress-line__bar"
        role="progressbar"
        aria-label="Submitted answers"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={`${done} of ${total} answered; on question ${current + 1}`}
      >
        [<span className="progress-line__fill">{"#".repeat(filled)}</span>
        <span className="progress-line__rest">{"-".repeat(width - filled)}</span>]
      </span>
      <span className="progress-line__count" aria-hidden="true">
        {done}/{total} submitted
      </span>
    </div>
  );
}

function LockIcon() {
  return (
    <svg className="qbox__lock" viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" focusable="false">
      <rect x="3" y="7" width="10" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="10.5" r="1" fill="currentColor" />
    </svg>
  );
}
