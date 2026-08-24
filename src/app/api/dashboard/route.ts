import { NextResponse } from "next/server";
import { readCurrent, readHistory } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const [latest, history] = await Promise.all([readCurrent(), readHistory()]);
  return NextResponse.json(latest ? { ready: true, latest, history: history || [] } : { ready: false }, {
    headers: { "cache-control": "no-store" },
  });
}
