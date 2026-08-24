import { NextResponse } from "next/server";
import { readCurrent, readHistory } from "@/lib/storage";
import { classifyWallet } from "@/lib/classify";

export const dynamic = "force-dynamic";

export async function GET() {
  const [latest, history] = await Promise.all([readCurrent(), readHistory()]);
  const classifiedLatest = latest ? {
    ...latest,
    holders: latest.holders.map((holder) => ({ ...holder, ...classifyWallet(holder.owner) })),
  } : null;
  return NextResponse.json(classifiedLatest ? { ready: true, latest: classifiedLatest, history: history || [] } : { ready: false }, {
    headers: { "cache-control": "no-store" },
  });
}
