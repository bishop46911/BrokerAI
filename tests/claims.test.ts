import { describe, expect, it } from "vitest";
import { createDemoAnswer, retrieveChunks, toCitation, validateCitations } from "../lib/claims";
import { knowledgeChunks } from "../lib/seed";

describe("claim copilot safety", () => {
  it("retrieves the waiting-period clause for an accident question", () => {
    const chunks = retrieveChunks("投保两周后意外住院，还在等待期吗？");
    expect(chunks.some((item) => item.clause.includes("等待期"))).toBe(true);
  });

  it("returns a supported answer with exact citations", () => {
    const answer = createDemoAnswer("意外住院需要什么理赔材料？", "保单已生效");
    expect(answer.citations.length).toBeGreaterThan(0);
    expect(validateCitations(answer.citations, knowledgeChunks)).toHaveLength(answer.citations.length);
    expect(answer.status).toBe("draft");
  });

  it("refuses when the corpus has no relevant evidence", () => {
    const answer = createDemoAnswer("宠物保险是否覆盖牙科清洁？");
    expect(answer.confidence).toBe("low");
    expect(answer.citations).toHaveLength(0);
    expect(answer.escalationReason).toContain("未检索到");
  });

  it("rejects a citation quote that is not in the source", () => {
    const citation = { ...toCitation(knowledgeChunks[0]), quote: "这段话并不存在" };
    expect(validateCitations([citation], knowledgeChunks)).toHaveLength(0);
  });
});
