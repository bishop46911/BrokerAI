#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));
const required = ["input", "source", "version", "effective-at", "created-by", "output"];
const missing = required.filter((key) => !args[key]);
if (missing.length) fail(`Missing arguments: ${missing.join(", ")}`);

const input = resolve(args.input);
const output = resolve(args.output);
if (input === output) fail("Output must not overwrite the source document");
const extension = extname(input).toLowerCase();
if (![".txt", ".md", ".csv", ".json"].includes(extension)) fail("Only TXT, Markdown, CSV, and JSON are supported");
if (!/^\d{4}-\d{2}-\d{2}$/.test(args["effective-at"]) || Number.isNaN(Date.parse(args["effective-at"]))) fail("effective-at must be a valid YYYY-MM-DD date");

const raw = readFileSync(input, "utf8").trim();
if (raw.length < 20) fail("Source document is too short");
const documentKey = slug(`${basename(input)}-${args.version}`);
const segments = splitContent(raw);
const seen = new Set();
let duplicateCount = 0;
const chunks = segments.flatMap((content, index) => {
  const normalized = content.trim();
  if (!normalized) return [];
  const fingerprint = createHash("sha256").update(normalized).digest("hex");
  if (seen.has(fingerprint)) { duplicateCount += 1; return []; }
  seen.add(fingerprint);
  return [{ id: `${documentKey}-${index + 1}`, clause: detectClause(normalized, index), page: index + 1, content: normalized }];
});

const tests = [
  test("required-provenance", Boolean(args.source && args.version && args["effective-at"] && args["created-by"]), "Source, version, effective date, and creator are present"),
  test("supported-format", true, extension.slice(1).toUpperCase()),
  test("non-empty-content", chunks.length > 0, `${chunks.length} non-empty chunks`),
  test("chunk-size", chunks.every((chunk) => chunk.content.length <= 800), "All chunks are at most 800 characters"),
  test("no-duplicates", duplicateCount === 0, duplicateCount ? `${duplicateCount} duplicate chunks removed` : "No exact duplicate chunks"),
];
const risks = ["Source authority and legal effect require compliance confirmation before approval"];
if (new Date(`${args["effective-at"]}T00:00:00Z`) > new Date()) risks.push("The effective date is in the future");
if (duplicateCount) risks.push(`${duplicateCount} exact duplicate chunks were removed`);

const now = new Date().toISOString();
const proposal = {
  schemaVersion: "1.0",
  id: `GOV-KNW-${createHash("sha256").update(`${input}:${args.version}:${raw}`).digest("hex").slice(0, 10).toUpperCase()}`,
  kind: "knowledge",
  title: `Knowledge update: ${basename(input)}`,
  rationale: args.rationale || "Onboard reviewed claims knowledge into the governed corpus",
  payload: { documents: [{ name: basename(input), type: extension.slice(1), version: args.version, effectiveAt: args["effective-at"], chunks }] },
  provenance: [{ source: args.source, version: args.version, effectiveAt: args["effective-at"] }],
  evidence: { tests, risks },
  status: "draft",
  createdBy: args["created-by"],
  createdAt: now,
};

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(proposal, null, 2)}\n`, "utf8");
console.log(`Created ${proposal.id} with ${chunks.length} chunks at ${output}`);
if (tests.some((item) => !item.passed)) process.exitCode = 2;

function splitContent(content) {
  const paragraphs = content.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
  const output = [];
  for (const paragraph of paragraphs) {
    for (let offset = 0; offset < paragraph.length; offset += 800) output.push(paragraph.slice(offset, offset + 800));
  }
  return output;
}
function detectClause(content, index) { return content.match(/^(第\s*[^\s，。,；;]{1,18}\s*(?:条|节))/)?.[1] || `片段 ${index + 1}`; }
function slug(value) { return value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "document"; }
function test(name, passed, detail) { return { name, passed, detail }; }
function parseArgs(items) { const result = {}; for (let i = 0; i < items.length; i += 2) { const key = items[i]?.replace(/^--/, ""); if (!key || !items[i + 1]) fail(`Invalid argument near ${items[i] || "end"}`); result[key] = items[i + 1]; } return result; }
function fail(message) { console.error(message); process.exit(1); }
