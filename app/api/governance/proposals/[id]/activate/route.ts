import { NextResponse } from "next/server";
import { getDemoActor, requireRole } from "@/lib/governance";
import { activateProposal } from "@/lib/governance-service";
import { store } from "@/lib/store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const proposal = store.proposals.find((item) => item.id === id);
  if (!proposal) return NextResponse.json({ error: "找不到该提案。" }, { status: 404 });
  try {
    const actor = getDemoActor(request);
    requireRole(actor.role, ["admin"]);
    return NextResponse.json(activateProposal(proposal, actor.name));
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    return NextResponse.json({ error: message === "FORBIDDEN" ? "只有管理员可以启用提案。" : "只有已批准提案可以启用。" }, { status: message === "FORBIDDEN" ? 403 : 400 });
  }
}
