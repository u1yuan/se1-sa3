const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const nonempty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

/** Validate untrusted JSON before publishing. No filesystem dependency in the schema. */
export function validateStudyGuides(catalog: unknown, artifactExists: (path: string) => boolean): string[] {
  const errors: string[] = [];
  if (!record(catalog) || !Array.isArray(catalog.courses)) return ["catalog.courses must be an array"];
  const courses = new Set<string>();
  for (const course of catalog.courses) {
    if (!record(course) || typeof course.id !== "string" || !slug.test(course.id)) {
      errors.push("course id must be a lowercase slug");
      continue;
    }
    if (courses.has(course.id)) errors.push(`duplicate course id: ${course.id}`);
    courses.add(course.id);
    if (Array.isArray(course.assessments) && course.assessments.some((a) => record(a) && a.id === "study-guides")) {
      errors.push(`${course.id}: assessment id study-guides is reserved for the reader`);
    }
    if (!Array.isArray(course.studyGuides)) {
      errors.push(`${course.id}.studyGuides must be an array (empty is allowed)`);
      continue;
    }
    const ids = new Set<string>();
    for (const guide of course.studyGuides) {
      if (!record(guide) || typeof guide.id !== "string" || !slug.test(guide.id)) {
        errors.push(`${course.id}: guide id must be a lowercase slug`);
        continue;
      }
      const label = `${course.id}/${guide.id}`;
      if (ids.has(guide.id)) errors.push(`${label}: duplicate guide id`);
      ids.add(guide.id);
      for (const field of ["title", "description"] as const) {
        if (!nonempty(guide[field])) errors.push(`${label}: ${field} must be a nonempty string`);
      }
      const expected = `/study-guides/${course.id}/${guide.id}.html`;
      if (guide.artifactPath !== expected) {
        errors.push(`${label}: artifactPath must be ${expected}`);
      } else if (!artifactExists(expected)) {
        errors.push(`${label}: artifact file missing or outside public/study-guides`);
      }
    }
  }
  return errors;
}
