// Local verification server for an export, optionally mounted beneath a base path.
// Usage: node scripts/serve-static-test.mjs out 3100 /revhub
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, relative, isAbsolute, extname } from "node:path";

const root = resolve(process.argv[2] ?? "out");
const port = Number(process.argv[3] ?? 3100);
const mount = (process.argv[4] ?? "").replace(/\/$/, "");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".txt": "text/plain", ".json": "application/json", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2" };
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    if (mount && !pathname.startsWith(`${mount}/`)) throw new Error("outside mount");
    let file = resolve(root, `.${pathname.slice(mount.length) || "/"}`);
    const inside = relative(root, file);
    if (inside.startsWith("..") || isAbsolute(inside)) throw new Error("outside root");
    if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": `${types[extname(file)] ?? "application/octet-stream"}`, "Cache-Control": "no-store" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`Serving ${root} at http://127.0.0.1:${port}${mount}/`));
