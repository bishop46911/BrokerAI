import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getDemoActor, parseProposalPackage, requireRole } from "@/lib/governance";
import { addAudit, store } from "@/lib/store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const status = url.searchParams.get("status");
  const proposals = store.proposals.filter((item) => (!kind || item.kind === kind) && (!status || item.status === status));
  return NextResponse.json(proposals);
}

export async function POST(request: Request) {
  try {
    const actor = getDemoActor(request);
    requireRole(actor.role, ["developer", "admin"]);
    const proposal = parseProposalPackage(await request.json());
    if (store.proposals.some((item) => item.id === proposal.id)) return NextResponse.json({ error: "该提案已经导入。" }, { status: 409 });
    proposal.createdBy = actor.name;
    store.proposals.unshift(proposal);
    addAudit(actor.name, "导入治理草稿", proposal.id, `${proposal.kind} · ${proposal.title}`);
    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "提案格式不符合治理契约。", issues: error.issues }, { status: 400 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "当前角色无权导入提案。" }, { status: 403 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "无法导入提案。" }, { status: 400 });
  }
}
