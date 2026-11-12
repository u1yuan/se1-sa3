import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import StatusBar from "@/components/StatusBar";
import AttemptBadge from "@/components/AttemptBadge";
import { catalog, getCourse } from "@/lib/catalog";

export const dynamicParams = false;

export function generateStaticParams() {
  return catalog.courses.map((c) => ({ courseId: c.id }));
}

type Params = { params: Promise<{ courseId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const course = getCourse((await params).courseId);
  return { title: course ? `${course.code} ${course.title}` : "Course" };
}

export default async function CoursePage({ params }: Params) {
  const course = getCourse((await params).courseId);
  if (!course) notFound();
  const n = course.assessments.length;
  return (
    <div className="page">
      <StatusBar crumbs={[{ label: course.code }]} right={<span className="statusbar__label">assessments</span>} />
      <main className="content">
        <p className="eyebrow">{course.code}</p>
        <h1 className="heading">{course.title}</h1>
        <p className="subhead">
          {n} assessment{n === 1 ? "" : "s"}
        </p>
        <ul className="cards" role="list">
          {course.assessments.map((a) => (
            <li key={a.id}>
              <Link className="card" href={`/courses/${course.id}/${a.id}`}>
                <span className="card__title card__title--lg">{a.title}</span>
                {a.examLabel && <span className="card__label">{a.examLabel}</span>}
                {a.topic && <span className="card__topic">{a.topic}</span>}
                <span className="card__meta">
                  {a.questionCount} questions
                  {a.examTimerMinutes ? <> · {a.examTimerMinutes}-minute exam timer</> : null}
                </span>
                <AttemptBadge bankId={a.bankId} total={a.questionCount} />
              </Link>
            </li>
          ))}
        </ul>
        <p className="back-link">
          <Link href="/">← all courses</Link>
        </p>
      </main>
    </div>
  );
}
