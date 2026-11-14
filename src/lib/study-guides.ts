import type { CatalogCourse, CatalogStudyGuide } from "./types.ts";

export function findStudyGuide(course: Pick<CatalogCourse, "studyGuides">, guideId: string): CatalogStudyGuide | undefined {
  return course.studyGuides.find((guide) => guide.id === guideId);
}

// Next Link/router apply basePath to app routes automatically.
export function courseStudyGuidesHref(courseId: string): string {
  return `/courses/${encodeURIComponent(courseId)}/?tab=study-guides`;
}

export function studyGuideHref(courseId: string, guideId: string): string {
  return `/courses/${encodeURIComponent(courseId)}/study-guides/?guide=${encodeURIComponent(guideId)}`;
}

// Fetching a public artifact needs the build-time basePath explicitly.
export function studyGuideArtifactUrl(artifactPath: string, basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""): string {
  return `${basePath}${artifactPath}`;
}
