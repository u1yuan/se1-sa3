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
  const hasCompanion = course.id === "cs0075";
  const companionUrl = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/reviewers/cs0075-sa3-concepts-hyperparameters-reviewer.html`;
  return (
    <div className="page">
      <StatusBar crumbs={[{ label: course.code }]} right={<span className="statusbar__label">assessments</span>} />
      <main className="content">
        <p className="eyebrow">{course.code}</p>
        <h1 className="heading">{course.title}</h1>
        <p className="subhead">
          {n} assessment{n === 1 ? "" : "s"}
          {hasCompanion ? " · 1 offline companion" : null}
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
          {hasCompanion && (
            <li>
              <a className="card" href={companionUrl}>
                <span className="card__title card__title--lg">SA 3 Concepts &amp; Hyperparameters</span>
                <span className="card__label">Offline companion</span>
                <span className="card__topic">Decision Trees, Random Forest, Gradient Boosting, and SVM</span>
                <span className="card__meta">50 questions · 20 MCQ / 10 true-false / 20 blanks</span>
                <span className="card__meta">Untimed Prep · 60-minute Exam · shuffle, flags, and backtracking</span>
              </a>
            </li>
          )}
        </ul>
        <p className="back-link">
          <Link href="/">← all courses</Link>
        </p>
      </main>
    </div>
  );
}
