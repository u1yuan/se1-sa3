export default function Progress({ current, total, lockedCurrent }: { current: number; total: number; lockedCurrent: boolean }) {
  return (
    <div className="progress">
      <p className="progress__count">
        <span className="progress__now">{current + 1}</span>
        <span className="progress__of"> of {total}</span>
      </p>
      <div
        className="progress__track"
        role="progressbar"
        aria-label="Progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current + (lockedCurrent ? 1 : 0)}
        aria-valuetext={`Question ${current + 1} of ${total}`}
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`progress__tick${i < current || (i === current && lockedCurrent) ? " is-done" : ""}${i === current ? " is-now" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
