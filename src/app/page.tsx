import Link from "next/link";
import StatusBar from "@/components/StatusBar";
import { catalog } from "@/lib/catalog";

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

export default function HubPage() {
  const courses = catalog.courses;
  return (
    <div className="page">
      <StatusBar right={<span className="statusbar__label">courses</span>} />
      <main className="content">
        <h1 className="heading">Courses</h1>
        <p className="subhead">{plural(courses.length, "course")}</p>
        <ul className="cards" role="list">
          {courses.map((c) => (
            <li key={c.id}>
              <Link className="card" href={`/courses/${c.id}`}>
                <span className="card__code">{c.code}</span>
                <span className="card__title">{c.title}</span>
                <span className="card__meta">{plural(c.assessments.length, "assessment")}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
