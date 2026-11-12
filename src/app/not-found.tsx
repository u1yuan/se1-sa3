import Link from "next/link";
import StatusBar from "@/components/StatusBar";

export default function NotFound() {
  return (
    <div className="page">
      <StatusBar right={<span className="statusbar__label">404</span>} />
      <main className="content">
        <h1 className="heading">Not found</h1>
        <p className="subhead">That course or assessment does not exist.</p>
        <p className="back-link">
          <Link href="/">← all courses</Link>
        </p>
      </main>
    </div>
  );
}
