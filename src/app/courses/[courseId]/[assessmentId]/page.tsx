import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Reviewer from "@/components/Reviewer";
import { catalog, getBank } from "@/lib/catalog";

export const dynamicParams = false;

export function generateStaticParams() {
  return catalog.courses.flatMap((c) => c.assessments.map((a) => ({ courseId: c.id, assessmentId: a.id })));
}

type Params = { params: Promise<{ courseId: string; assessmentId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { courseId, assessmentId } = await params;
  const bank = getBank(courseId, assessmentId);
  return { title: bank ? `${bank.courseCode} ${bank.title}` : "Assessment" };
}

export default async function AssessmentPage({ params }: Params) {
  const { courseId, assessmentId } = await params;
  const bank = getBank(courseId, assessmentId);
  if (!bank) notFound();
  return <Reviewer bank={bank} />;
}
