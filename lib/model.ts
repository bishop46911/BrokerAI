import { z } from "zod";
import { createDemoAnswer, retrieveChunks, validateCitations } from "./claims";
import { knowledgeChunks } from "./seed";
import type { ClaimAnswer, KnowledgeChunk } from "./types";

const modelAnswerSchema = z.object({
  answer: z.string(),
  citations: z.array(z.object({
    chunkId: z.string(),
    documentName: z.string(),
    clause: z.string(),
    page: z.number(),
    quote: z.string(),
  })),
  requiredDocuments: z.array(z.string()),
  nextSteps: z.array(z.string()),
  confidence: z.enum(["high", "medium", "low"]),
  escalationReason: z.string().nullable(),
});

const jsonSchema = {
  name: "claim_answer",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["answer", "citations", "requiredDocuments", "nextSteps", "confidence", "escalationReason"],
    properties: {
      answer: { type: "string" },
      citations: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["chunkId", "documentName", "clause", "page", "quote"],
          properties: {
            chunkId: { type: "string" }, documentName: { type: "string" }, clause: { type: "string" }, page: { type: "number" }, quote: { type: "string" },
          },
        },
      },
      requiredDocuments: { type: "array", items: { type: "string" } },
      nextSteps: { type: "array", items: { type: "string" } },
      confidence: { type: "string", enum: ["high", "medium", "low"] },
      escalationReason: { anyOf: [{ type: "string" }, { type: "null" }] },
    },
  },
};

export async function answerClaim(question: string, caseContext = "", corpus: KnowledgeChunk[] = knowledgeChunks): Promise<ClaimAnswer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return createDemoAnswer(question, caseContext, new Date(), corpus);

  const chunks = retrieveChunks(`${question} ${caseContext}`, corpus);
  if (chunks.length === 0) return createDemoAnswer(question, caseContext, new Date(), corpus);

  try {
    const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        temperature: 0,
        messages: [
          {
            role: "system",
            content: "你是保险理赔顾问助手。只能根据提供的演示条款回答，不可判赔或拒赔。逐字引用来源；依据不足时明确升级人工。",
          },
          {
            role: "user",
            content: `客户问题：${question}\n案件情况：${caseContext || "未提供"}\n\n可用条款：\n${formatChunks(chunks)}`,
          },
        ],
        response_format: { type: "json_schema", json_schema: jsonSchema },
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`Model returned ${response.status}`);
    const body = await response.json();
    const parsed = modelAnswerSchema.parse(JSON.parse(body.choices?.[0]?.message?.content ?? "{}"));
    const citations = validateCitations(parsed.citations, chunks);
    if (citations.length === 0) throw new Error("No valid citations");
    const now = new Date();
    return {
      id: `CLM-${now.getTime().toString(36).toUpperCase()}`,
      question,
      ...parsed,
      citations,
      status: "draft",
      provider: "model",
      createdAt: now.toISOString(),
    };
  } catch {
    const fallback = createDemoAnswer(question, caseContext, new Date(), corpus);
    fallback.escalationReason = fallback.escalationReason || "模型暂时不可用，已切换到安全演示答案";
    return fallback;
  }
}

function formatChunks(chunks: KnowledgeChunk[]) {
  return chunks.map((chunk) => `[${chunk.id}] ${chunk.documentName}｜${chunk.clause}｜第 ${chunk.page} 页\n${chunk.content}`).join("\n\n");
}
