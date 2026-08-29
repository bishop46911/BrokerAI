import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json(
    { error: "知识文档必须先生成治理提案，再经合规批准和管理员启用。" },
    { status: 409 },
  );
}
