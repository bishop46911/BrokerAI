import { NextResponse } from "next/server";
import { z } from "zod";
import { getDemoActor, requireRole } from "@/lib/governance";
import { reviewProposal, submitProposal } from "@/lib/governance-service";
import { store } from "@/lib/store";

const bodySchema = z.object({ action: z.enum(["submit", "approve", "reject"]), note: z.string().max(2000).default("") }).strict();

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const proposal = store.proposals.find((item) => item.id === id);
  if (!proposal) return NextResponse.json({ error: "找不到该提案。" }, { status: 404 });
  try {
    const actor = getDemoActor(request);
    const body = bodySchema.parse(await request.json());
    if (body.action === "submit") {
      requireRole(actor.role, ["developer"]);
      return NextResponse.json(submitProposal(proposal, actor.name));
    }
    requireRole(actor.role, ["compliance"]);
    return NextResponse.json(reviewProposal(proposal, actor.name, body.action, body.note));
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    const errors: Record<string, string> = {
      FORBIDDEN: "当前角色没有执行该操作的权限。", INVALID_STATE: "提案当前状态不允许该操作。",
      SELF_APPROVAL: "创建者不能批准自己的提案。", NOTE_REQUIRED: "审批或拒绝必须填写复核意见。",
      FAILED_GATES: "提案仍有未通过的强制门禁。",
    };
    return NextResponse.json({ error: errors[message] || "请求内容无效。" }, { status: message === "FORBIDDEN" ? 403 : 400 });
  }
}
