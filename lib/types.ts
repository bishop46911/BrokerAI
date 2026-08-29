export type Role = "advisor" | "developer" | "compliance" | "admin";

export interface KnowledgeChunk {
  id: string;
  documentId: string;
  documentName: string;
  clause: string;
  page: number;
  content: string;
}

export interface Citation {
  chunkId: string;
  documentName: string;
  clause: string;
  page: number;
  quote: string;
}

export interface ClaimAnswer {
  id: string;
  question: string;
  answer: string;
  citations: Citation[];
  requiredDocuments: string[];
  nextSteps: string[];
  confidence: "high" | "medium" | "low";
  escalationReason: string | null;
  status: "draft" | "approved";
  provider: "demo" | "model";
  createdAt: string;
  approvedAt?: string;
}

export interface BrokerMetrics {
  replacements30d: number;
  productConcentration: number;
  commissionRatio: number;
  refundRatio: number;
  sharedAccountCount: number;
  complaints30d: number;
  afterHoursRatio: number;
}

export interface Broker {
  id: string;
  name: string;
  region: string;
  clients: number;
  premium: number;
  metrics: BrokerMetrics;
}

export interface RiskEvidence {
  ruleId: string;
  ruleName: string;
  points: number;
  detail: string;
}

export type RiskStatus = "pending" | "investigating" | "confirmed" | "false_positive" | "closed";

export interface RiskCase {
  id: string;
  broker: Broker;
  score: number;
  level: "high" | "medium" | "low";
  status: RiskStatus;
  evidence: RiskEvidence[];
  summary: string;
  nextSteps: string[];
  reviewerNote: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  target: string;
  detail: string;
  createdAt: string;
}

export type ProposalKind = "knowledge" | "risk_rule" | "release";
export type ProposalStatus = "draft" | "submitted" | "approved" | "rejected" | "activated";
export type RiskMetric = keyof BrokerMetrics;
export type RuleOperator = ">" | ">=" | "<" | "<=" | "==";

export interface DeclarativeRiskRule {
  id: string;
  name: string;
  metric: RiskMetric;
  operator: RuleOperator;
  threshold: number;
  points: number;
  evidenceTemplate: string;
  enabled: boolean;
  sourceProposalId?: string;
}

export interface ProposalTest {
  name: string;
  passed: boolean;
  detail: string;
}

export interface GovernanceProposal {
  schemaVersion: "1.0";
  id: string;
  kind: ProposalKind;
  title: string;
  rationale: string;
  payload: unknown;
  provenance: Array<{ source: string; version: string; effectiveAt?: string }>;
  evidence: {
    tests: ProposalTest[];
    risks: string[];
    metrics?: Record<string, number>;
  };
  status: ProposalStatus;
  createdBy: string;
  reviewedBy?: string;
  reviewNote?: string;
  createdAt: string;
  reviewedAt?: string;
  activatedAt?: string;
}
