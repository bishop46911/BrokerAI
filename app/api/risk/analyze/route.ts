import { NextResponse } from "next/server";
import { brokers } from "@/lib/seed";
import { evaluateAll } from "@/lib/risk";
import { addAudit, store } from "@/lib/store";

export async function POST() {
  const previous = new Map(store.riskCases.map((item) => [item.id, item]));
  store.riskCases = evaluateAll(brokers, store.rules).slice(0, 30).map((item) => {
    const old = previous.get(item.id);
    return old ? { ...item, status: old.status, reviewerNote: old.reviewerNote, updatedAt: old.updatedAt } : item;
  });
  addAudit("系统", "风险扫描", "100 名中介 / 500 条交易", `生成 ${store.riskCases.length} 个需复核案件`);
  return NextResponse.json({ cases: store.riskCases, scanned: 100, transactions: 500 });
}
