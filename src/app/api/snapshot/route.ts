import { NextRequest, NextResponse } from "next/server";
import { fetchHolders, fetchMarket, MINT } from "@/lib/solana";
import { readCurrent, saveSnapshot } from "@/lib/storage";
import type { Holder, Snapshot } from "@/lib/types";
import { classifyWallet } from "@/lib/classify";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const pct = (raw: bigint, supply: bigint) => supply === 0n ? 0 : Number((raw * 1_000_000n) / supply) / 10_000;
const STAR_RATE_PER_SNAPSHOT = 0.00000001;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const previous = await readCurrent();
    const [{ balances, decimals, slot, supplyRaw, tokenAccountCount }, market] = await Promise.all([fetchHolders(), fetchMarket()]);
    const supplyBigInt = BigInt(supplyRaw);
    const divisor = 10 ** decimals;
    const previousByOwner = new Map((previous?.holders || []).map((holder) => [holder.owner, holder]));
    const sorted = [...balances.entries()].sort((a, b) => a[1] === b[1] ? 0 : a[1] > b[1] ? -1 : 1);

    const holders: Holder[] = sorted.map(([owner, amount], index) => {
      const old = previousByOwner.get(owner);
      const deltaRaw = previous ? amount - BigInt(old?.amountRaw || "0") : 0n;
      const rank = index + 1;
      const balance = Number(amount) / divisor;
      const classification = classifyWallet(owner);
      return {
        rank,
        owner,
        balance,
        amountRaw: amount.toString(),
        sharePct: pct(amount, supplyBigInt),
        delta: Number(deltaRaw) / divisor,
        deltaRaw: deltaRaw.toString(),
        rankChange: old ? old.rank - rank : 0,
        stars: classification.category === "user" ? (old?.stars || 0) + balance * STAR_RATE_PER_SNAPSHOT : 0,
        status: !previous ? "unchanged" : !old ? "new" : deltaRaw > 0n ? "up" : deltaRaw < 0n ? "down" : "unchanged",
        ...classification,
      };
    });

    const currentOwners = new Set(holders.map((holder) => holder.owner));
    const entrants = previous ? holders.filter((holder) => holder.status === "new").length : 0;
    const exits = previous ? previous.holders.filter((holder) => !currentOwners.has(holder.owner)).length : 0;
    const increased = holders.filter((holder) => holder.status === "up").length;
    const decreased = holders.filter((holder) => holder.status === "down").length + exits;
    const transferredRaw = holders.reduce((sum, holder) => {
      const value = BigInt(holder.deltaRaw);
      return value > 0n && previous ? sum + value : sum;
    }, 0n);
    const totalTop = (count: number) => holders.slice(0, count).reduce((sum, holder) => sum + BigInt(holder.amountRaw), 0n);
    const trackedRaw = holders.reduce((sum, holder) => sum + BigInt(holder.amountRaw), 0n);
    const poolHolders = holders.filter((holder) => holder.category === "pool");
    const nonPoolHolders = holders.filter((holder) => holder.category !== "pool");
    const poolRaw = poolHolders.reduce((sum, holder) => sum + BigInt(holder.amountRaw), 0n);
    const nonPoolRaw = trackedRaw - poolRaw;
    const nonPoolTop = (count: number) => nonPoolHolders.slice(0, count).reduce((sum, holder) => sum + BigInt(holder.amountRaw), 0n);
    const nonPoolPct = (raw: bigint) => pct(raw, nonPoolRaw);

    const snapshot: Snapshot = {
      version: 1,
      mint: MINT,
      symbol: "CMNS",
      capturedAt: new Date().toISOString(),
      slot,
      decimals,
      supplyRaw,
      supply: Number(supplyBigInt) / divisor,
      trackedSupply: Number(trackedRaw) / divisor,
      tokenAccountCount,
      holderCount: holders.length,
      top1Pct: pct(totalTop(1), supplyBigInt),
      top5Pct: pct(totalTop(5), supplyBigInt),
      top10Pct: pct(totalTop(10), supplyBigInt),
      entrants,
      exits,
      holders,
      market,
      movers: { increased, decreased, transferred: Number(transferredRaw) / divisor },
      concentration: {
        poolBalance: Number(poolRaw) / divisor,
        poolSharePct: pct(poolRaw, trackedRaw),
        nonPoolSupply: Number(nonPoolRaw) / divisor,
        nonPoolHolderCount: nonPoolHolders.length,
        nonPoolTop1Pct: nonPoolPct(nonPoolTop(1)),
        nonPoolTop5Pct: nonPoolPct(nonPoolTop(5)),
        nonPoolTop10Pct: nonPoolPct(nonPoolTop(10)),
      },
    };
    await saveSnapshot(snapshot);
    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Snapshot failed" }, { status: 500 });
  }
}
