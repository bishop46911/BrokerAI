#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const metrics = {
  replacements30d: "count", productConcentration: "ratio", commissionRatio: "ratio",
  refundRatio: "ratio", sharedAccountCount: "count", complaints30d: "count", afterHoursRatio: "ratio",
};
const operators = new Set([">", ">=", "<", "<=", "=="]);
const args = parseArgs(process.argv.slice(2));
const required = ["name", "metric", "operator", "threshold", "points", "rationale", "created-by", "output"];
const missing = required.filter((key) => !args[key]);
if (missing.length) fail(`Missing arguments: ${missing.join(", ")}`);
if (!metrics[args.metric]) fail(`Unsupported metric: ${args.metric}`);
if (!operators.has(args.operator)) fail(`Unsupported operator: ${args.operator}`);
const threshold = Number(args.threshold);
const points = Number(args.points);
if (!Number.isFinite(threshold)) fail("threshold must be numeric");
if (!Number.isInteger(points) || points < 1 || points > 40) fail("points must be an integer from 1 to 40");
if (metrics[args.metric] === "ratio" && (threshold < 0 || threshold > 1)) fail("ratio threshold must be between 0 and 1");
if (metrics[args.metric] === "count" && (!Number.isInteger(threshold) || threshold < 0)) fail("count threshold must be a non-negative integer");

const step = metrics[args.metric] === "count" ? 1 : 0.01;
const hitValue = args.operator.startsWith(">") ? threshold + step : args.operator.startsWith("<") ? Math.max(0, threshold - step) : threshold;
const missValue = args.operator.startsWith(">") ? Math.max(0, threshold - step) : args.operator.startsWith("<") ? threshold + step : threshold + step;
const cases = [
  { name: "representative-hit", value: hitValue, expected: true },
  { name: "representative-miss", value: missValue, expected: false },
  { name: "exact-threshold", value: threshold, expected: [">=", "<=", "=="].includes(args.operator) },
].map((item) => ({ ...item, actual: evaluate(item.value, args.operator, threshold), passed: evaluate(item.value, args.operator, threshold) === item.expected }));
const idSeed = `${args.name}:${args.metric}:${args.operator}:${threshold}:${points}`;
const ruleId = slug(args.name);
const proposal = {
  schemaVersion: "1.0",
  id: `GOV-RSK-${createHash("sha256").update(idSeed).digest("hex").slice(0, 10).toUpperCase()}`,
  kind: "risk_rule",
  title: `Risk rule: ${args.name}`,
  rationale: args.rationale,
  payload: { rule: { id: ruleId, name: args.name, metric: args.metric, operator: args.operator, threshold, points, evidenceTemplate: args["evidence-template"] || `${args.metric} value {value} ${args.operator} threshold ${threshold}` } },
  provenance: [{ source: args.rationale, version: "draft-1" }],
  evidence: {
    tests: cases.map((item) => ({ name: item.name, passed: item.passed, detail: `value=${item.value}, expected=${item.expected}, actual=${item.actual}` })),
    risks: ["False-positive impact and policy authority require compliance review before activation"],
    metrics: { threshold, points },
  },
  status: "draft",
  createdBy: args["created-by"],
  createdAt: new Date().toISOString(),
};
const output = resolve(args.output);
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(proposal, null, 2)}\n`, "utf8");
console.log(`Created ${proposal.id}; ${cases.filter((item) => item.passed).length}/${cases.length} boundary tests passed at ${output}`);
if (cases.some((item) => !item.passed)) process.exitCode = 2;

function evaluate(value, operator, expected) { switch (operator) { case ">": return value > expected; case ">=": return value >= expected; case "<": return value < expected; case "<=": return value <= expected; case "==": return value === expected; default: return false; } }
function slug(value) { return value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "risk-rule"; }
function parseArgs(items) { const result = {}; for (let i = 0; i < items.length; i += 2) { const key = items[i]?.replace(/^--/, ""); if (!key || !items[i + 1]) fail(`Invalid argument near ${items[i] || "end"}`); result[key] = items[i + 1]; } return result; }
function fail(message) { console.error(message); process.exit(1); }
