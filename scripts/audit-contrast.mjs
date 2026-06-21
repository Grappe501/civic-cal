#!/usr/bin/env node
/**
 * Heuristic contrast audit — flags risky Tailwind class pairings in source files.
 * Not a substitute for automated WCAG tooling; catches obvious regressions.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");

const RULES = [
  {
    id: "white-on-light-yellow",
    pattern: /text-white[^"'`\n]*bg-(?:yellow|amber|lime|orange)-(?:50|100|200|300|400)/,
    message: "text-white on light yellow/amber/orange background",
  },
  {
    id: "white-on-light-yellow-rev",
    pattern: /bg-(?:yellow|amber|lime|orange)-(?:50|100|200|300|400)[^"'`\n]*text-white/,
    message: "light yellow/amber/orange background with text-white",
  },
  {
    id: "pale-gray-on-white",
    pattern: /text-(?:gray|slate)-(?:300|400)[^"'`\n]*bg-white/,
    message: "pale gray text on white",
  },
  {
    id: "pale-gray-on-white-rev",
    pattern: /bg-white[^"'`\n]*text-(?:gray|slate)-(?:300|400)/,
    message: "white background with pale gray text",
  },
  {
    id: "pine-50-caption",
    pattern: /text-ark-pine\/(?:40|50)/,
    message: "very low-contrast text-ark-pine/40 or /50 (use text-caption or text-muted-soft)",
  },
  {
    id: "white-on-white",
    pattern: /text-white[^"'`\n]*bg-white(?![/\\])/,
    message: "text-white on solid bg-white",
  },
  {
    id: "heavy-label-opacity",
    pattern: /(?:label|font-semibold|font-bold)[^"'`\n]*opacity-(?:40|50)/,
    message: "important label with heavy opacity reduction",
  },
  {
    id: "amber-pale-text",
    pattern: /text-amber-(?:100|200|300)/,
    message: "very light amber text (likely unreadable)",
  },
];

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (/\.(tsx?|css)$/.test(name)) out.push(full);
  }
  return out;
}

const findings = [];

for (const file of walk(SRC)) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  const lines = fs.readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      if (rule.pattern.test(line)) {
        findings.push({ file: rel, line: i + 1, rule: rule.id, message: rule.message, snippet: line.trim().slice(0, 120) });
      }
    }
  });
}

if (findings.length === 0) {
  console.log("audit:contrast — no risky patterns found.");
  process.exit(0);
}

console.log(`audit:contrast — ${findings.length} warning(s):\n`);
for (const f of findings) {
  console.log(`  ${f.file}:${f.line} [${f.rule}] ${f.message}`);
  console.log(`    ${f.snippet}\n`);
}

process.exit(1);
