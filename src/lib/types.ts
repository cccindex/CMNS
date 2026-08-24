export type Holder = {
  rank: number;
  owner: string;
  balance: number;
  amountRaw: string;
  sharePct: number;
  delta: number;
  deltaRaw: string;
  rankChange: number;
  status: "new" | "up" | "down" | "unchanged";
  category: "pool" | "treasury" | "vesting" | "user";
  label: string;
  protocol: string | null;
  verified: boolean;
  sourceName: string | null;
  sourceUrl: string | null;
};

export type MarketData = {
  priceUsd: number | null;
  marketCap: number | null;
  liquidityUsd: number | null;
  volume24h: number | null;
  priceChange24h: number | null;
};

export type SnapshotSummary = {
  capturedAt: string;
  slot: number;
  holderCount: number;
  top1Pct: number;
  top5Pct: number;
  top10Pct: number;
  entrants: number;
  exits: number;
  market: MarketData;
};

export type Snapshot = SnapshotSummary & {
  version: 1;
  mint: string;
  symbol: "CMNS";
  decimals: number;
  supply: number;
  supplyRaw: string;
  trackedSupply: number;
  tokenAccountCount: number;
  holders: Holder[];
  movers: { increased: number; decreased: number; transferred: number };
  concentration: {
    poolBalance: number;
    poolSharePct: number;
    nonPoolSupply: number;
    nonPoolHolderCount: number;
    nonPoolTop1Pct: number;
    nonPoolTop5Pct: number;
    nonPoolTop10Pct: number;
  };
};

export type DashboardPayload = {
  ready: boolean;
  latest?: Snapshot;
  history?: SnapshotSummary[];
};
