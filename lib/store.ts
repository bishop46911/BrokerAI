import { brokers, knowledgeChunks } from "./seed";
import { evaluateAll, riskRules } from "./risk";
import type { AuditEvent, ClaimAnswer, DeclarativeRiskRule, GovernanceProposal, KnowledgeChunk, RiskCase, RiskStatus } from "./types";

interface DemoStore {
  claims: ClaimAnswer[];
  riskCases: RiskCase[];
  chunks: KnowledgeChunk[];
  documents: Array<{ id: string; name: string; chunks: number; status: string; createdAt: string }>;
  audit: AuditEvent[];
  proposals: GovernanceProposal[];
  rules: DeclarativeRiskRule[];
}

const initialCases = evaluateAll(brokers).slice(0, 18);
const globalStore = globalThis as typeof globalThis & { __brokerDemoStore?: DemoStore };

export const store: DemoStore = globalStore.__brokerDemoStore ?? {
  claims: [],
  riskCases: initialCases,
  chunks: [...knowledgeChunks],
  documents: [
    { id: "doc-health-protect", name: "安心住院医疗保险条款（演示版）", chunks: 3, status: "已索引", createdAt: "2026-08-26T09:20:00.000Z" },
    { id: "doc-claim-guide", name: "医疗理赔申请指南（演示版）", chunks: 3, status: "已索引", createdAt: "2026-08-26T09:25:00.000Z" },
  ],
  audit: [
    { id: "AUD-001", actor: "系统", action: "风险扫描", target: "100 名中介", detail: `创建 ${initialCases.length} 个需复核案件`, createdAt: "2026-08-29T01:00:00.000Z" },
    { id: "AUD-002", actor: "管理员", action: "知识库更新", target: "医疗理赔申请指南", detail: "完成 3 个条款片段索引", createdAt: "2026-08-28T07:30:00.000Z" },
  ],
  proposals: [],
  rules: structuredClone(riskRules),
};

if (!store.proposals) store.proposals = [];
if (!store.rules) store.rules = structuredClone(riskRules);

globalStore.__brokerDemoStore = store;

export function addAudit(actor: string, action: string, target: string, detail: string) {
  store.audit.unshift({ id: `AUD-${Date.now().toString(36).toUpperCase()}`, actor, action, target, detail, createdAt: new Date().toISOString() });
}

export function updateRiskCase(id: string, status: RiskStatus, reviewerNote: string) {
  const item = store.riskCases.find((riskCase) => riskCase.id === id);
  if (!item) return null;
  item.status = status;
  item.reviewerNote = reviewerNote;
  item.updatedAt = new Date().toISOString();
  addAudit("合规复核员", "更新风险案件", id, `状态变更为 ${status}${reviewerNote ? `；意见：${reviewerNote}` : ""}`);
  return item;
}
