import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { validateStudyGuides } from "../src/lib/validate-study-guides.ts";
import { findStudyGuide, studyGuideHref, courseStudyGuidesHref, studyGuideArtifactUrl } from "../src/lib/study-guides.ts";
import type { Catalog, CatalogStudyGuide } from "../src/lib/types.ts";

const guide: CatalogStudyGuide = { id: "concept-map", title: "Concept map", description: "Explore the concepts.", artifactPath: "/study-guides/cs0025/concept-map.html" };
const example = () => ({ courses: [{ id: "cs0025", assessments: [], studyGuides: [{ ...guide }] }] });
const production = JSON.parse(readFileSync(new URL("../data/catalog.json", import.meta.url), "utf8")) as Catalog;

test("production catalog and artifact files validate; empty guide libraries are valid", () => {
  assert.deepEqual(validateStudyGuides(production, (path) => existsSync(new URL(`../public${path}`, import.meta.url))), []);
  assert.deepEqual(validateStudyGuides({ courses: production.courses.map((course) => ({ ...course, studyGuides: [] })) }, () => { throw new Error("empty library must not look for artifacts"); }), []);
});

test("guide metadata, course ids, reserved routes, and arrays are validated", () => {
  assert.deepEqual(validateStudyGuides(null, () => true), ["catalog.courses must be an array"]);
  for (const value of [null, {}, "bad", { courses: [null] }, { courses: [{ id: "../escape" }] }, { courses: [{ id: "cs0025" }] }]) {
    assert.ok(validateStudyGuides(value, () => true).length > 0);
  }
  assert.ok(validateStudyGuides({ courses: [example().courses[0], example().courses[0]] }, () => true).some((e) => e.includes("duplicate course")));
  assert.ok(validateStudyGuides({ courses: [{ ...example().courses[0], assessments: [{ id: "study-guides" }] }] }, () => true).some((e) => e.includes("reserved")));
  for (const field of ["title", "description"] as const) for (const value of [null, 4, "", "   "]) {
    const catalog = example();
    Object.assign(catalog.courses[0]!.studyGuides[0]!, { [field]: value });
    assert.ok(validateStudyGuides(catalog, () => true).some((e) => e.includes(field)));
  }
});

test("ids are unique within a course; same id in another course is allowed", () => {
  const catalog = example();
  catalog.courses[0]!.studyGuides.push({ ...guide });
  assert.ok(validateStudyGuides(catalog, () => true).some((e) => e.includes("duplicate guide")));
  catalog.courses[0]!.studyGuides.pop();
  catalog.courses.push({ id: "devnet", assessments: [], studyGuides: [{ ...guide, title: "Other course", artifactPath: "/study-guides/devnet/concept-map.html" }] });
  assert.deepEqual(validateStudyGuides(catalog, () => true), []);
  assert.equal(findStudyGuide(catalog.courses[0]!, guide.id)?.title, "Concept map");
  assert.equal(findStudyGuide(catalog.courses[1]!, guide.id)?.title, "Other course");
  assert.equal(findStudyGuide(catalog.courses[0]!, "unknown"), undefined);
  assert.equal(findStudyGuide({ studyGuides: [] }, guide.id), undefined);
  for (const id of ["", "Uppercase", "../escape", "encoded%2fpath", "two words"]) {
    const invalid = example();
    invalid.courses[0]!.studyGuides[0]!.id = id;
    assert.ok(validateStudyGuides(invalid, () => true).some((e) => e.includes("slug")));
  }
});

test("only canonical local course artifact paths are accepted, and files must exist", () => {
  assert.deepEqual(validateStudyGuides(example(), () => true), []);
  assert.ok(validateStudyGuides(example(), () => false).some((e) => e.includes("file missing")));
  for (const artifactPath of ["https://example.com/a.html", "//example.com/a.html", "javascript:alert(1)", "/study-guides/devnet/concept-map.html", "/study-guides/cs0025/../concept-map.html", "/study-guides/cs0025/%2e%2e/concept-map.html", "/study-guides/cs0025/concept-map.html?x=1", "/study-guides/cs0025/concept-map.html#x", "\\study-guides\\cs0025\\concept-map.html", "/reviewers/a.html"]) {
    const catalog = example();
    catalog.courses[0]!.studyGuides[0]!.artifactPath = artifactPath;
    assert.ok(validateStudyGuides(catalog, () => { throw new Error("must reject before filesystem access"); }).some((e) => e.includes("artifactPath")), artifactPath);
  }
});

test("links centralize routes and public artifact URLs respect a deployment base path", () => {
  assert.equal(courseStudyGuidesHref("cs0025"), "/courses/cs0025/?tab=study-guides");
  assert.equal(studyGuideHref("cs0025", "concept-map"), "/courses/cs0025/study-guides/?guide=concept-map");
  assert.equal(studyGuideHref("a/b", "x & y"), "/courses/a%2Fb/study-guides/?guide=x%20%26%20y");
  assert.equal(studyGuideArtifactUrl(guide.artifactPath, ""), guide.artifactPath);
  assert.equal(studyGuideArtifactUrl(guide.artifactPath, "/revhub"), `/revhub${guide.artifactPath}`);
});

test("interactive fixture is test-only HTML with embedded visualizations", () => {
  const file = new URL("./fixtures/study-guides/interactive.html", import.meta.url);
  assert.ok(statSync(file).size > 1000);
  const html = readFileSync(file, "utf8");
  for (const tag of ["<script>", "<svg", "<canvas", "data:image/"]) assert.ok(html.includes(tag));
  assert.ok(!html.includes('<script src='));
});
