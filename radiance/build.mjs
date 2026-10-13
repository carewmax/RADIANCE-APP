// Concatenates src/ modules into dist/index.html (one self-contained page).
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
const files = readdirSync("src").filter(f => /^\d/.test(f)).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
const read = f => readFileSync(`src/${f}`, "utf8");
const body = files.filter(f => f.endsWith(".html")).map(read).join("") + "<script>\n" + files.filter(f => f.endsWith(".js")).map(read).join("") + "</script>\n";
mkdirSync("dist", { recursive: true });
writeFileSync("dist/index.html", `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>${body}</body></html>`);
console.log(`dist/index.html from ${files.length} modules (${(body.length / 1024).toFixed(0)} KB): ${files.join(", ")}`);
