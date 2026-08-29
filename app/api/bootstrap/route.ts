import { NextResponse } from "next/server";
import { getBootstrapSnapshot } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getBootstrapSnapshot());
}
