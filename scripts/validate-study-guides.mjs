import { readFileSync, realpathSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, relative, isAbsolute } from "node:path";
import { validateStudyGuides } from "../src/lib/validate-study-guides.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const publicDir = resolve(root, "public");
const errors = validateStudyGuides(JSON.parse(readFileSync(resolve(root, "data/catalog.json"), "utf8")), (path) => {
  try {
    const file = realpathSync(resolve(publicDir, `.${path}`));
    const inside = relative(resolve(publicDir, "study-guides"), file);
    return !inside.startsWith("..") && !isAbsolute(inside) && statSync(file).isFile();
  } catch {
    return false;
  }
});
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Study guide catalog and artifacts validated.");
}
