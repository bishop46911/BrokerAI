import { store } from "./store";
import type { AuditEvent, ClaimAnswer, GovernanceProposal, RiskCase } from "./types";

export interface BootstrapSnapshot {
  mode: "demo" | "model";
  stats: { brokers: number; transactions: number; openCases: number; highRisk: number; documents: number; claims: number };
  riskCases: RiskCase[];
  documents: Array<{ id: string; name: string; chunks: number; status: string; createdAt: string }>;
  rules: Array<{ id: string; name: string; points: number; enabled: boolean }>;
  audit: AuditEvent[];
  claims: ClaimAnswer[];
  proposals: GovernanceProposal[];
}

export function getBootstrapSnapshot(): BootstrapSnapshot {
  return {
    mode: process.env.OPENAI_API_KEY ? "model" : "demo",
    stats: {
      brokers: 100,
      transactions: 500,
      openCases: store.riskCases.filter((item) => !["closed", "false_positive"].includes(item.status)).length,
      highRisk: store.riskCases.filter((item) => item.level === "high").length,
      documents: store.documents.length,
      claims: store.claims.length,
    },
    riskCases: store.riskCases,
    rules: store.rules.map(({ id, name, points, enabled }) => ({ id, name, points, enabled })),
    documents: store.documents,
    audit: store.audit.slice(0, 30),
    claims: store.claims.slice(0, 10),
    proposals: store.proposals,
  };
}
