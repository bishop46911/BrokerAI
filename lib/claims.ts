import { knowledgeChunks } from "./seed";
import type { Citation, ClaimAnswer, KnowledgeChunk } from "./types";

const stopWords = new Set(["请问", "是否", "可以", "需要", "什么", "如何", "客户", "理赔", "保险", "一个", "以及", "已经"]);

function tokenize(input: string) {
  const compact = input.toLowerCase().replace(/[，。？！、；：,.?!;:()（）]/g, " ");
  const phrases = ["等待期", "住院", "意外", "疾病", "材料", "发票", "时限", "通知", "审核", "免责", "责任免除", "既往症", "投保前", "美容", "酒驾", "多久"];
  const hits = phrases.filter((phrase) => compact.includes(phrase));
  const words = compact.split(/\s+/).filter((word) => word.length >= 2 && !stopWords.has(word));
  return [...new Set([...hits, ...words])];
}

export function retrieveChunks(question: string, chunks: KnowledgeChunk[] = knowledgeChunks, limit = 4) {
  const tokens = tokenize(question);
  return chunks
    .map((chunk) => {
      const haystack = `${chunk.documentName} ${chunk.clause} ${chunk.content}`.toLowerCase();
      let score = tokens.reduce((sum, token) => sum + (haystack.includes(token) ? (token.length > 2 ? 3 : 1) : 0), 0);
      if (/住院|医疗/.test(question) && /住院|医疗/.test(haystack)) score += 2;
      return { chunk, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ chunk }) => chunk);
}

export function toCitation(chunk: KnowledgeChunk): Citation {
  return {
    chunkId: chunk.id,
    documentName: chunk.documentName,
    clause: chunk.clause,
    page: chunk.page,
    quote: chunk.content,
  };
}

export function validateCitations(citations: Citation[], chunks: KnowledgeChunk[]) {
  const source = new Map(chunks.map((chunk) => [chunk.id, chunk]));
  return citations.filter((citation) => {
    const chunk = source.get(citation.chunkId);
    return Boolean(chunk && citation.documentName === chunk.documentName && citation.clause === chunk.clause && chunk.content.includes(citation.quote));
  });
}

export function createDemoAnswer(question: string, caseContext = "", now = new Date(), corpus: KnowledgeChunk[] = knowledgeChunks): ClaimAnswer {
  const chunks = retrieveChunks(`${question} ${caseContext}`, corpus);
  const id = `CLM-${now.getTime().toString(36).toUpperCase()}`;
  if (chunks.length === 0) {
    return {
      id,
      question,
      answer: "现有知识库没有足够依据回答这个问题。请补充对应保单、批注或理赔规则，并交由理赔专员确认。",
      citations: [],
      requiredDocuments: [],
      nextSteps: ["确认客户的具体保单及生效日期", "向理赔专员升级处理"],
      confidence: "low",
      escalationReason: "未检索到足以支持答案的有效条款",
      status: "draft",
      provider: "demo",
      createdAt: now.toISOString(),
    };
  }

  const hasAccident = /意外/.test(`${question}${caseContext}`);
  const hasWaiting = /等待期|刚投保|生效/.test(`${question}${caseContext}`);
  const hasDocs = /材料|文件|发票|申请/.test(`${question}${caseContext}`);
  const hasTimeline = /多久|时限|通知|审核/.test(`${question}${caseContext}`);
  const hasExclusion = /免责|责任免除|既往症|投保前|酒驾|美容/.test(`${question}${caseContext}`);
  const selected = chunks.filter((chunk) => {
    if (hasWaiting && /等待期|住院医疗费用/.test(chunk.clause)) return true;
    if (hasDocs && /申请材料/.test(chunk.clause)) return true;
    if (hasTimeline && /通知与时限|审核流程/.test(chunk.clause)) return true;
    if (hasExclusion && /责任免除/.test(chunk.clause)) return true;
    return false;
  });
  const sources = selected.length ? selected : chunks.slice(0, 2);

  let answer = "根据目前提供的信息，该情况可能属于住院医疗保障范围，但最终责任仍需结合保单状态、事故原因和完整材料审核。";
  if (hasWaiting) answer = hasAccident
    ? "条款显示，疾病住院设有 30 日等待期，但意外伤害导致的住院不设等待期。需要先核实本次住院是否确由意外导致，以及保单当时是否有效。"
    : "条款显示，疾病住院等待期为保单生效日起 30 日。需要核对住院原因和入院日期；续保合同不重新计算等待期。";
  if (hasDocs) answer = "申请住院医疗理赔通常需要申请书、身份证明、出院小结、诊断证明、费用发票原件和费用明细；如涉及意外，还需事故经过说明。";
  if (hasTimeline) answer = "指南要求在知道事故后 10 日内通知，并在治疗结束后 90 日内提交完整材料。普通案件收到完整材料后预计 5 个工作日内完成审核，复杂案件可能延长。";
  if (hasExclusion) answer = "该情况可能涉及责任免除或投保时的告知义务，不能仅凭当前信息判断是否属于保障范围。请核对投保资料、病历和完整保单，并升级理赔专员审核。";

  return {
    id,
    question,
    answer,
    citations: sources.map(toCitation),
    requiredDocuments: hasDocs || hasAccident ? ["理赔申请书", "身份证明", "出院小结与诊断证明", "费用发票及明细", ...(hasAccident ? ["事故经过说明"] : [])] : ["对应保单及批注", "住院诊断资料"],
    nextSteps: ["核对保单生效日及保障状态", "收集并检查理赔材料", "由授权顾问复核后再回复客户"],
    confidence: sources.length >= 2 ? "high" : "medium",
    escalationReason: hasExclusion ? "可能涉及责任免除，需要理赔专员判断" : null,
    status: "draft",
    provider: "demo",
    createdAt: now.toISOString(),
  };
}
