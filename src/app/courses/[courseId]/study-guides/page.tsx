import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { catalog, getCourse } from "@/lib/catalog";
import StudyGuideReader from "@/components/StudyGuideReader";

export const dynamicParams = false;

export function generateStaticParams() {
  return catalog.courses.map((course) => ({ courseId: course.id }));
}

type Params = { params: Promise<{ courseId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const course = getCourse((await params).courseId);
  return { title: course ? `${course.code} Study guides` : "Study guides" };
}

export default async function StudyGuidesPage({ params }: Params) {
  const course = getCourse((await params).courseId);
  if (!course) notFound();
  return <Suspense fallback={<main className="reader-loading" role="status">Loading study guides…</main>}>
    <StudyGuideReader course={{ id: course.id, code: course.code, studyGuides: course.studyGuides }} />
  </Suspense>;
}
