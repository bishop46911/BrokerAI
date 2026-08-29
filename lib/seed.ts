import type { Broker, KnowledgeChunk } from "./types";

export const knowledgeChunks: KnowledgeChunk[] = [
  {
    id: "chunk-hospital-01",
    documentId: "doc-health-protect",
    documentName: "安心住院医疗保险条款（演示版）",
    clause: "第 4.2 条 住院医疗费用",
    page: 8,
    content: "被保险人因疾病或意外伤害，经认可医院医生诊断必须住院治疗的，本公司按约定赔付住院期间实际发生且合理必要的医疗费用。",
  },
  {
    id: "chunk-waiting-01",
    documentId: "doc-health-protect",
    documentName: "安心住院医疗保险条款（演示版）",
    clause: "第 6.1 条 等待期",
    page: 12,
    content: "本合同疾病住院等待期为生效日起三十日；因意外伤害导致的住院不设等待期。续保合同不重新计算等待期。",
  },
  {
    id: "chunk-claim-docs-01",
    documentId: "doc-claim-guide",
    documentName: "医疗理赔申请指南（演示版）",
    clause: "第 2 节 申请材料",
    page: 3,
    content: "住院医疗理赔应提交理赔申请书、身份证明、出院小结、诊断证明、费用发票原件及费用明细清单；涉及意外事故时还应提交事故经过说明。",
  },
  {
    id: "chunk-notice-01",
    documentId: "doc-claim-guide",
    documentName: "医疗理赔申请指南（演示版）",
    clause: "第 3 节 通知与时限",
    page: 4,
    content: "申请人应在知道保险事故发生后十日内通知本公司，并在治疗结束后九十日内提交完整理赔材料。材料不完整时，本公司将一次性通知补充。",
  },
  {
    id: "chunk-exclusion-01",
    documentId: "doc-health-protect",
    documentName: "安心住院医疗保险条款（演示版）",
    clause: "第 7.3 条 责任免除",
    page: 15,
    content: "对于投保前已存在且投保时未如实告知的疾病、非医学必需的美容治疗，以及酒后驾驶导致的伤害，本公司不承担本合同约定的医疗费用责任。",
  },
  {
    id: "chunk-review-01",
    documentId: "doc-claim-guide",
    documentName: "医疗理赔申请指南（演示版）",
    clause: "第 5 节 审核流程",
    page: 7,
    content: "收到完整材料后，普通案件预计在五个工作日内完成审核；复杂案件可能需要进一步调查。最终责任认定以正式理赔决定书为准。",
  },
];

function metric(i: number, base: number, spread: number) {
  return Number((base + ((i * 37) % 100) / 100 * spread).toFixed(2));
}

export const brokers: Broker[] = Array.from({ length: 100 }, (_, i) => {
  const flagged = i % 13 === 0 || i % 17 === 0;
  return {
    id: `BR-${String(i + 1).padStart(4, "0")}`,
    name: ["陈嘉明", "梁思敏", "黄俊杰", "李慧仪", "周子健", "何雅雯", "林家豪", "吴芷晴"][i % 8] + (i > 7 ? ` ${i + 1}` : ""),
    region: ["港岛", "九龙", "新界", "跨区"][i % 4],
    clients: 38 + ((i * 29) % 180),
    premium: 320000 + ((i * 91337) % 2600000),
    metrics: flagged
      ? {
          replacements30d: 7 + (i % 6),
          productConcentration: metric(i, 0.76, 0.2),
          commissionRatio: metric(i, 0.24, 0.18),
          refundRatio: metric(i, 0.14, 0.22),
          sharedAccountCount: 3 + (i % 5),
          complaints30d: 3 + (i % 4),
          afterHoursRatio: metric(i, 0.3, 0.32),
        }
      : {
          replacements30d: i % 4,
          productConcentration: metric(i, 0.25, 0.38),
          commissionRatio: metric(i, 0.08, 0.11),
          refundRatio: metric(i, 0.01, 0.08),
          sharedAccountCount: i % 2,
          complaints30d: i % 2,
          afterHoursRatio: metric(i, 0.05, 0.16),
        },
  };
});
