import { NextResponse } from "next/server";
import { z } from "zod";
import { addAudit, store } from "@/lib/store";

const schema = z.object({ answer: z.string().trim().min(10).max(5000) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const claim = store.claims.find((item) => item.id === id);
  if (!claim) return NextResponse.json({ error: "找不到该理赔草稿。" }, { status: 404 });
  try {
    const input = schema.parse(await request.json());
    claim.answer = input.answer;
    claim.status = "approved";
    claim.approvedAt = new Date().toISOString();
    addAudit("顾问演示账号", "批准客户答复", id, "已完成人工复核并批准");
    return NextResponse.json(claim);
  } catch {
    return NextResponse.json({ error: "批准内容无效。" }, { status: 400 });
  }
}
