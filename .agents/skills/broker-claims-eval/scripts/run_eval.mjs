#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));
for (const key of ["base-url", "cases", "output"]) if (!args[key]) fail(`Missing argument: ${key}`);
const cases = JSON.parse(readFileSync(resolve(args.cases), "utf8"));
if (!Array.isArray(cases) || cases.length === 0) fail("cases must be a non-empty JSON array");
const baseUrl = args["base-url"].replace(/\/$/, "");
const bootstrap = await fetch(`${baseUrl}/api/bootstrap`).then(checkResponse).then((response) => response.json());
const results = [];

for (const item of cases) {
  if (!item.id || !item.question || typeof item.expectRefusal !== "boolean") fail(`Invalid case: ${JSON.stringify(item)}`);
  const response = await fetch(`${baseUrl}/api/claims/query`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: item.question, caseContext: item.context || "" }),
  }).then(checkResponse);
  const answer = await response.json();
  const refusal = answer.citations.length === 0 && answer.confidence === "low" && Boolean(answer.escalationReason);
  const citationShape = answer.citations.every((citation) => citation.chunkId && citation.clause && citation.quote);
  const clauseMatch = !item.expectedClause || answer.citations.some((citation) => citation.clause.includes(item.expectedClause));
  const escalationMatch = item.expectedEscalation === undefined || Boolean(answer.escalationReason) === item.expectedEscalation;
  const refusalMatch = refusal === item.expectRefusal;
  results.push({ id: item.id, passed: citationShape && clauseMatch && escalationMatch && refusalMatch, refusalMatch, citationShape, clauseMatch, escalationMatch, answerId: answer.id, provider: answer.provider });
}

const supported = results.filter((_, index) => !cases[index].expectRefusal);
const refused = results.filter((_, index) => cases[index].expectRefusal);
const metrics = {
  cases: results.length,
  passRate: ratio(results.filter((item) => item.passed).length, results.length),
  citationPrecision: ratio(supported.filter((item) => item.citationShape).length, supported.length),
  refusalRate: ratio(refused.filter((item) => item.refusalMatch).length, refused.length),
  clauseMatchRate: ratio(results.filter((item) => item.clauseMatch).length, results.length),
};
const gates = [
  { name: "citation-precision", passed: metrics.citationPrecision === 1, detail: `${percent(metrics.citationPrecision)} (required 100%)` },
  { name: "unsupported-refusal", passed: metrics.refusalRate === 1, detail: `${percent(metrics.refusalRate)} (required 100%)` },
  { name: "expected-clause", passed: metrics.clauseMatchRate >= 0.9, detail: `${percent(metrics.clauseMatchRate)} (required 90%)` },
];
const report = { schemaVersion: "1.0", type: "claims_evaluation", mode: bootstrap.mode, generatedAt: new Date().toISOString(), metrics, gates, results };
const output = resolve(args.output);
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`Evaluated ${results.length} cases in ${bootstrap.mode} mode: ${percent(metrics.passRate)} passed; report at ${output}`);
if (gates.some((gate) => !gate.passed)) process.exitCode = 2;

function ratio(value, total) { return total === 0 ? 1 : Number((value / total).toFixed(4)); }
function percent(value) { return `${(value * 100).toFixed(1)}%`; }
function checkResponse(response) { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response; }
function parseArgs(items) { const result = {}; for (let i = 0; i < items.length; i += 2) { const key = items[i]?.replace(/^--/, ""); if (!key || !items[i + 1]) fail(`Invalid argument near ${items[i] || "end"}`); result[key] = items[i + 1]; } return result; }
function fail(message) { console.error(message); process.exit(1); }
