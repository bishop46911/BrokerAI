import { z } from "zod";
import type { GovernanceProposal, Role } from "./types";

const testSchema = z.object({ name: z.string().min(1), passed: z.boolean(), detail: z.string().min(1) }).strict();
const provenanceSchema = z.object({
  source: z.string().min(1),
  version: z.string().min(1),
  effectiveAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).strict();

const chunkSchema = z.object({
  id: z.string().min(1), clause: z.string().min(1), page: z.number().int().positive(), content: z.string().min(1).max(800),
}).strict();
export const knowledgePayloadSchema = z.object({
  documents: z.array(z.object({
    name: z.string().min(1), type: z.enum(["txt", "md", "csv", "json"]), version: z.string().min(1),
    effectiveAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), chunks: z.array(chunkSchema).min(1).max(100),
  }).strict()).min(1).max(10),
}).strict();

const riskMetricSchema = z.enum(["replacements30d", "productConcentration", "commissionRatio", "refundRatio", "sharedAccountCount", "complaints30d", "afterHoursRatio"]);
export const riskRulePayloadSchema = z.object({
  rule: z.object({
    id: z.string().regex(/^[a-z0-9\u4e00-\u9fff-]{1,48}$/), name: z.string().min(2).max(80), metric: riskMetricSchema,
    operator: z.enum([">", ">=", "<", "<=", "=="]), threshold: z.number().nonnegative(), points: z.number().int().min(1).max(40),
    evidenceTemplate: z.string().min(5).max(300),
  }).strict(),
}).strict().superRefine(({ rule }, ctx) => {
  const ratios = ["productConcentration", "commissionRatio", "refundRatio", "afterHoursRatio"];
  if (ratios.includes(rule.metric) && rule.threshold > 1) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ratio threshold must be between 0 and 1" });
  if (!ratios.includes(rule.metric) && !Number.isInteger(rule.threshold)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Count threshold must be an integer" });
});

export const releasePayloadSchema = z.object({
  targetProposalId: z.string().min(1), recommendation: z.enum(["go", "conditional", "no-go"]),
  evaluation: z.object({ generatedAt: z.string(), metrics: z.record(z.string(), z.number()) }).nullable(),
}).strict();

export const governanceProposalSchema = z.object({
  schemaVersion: z.literal("1.0"),
  id: z.string().min(4).max(100),
  kind: z.enum(["knowledge", "risk_rule", "release"]),
  title: z.string().min(3).max(160),
  rationale: z.string().min(5).max(2000),
  payload: z.unknown(),
  provenance: z.array(provenanceSchema).min(1),
  evidence: z.object({ tests: z.array(testSchema).min(1), risks: z.array(z.string()), metrics: z.record(z.string(), z.number()).optional() }).strict(),
  status: z.enum(["draft", "submitted", "approved", "rejected", "activated"]),
  createdBy: z.string().min(1).max(100),
  reviewedBy: z.string().max(100).optional(), reviewNote: z.string().max(2000).optional(),
  createdAt: z.string().datetime(), reviewedAt: z.string().datetime().optional(), activatedAt: z.string().datetime().optional(),
}).strict();

export function parseProposalPackage(input: unknown): GovernanceProposal {
  const proposal = governanceProposalSchema.parse(input);
  if (proposal.status !== "draft") throw new Error("Imported proposals must be in draft status");
  if (proposal.kind === "knowledge") knowledgePayloadSchema.parse(proposal.payload);
  if (proposal.kind === "risk_rule") riskRulePayloadSchema.parse(proposal.payload);
  if (proposal.kind === "release") releasePayloadSchema.parse(proposal.payload);
  return proposal as GovernanceProposal;
}

export const demoActors: Record<Role, string> = {
  advisor: "顾问演示账号", developer: "张凯文", compliance: "林慧敏", admin: "陈志豪",
};

export function getDemoActor(request: Request) {
  const role = (request.headers.get("x-demo-role") || "developer") as Role;
  if (!(role in demoActors)) throw new Error("Unknown demo role");
  return { role, name: request.headers.get("x-demo-user") || demoActors[role] };
}

export function requireRole(role: Role, allowed: Role[]) {
  if (!allowed.includes(role)) throw new Error("FORBIDDEN");
}
