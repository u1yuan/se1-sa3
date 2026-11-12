export default function Progress({ current, total, lockedCurrent }: { current: number; total: number; lockedCurrent: boolean }) {
  const submitted = current + (lockedCurrent ? 1 : 0);
  return (
    <div className="progress">
      <div className="progress__labels">
        <p>Question <strong>{current + 1}</strong> of {total}</p>
        <p className="progress__submitted">{submitted} of {total} submitted</p>
      </div>
      <div className="progress__track" role="progressbar" aria-label="Submitted answers" aria-valuemin={0} aria-valuemax={total} aria-valuenow={submitted} aria-valuetext={`${submitted} of ${total} answers submitted`}>
        <span className="progress__fill" style={{ transform: `scaleX(${submitted / total})` }} />
      </div>
    </div>
  );
}
