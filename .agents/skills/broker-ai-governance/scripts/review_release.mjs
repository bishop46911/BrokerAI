#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));
for (const key of ["project", "target", "created-by", "output"]) if (!args[key]) fail(`Missing argument: ${key}`);
const project = resolve(args.project);
const targetPath = resolve(args.target);
const target = JSON.parse(readFileSync(targetPath, "utf8"));
const targetValid = target.schemaVersion === "1.0" && ["knowledge", "risk_rule"].includes(target.kind) && ["draft", "submitted"].includes(target.status) && Array.isArray(target.provenance) && target.provenance.length > 0;
const targetTests = Array.isArray(target.evidence?.tests) ? target.evidence.tests : [];
const commands = [["test"], ["run", "typecheck"], ["run", "build"]];
const gates = [{ name: "target-proposal", passed: targetValid && targetTests.every((item) => item.passed), detail: targetValid ? `${targetTests.filter((item) => item.passed).length}/${targetTests.length} proposal tests passed` : "Target contract or state is invalid" }];

for (const npmArgs of commands) {
  const run = spawnSync("npm", npmArgs, { cwd: project, encoding: "utf8", timeout: 120_000 });
  const output = `${run.stdout || ""}\n${run.stderr || ""}`.trim();
  gates.push({ name: `npm-${npmArgs.join("-")}`, passed: run.status === 0, detail: output.slice(-1200) || `exit ${run.status}` });
  if (run.status !== 0) break;
}

let evaluation;
if (args.evaluation) {
  evaluation = JSON.parse(readFileSync(resolve(args.evaluation), "utf8"));
  gates.push({ name: "claims-evaluation", passed: Array.isArray(evaluation.gates) && evaluation.gates.every((gate) => gate.passed), detail: `${evaluation.gates?.filter((gate) => gate.passed).length || 0}/${evaluation.gates?.length || 0} evaluation gates passed` });
}
const unresolved = target.evidence?.risks || [];
const recommendation = gates.some((gate) => !gate.passed) ? "no-go" : unresolved.length || !evaluation ? "conditional" : "go";
const now = new Date().toISOString();
const proposal = {
  schemaVersion: "1.0",
  id: `GOV-REL-${createHash("sha256").update(`${target.id}:${now}`).digest("hex").slice(0, 10).toUpperCase()}`,
  kind: "release",
  title: `Release review: ${target.title || basename(targetPath)}`,
  rationale: `Automated release review for ${target.id || basename(targetPath)}`,
  payload: { targetProposalId: target.id, recommendation, evaluation: evaluation ? { generatedAt: evaluation.generatedAt, metrics: evaluation.metrics } : null },
  provenance: [{ source: targetPath, version: target.id || "unknown" }],
  evidence: { tests: gates, risks: unresolved.length ? unresolved : evaluation ? [] : ["No claims evaluation report was attached"] },
  status: "draft",
  createdBy: args["created-by"],
  createdAt: now,
};
const output = resolve(args.output);
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(proposal, null, 2)}\n`, "utf8");
console.log(`${recommendation.toUpperCase()}: ${gates.filter((gate) => gate.passed).length}/${gates.length} gates passed; proposal at ${output}`);
if (recommendation === "no-go") process.exitCode = 2;

function parseArgs(items) { const result = {}; for (let i = 0; i < items.length; i += 2) { const key = items[i]?.replace(/^--/, ""); if (!key || !items[i + 1]) fail(`Invalid argument near ${items[i] || "end"}`); result[key] = items[i + 1]; } return result; }
function fail(message) { console.error(message); process.exit(1); }
