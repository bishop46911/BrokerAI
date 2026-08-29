import { NextResponse } from "next/server";
import { z } from "zod";
import { answerClaim } from "@/lib/model";
import { addAudit, store } from "@/lib/store";

const requestSchema = z.object({
  question: z.string().trim().min(4).max(1000),
  caseContext: z.string().trim().max(3000).optional().default(""),
});

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await request.json());
    const answer = await answerClaim(input.question, input.caseContext, store.chunks);
    store.claims.unshift(answer);
    addAudit("顾问演示账号", "生成理赔草稿", answer.id, `${answer.provider === "model" ? "模型" : "演示"}模式；${answer.citations.length} 条引用`);
    return NextResponse.json(answer);
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "请输入至少 4 个字符的问题，案件信息不得超过 3000 字。" }, { status: 400 });
    return NextResponse.json({ error: "暂时无法生成答复，请稍后重试。" }, { status: 500 });
  }
}
