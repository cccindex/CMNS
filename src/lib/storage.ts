import { head, put } from "@vercel/blob";
import type { Snapshot, SnapshotSummary } from "./types";

const CURRENT_PATH = "data/current.json";
const HISTORY_PATH = "data/history.json";
const MAX_HISTORY = 90 * 24 * 6;

async function readJson<T>(pathname: string): Promise<T | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  try {
    const blob = await head(pathname, { token });
    const response = await fetch(`${blob.url}?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return null;
    return response.json() as Promise<T>;
  } catch {
    return null;
  }
}

export const readCurrent = () => readJson<Snapshot>(CURRENT_PATH);
export const readHistory = () => readJson<SnapshotSummary[]>(HISTORY_PATH);

export async function saveSnapshot(snapshot: Snapshot) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  const existingHistory = (await readHistory()) || [];
  const summary: SnapshotSummary = {
    capturedAt: snapshot.capturedAt,
    slot: snapshot.slot,
    holderCount: snapshot.holderCount,
    top1Pct: snapshot.top1Pct,
    top5Pct: snapshot.top5Pct,
    top10Pct: snapshot.top10Pct,
    entrants: snapshot.entrants,
    exits: snapshot.exits,
    market: snapshot.market,
  };
  const history = [...existingHistory, summary].slice(-MAX_HISTORY);
  const immutablePath = `snapshots/${snapshot.capturedAt.replace(/[:.]/g, "-")}.json`;
  const common = { access: "public" as const, addRandomSuffix: false, contentType: "application/json", token };

  await Promise.all([
    put(immutablePath, JSON.stringify(snapshot), common),
    put(CURRENT_PATH, JSON.stringify(snapshot), { ...common, allowOverwrite: true }),
    put(HISTORY_PATH, JSON.stringify(history), { ...common, allowOverwrite: true }),
  ]);
}
