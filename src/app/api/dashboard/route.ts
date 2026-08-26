import { NextResponse } from "next/server";
import { readCurrent, readHistory, readSnapshot } from "@/lib/storage";
import { classifyWallet } from "@/lib/classify";
import type { Snapshot } from "@/lib/types";

export const dynamic = "force-dynamic";

function movementSince(latest: Snapshot, baseline: Snapshot) {
  const baselineByOwner = new Map(baseline.holders.map((holder) => [holder.owner, BigInt(holder.amountRaw)]));
  const latestOwners = new Set(latest.holders.map((holder) => holder.owner));
  let entrants = 0;
  let increased = 0;
  let decreased = 0;
  let transferredRaw = 0n;

  for (const holder of latest.holders) {
    const previous = baselineByOwner.get(holder.owner);
    if (previous === undefined) {
      entrants += 1;
      transferredRaw += BigInt(holder.amountRaw);
      continue;
    }
    const delta = BigInt(holder.amountRaw) - previous;
    if (delta > 0n) {
      increased += 1;
      transferredRaw += delta;
    } else if (delta < 0n) {
      decreased += 1;
    }
  }

  const exits = baseline.holders.filter((holder) => !latestOwners.has(holder.owner)).length;
  return {
    entrants,
    exits,
    increased,
    decreased: decreased + exits,
    transferred: Number(transferredRaw) / 10 ** latest.decimals,
    comparedAt: baseline.capturedAt,
  };
}

export async function GET() {
  const [latest, history] = await Promise.all([readCurrent(), readHistory()]);
  const classifiedLatest = latest ? {
    ...latest,
    holders: latest.holders.map((holder) => ({ ...holder, ...classifyWallet(holder.owner) })),
  } : null;
  const targetTime = latest ? new Date(latest.capturedAt).getTime() - 12 * 60 * 60 * 1000 : 0;
  const baselineSummary = latest && history?.length
    ? [...history].reverse().find((point) => new Date(point.capturedAt).getTime() <= targetTime)
    : undefined;
  const baseline = baselineSummary ? await readSnapshot(baselineSummary.capturedAt) : null;
  const movement12h = latest && baseline ? movementSince(latest, baseline) : undefined;

  return NextResponse.json(classifiedLatest ? { ready: true, latest: classifiedLatest, history: history || [], movement12h } : { ready: false }, {
    headers: { "cache-control": "no-store" },
  });
}
