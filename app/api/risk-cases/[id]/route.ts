import { NextResponse } from "next/server";
import { z } from "zod";
import { updateRiskCase } from "@/lib/store";

const schema = z.object({
  status: z.enum(["pending", "investigating", "confirmed", "false_positive", "closed"]),
  reviewerNote: z.string().max(2000).default(""),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const input = schema.parse(await request.json());
    const item = updateRiskCase(id, input.status, input.reviewerNote);
    return item ? NextResponse.json(item) : NextResponse.json({ error: "找不到该风险案件。" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "状态或复核意见无效。" }, { status: 400 });
  }
}
