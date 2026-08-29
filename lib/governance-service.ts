import { brokers } from "./seed";
import { knowledgePayloadSchema, releasePayloadSchema, riskRulePayloadSchema } from "./governance";
import { evaluateAll } from "./risk";
import { addAudit, store } from "./store";
import type { DeclarativeRiskRule, GovernanceProposal, KnowledgeChunk } from "./types";

export function submitProposal(proposal: GovernanceProposal, actor: string) {
  if (proposal.status !== "draft") throw new Error("INVALID_STATE");
  if (proposal.createdBy !== actor) throw new Error("FORBIDDEN");
  if (!proposal.provenance.length || proposal.evidence.tests.some((test) => !test.passed)) throw new Error("FAILED_GATES");
  proposal.status = "submitted";
  addAudit(actor, "提交治理提案", proposal.id, `${proposal.kind} · ${proposal.title}`);
  return proposal;
}

export function reviewProposal(proposal: GovernanceProposal, actor: string, action: "approve" | "reject", note: string) {
  if (proposal.status !== "submitted") throw new Error("INVALID_STATE");
  if (proposal.createdBy === actor) throw new Error("SELF_APPROVAL");
  if (note.trim().length < 4) throw new Error("NOTE_REQUIRED");
  if (action === "approve" && proposal.kind === "release") {
    const release = releasePayloadSchema.parse(proposal.payload);
    if (release.recommendation === "no-go") throw new Error("FAILED_GATES");
  }
  proposal.status = action === "approve" ? "approved" : "rejected";
  proposal.reviewedBy = actor;
  proposal.reviewNote = note.trim();
  proposal.reviewedAt = new Date().toISOString();
  addAudit(actor, action === "approve" ? "批准治理提案" : "拒绝治理提案", proposal.id, proposal.reviewNote);
  return proposal;
}

export function activateProposal(proposal: GovernanceProposal, actor: string) {
  if (proposal.status !== "approved") throw new Error("INVALID_STATE");
  if (proposal.kind === "knowledge") activateKnowledge(proposal);
  if (proposal.kind === "risk_rule") activateRiskRule(proposal);
  if (proposal.kind === "release") releasePayloadSchema.parse(proposal.payload);
  proposal.status = "activated";
  proposal.activatedAt = new Date().toISOString();
  addAudit(actor, "启用治理提案", proposal.id, proposal.kind === "release" ? "已记录发布决定；未修改环境或密钥" : `${proposal.kind} 变更已生效`);
  return proposal;
}

function activateKnowledge(proposal: GovernanceProposal) {
  const { documents } = knowledgePayloadSchema.parse(proposal.payload);
  const newDocuments = documents.map((document, index) => ({
    id: `${proposal.id}-DOC-${index + 1}`,
    name: document.name,
    chunks: document.chunks.length,
    status: "已索引",
    createdAt: new Date().toISOString(),
  }));
  const newChunks: KnowledgeChunk[] = documents.flatMap((document, documentIndex) => document.chunks.map((chunk) => ({
    ...chunk,
    id: `${proposal.id}-${chunk.id}`,
    documentId: newDocuments[documentIndex].id,
    documentName: document.name,
  })));
  store.documents.unshift(...newDocuments);
  store.chunks.push(...newChunks);
}

function activateRiskRule(proposal: GovernanceProposal) {
  const { rule } = riskRulePayloadSchema.parse(proposal.payload);
  const activated: DeclarativeRiskRule = { ...rule, enabled: true, sourceProposalId: proposal.id };
  const index = store.rules.findIndex((item) => item.id === rule.id);
  if (index >= 0) store.rules[index] = activated;
  else store.rules.push(activated);
  const previous = new Map(store.riskCases.map((item) => [item.id, item]));
  store.riskCases = evaluateAll(brokers, store.rules).slice(0, 30).map((item) => {
    const existing = previous.get(item.id);
    return existing ? { ...item, status: existing.status, reviewerNote: existing.reviewerNote } : item;
  });
}
