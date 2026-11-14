import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import StatusBar from "@/components/StatusBar";
import CourseLibrary, { CourseLibraryContent } from "@/components/CourseLibrary";
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
      <StatusBar crumbs={[{ label: course.code }]} right={<span className="statusbar__label">course library</span>} />
      <main className="content">
        <p className="eyebrow">{course.code}</p>
        <h1 className="heading">{course.title}</h1>
        <p className="subhead">
          {n} assessment{n === 1 ? "" : "s"}
        </p>
        <Suspense fallback={<CourseLibraryContent course={course} />}>
          <CourseLibrary course={course} />
        </Suspense>
        <p className="back-link">
          <Link href="/">← all courses</Link>
        </p>
      </main>
    </div>
  );
}
