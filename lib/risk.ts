import type { Broker, DeclarativeRiskRule, RiskCase, RiskEvidence, RuleOperator } from "./types";

export const riskRules: DeclarativeRiskRule[] = [
  { id: "rapid-replacement", name: "短期频繁换单", metric: "replacements30d", operator: ">=", threshold: 6, points: 25, evidenceTemplate: "30 日保单替换 {value} 次（阈值 {threshold}）", enabled: true },
  { id: "product-concentration", name: "产品销售高度集中", metric: "productConcentration", operator: ">=", threshold: .75, points: 12, evidenceTemplate: "单一产品占比 {percent}%（阈值 {thresholdPercent}%）", enabled: true },
  { id: "commission-outlier", name: "佣金比例异常", metric: "commissionRatio", operator: ">=", threshold: .25, points: 15, evidenceTemplate: "佣金/保费比例 {percent}%（阈值 {thresholdPercent}%）", enabled: true },
  { id: "refund-spike", name: "集中退款", metric: "refundRatio", operator: ">=", threshold: .15, points: 18, evidenceTemplate: "30 日退款率 {percent}%（阈值 {thresholdPercent}%）", enabled: true },
  { id: "shared-account", name: "重复收款账户", metric: "sharedAccountCount", operator: ">=", threshold: 3, points: 20, evidenceTemplate: "{value} 名客户使用相同收款账户（阈值 {threshold}）", enabled: true },
  { id: "complaint-spike", name: "投诉数量激增", metric: "complaints30d", operator: ">=", threshold: 3, points: 15, evidenceTemplate: "30 日内收到 {value} 宗投诉（阈值 {threshold}）", enabled: true },
  { id: "after-hours", name: "非正常时段操作", metric: "afterHoursRatio", operator: ">=", threshold: .3, points: 10, evidenceTemplate: "非正常时段操作占比 {percent}%（阈值 {thresholdPercent}%）", enabled: true },
];

export function evaluateBroker(broker: Broker, now = new Date(), rules: DeclarativeRiskRule[] = riskRules): RiskCase | null {
  const evidence: RiskEvidence[] = rules.filter((rule) => rule.enabled).flatMap((rule) => {
    const value = broker.metrics[rule.metric];
    const detail = compare(value, rule.operator, rule.threshold) ? formatEvidence(rule.evidenceTemplate, value, rule.threshold) : null;
    return detail ? [{ ruleId: rule.id, ruleName: rule.name, points: rule.points, detail }] : [];
  });
  if (evidence.length === 0) return null;

  const score = Math.min(100, evidence.reduce((sum, item) => sum + item.points, 0));
  const level = score >= 70 ? "high" : score >= 35 ? "medium" : "low";
  const top = evidence.slice().sort((a, b) => b.points - a.points).slice(0, 3);
  return {
    id: `RC-${broker.id.slice(3)}`,
    broker,
    score,
    level,
    status: "pending",
    evidence,
    summary: `${broker.name} 触发 ${evidence.length} 项预警，主要涉及${top.map((item) => item.ruleName).join("、")}。该结果仅用于安排进一步审查，不代表欺诈认定。`,
    nextSteps: ["核对相关交易及客户授权记录", "抽查销售沟通和适当性评估材料", "联系合规负责人决定是否升级调查"],
    reviewerNote: "",
    updatedAt: now.toISOString(),
  };
}

export function evaluateAll(brokers: Broker[], rules: DeclarativeRiskRule[] = riskRules) {
  return brokers.map((broker) => evaluateBroker(broker, new Date(), rules)).filter((item): item is RiskCase => item !== null).sort((a, b) => b.score - a.score);
}

export function compare(value: number, operator: RuleOperator, threshold: number) {
  if (operator === ">") return value > threshold;
  if (operator === ">=") return value >= threshold;
  if (operator === "<") return value < threshold;
  if (operator === "<=") return value <= threshold;
  return value === threshold;
}

function formatEvidence(template: string, value: number, threshold: number) {
  return template
    .replaceAll("{value}", String(value))
    .replaceAll("{threshold}", String(threshold))
    .replaceAll("{percent}", String(Math.round(value * 100)))
    .replaceAll("{thresholdPercent}", String(Math.round(threshold * 100)));
}
