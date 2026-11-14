// Build fixtures in a disposable workspace copy; never register samples in the source catalog.
import { cpSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
mkdirSync(resolve(root, "tmp"), { recursive: true });
const target = mkdtempSync(resolve(root, "tmp/study-guides-"));
for (const directory of ["src", "data", "public", "scripts"]) cpSync(resolve(root, directory), resolve(target, directory), { recursive: true });
for (const file of ["package.json", "package-lock.json", "next.config.ts", "tsconfig.json"]) copyFileSync(resolve(root, file), resolve(target, file));
symlinkSync(resolve(root, "node_modules"), resolve(target, "node_modules"), process.platform === "win32" ? "junction" : "dir");
const catalog = JSON.parse(readFileSync(resolve(target, "data/catalog.json"), "utf8"));
for (const course of catalog.courses) {
  course.studyGuides = course.id === "cs0025" ? [
    { id: "interactive", title: "Interactive concepts", description: "Explore a decision tree and depth plot." },
    { id: "second-guide", title: "Second guide", description: "A separate guide for switching tests." },
  ] : course.id === "devnet" ? [
    { id: "interactive", title: "Other course guide", description: "Same id, different course." },
  ] : [];
  for (const guide of course.studyGuides) {
    guide.artifactPath = `/study-guides/${course.id}/${guide.id}.html`;
    mkdirSync(resolve(target, `public/study-guides/${course.id}`), { recursive: true });
    copyFileSync(resolve(root, "tests/fixtures/study-guides/interactive.html"), resolve(target, `public${guide.artifactPath}`));
  }
}
writeFileSync(resolve(target, "data/catalog.json"), JSON.stringify(catalog, null, 2) + "\n");
writeFileSync(resolve(target, ".study-guide-fixture"), "Test-only populated guide catalog\n");
console.log(target);
