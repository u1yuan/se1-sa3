import Link from "next/link";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Terminal-style header: `reviewer │ DEVNET / Module 5 │ exam        54:12`.
 * Pass `locked` during an attempt so nothing in the header navigates away.
 */
export default function StatusBar({
  crumbs = [],
  mode,
  right,
  locked = false,
}: {
  crumbs?: Crumb[];
  mode?: string;
  right?: React.ReactNode;
  locked?: boolean;
}) {
  return (
    <header className="statusbar">
      <nav className="statusbar__left" aria-label="Breadcrumb">
        {locked ? <span className="statusbar__home">reviewer</span> : <Link className="statusbar__home" href="/">reviewer</Link>}
        {crumbs.length > 0 && (
          <>
            <span className="statusbar__sep" aria-hidden="true" />
            <span className="statusbar__crumbs">
              {crumbs.map((c, i) => (
                <span key={`${c.label}-${i}`}>
                  {i > 0 && <span className="statusbar__slash" aria-hidden="true"> / </span>}
                  {c.href && !locked ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}
                </span>
              ))}
            </span>
          </>
        )}
        {mode && (
          <>
            <span className="statusbar__sep" aria-hidden="true" />
            <span className="statusbar__mode">{mode}</span>
          </>
        )}
      </nav>
      {right !== undefined && <div className="statusbar__right">{right}</div>}
    </header>
  );
}
