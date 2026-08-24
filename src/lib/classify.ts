import type { Holder } from "./types";

type Classification = Pick<Holder, "category" | "label" | "protocol" | "verified" | "sourceName" | "sourceUrl" | "allocationNote" | "unlockAt">;

const VIRTUALS_SOURCE = "https://app.virtuals.io/virtuals/136564";
const METEORA_SOURCE = "https://github.com/MeteoraAg/docs/blob/main/developer-guides/damm-v2/index.mdx";

const VERIFIED_WALLETS: Record<string, Classification> = {
  D212j6ejH145U5TcEz9BXeENR5eip9itNcUPJbj1B5jd: {
    category: "pool",
    label: "Automated Capital Formation Pool",
    protocol: "Virtuals",
    verified: true,
    sourceName: "Virtuals holder registry",
    sourceUrl: VIRTUALS_SOURCE,
    allocationNote: "250M original allocation. Follows the Limit Order Program from $2M to $160M FDV.",
    unlockAt: null,
  },
  HLnpSz9h2S4hiLQ43rnSD9XkcUThA7B8hQMKmDaiTLcC: {
    category: "pool",
    label: "DAMM v2 Pool Authority",
    protocol: "Meteora",
    verified: true,
    sourceName: "Meteora DAMM v2 documentation",
    sourceUrl: METEORA_SOURCE,
    allocationNote: "Verified Meteora DAMM v2 pool authority for the active CMNS/VIRTUAL market.",
    unlockAt: null,
  },
  Cs7ZDjFYeJMZMur3XS5VxEhNcZmfRmf6QcvTiwjC5HuL: {
    category: "vesting",
    label: "Team · Default Team Vesting",
    protocol: "Virtuals",
    verified: true,
    sourceName: "Virtuals allocation schedule",
    sourceUrl: VIRTUALS_SOURCE,
    allocationNote: "250M allocation · 25% of total supply.",
    unlockAt: "2027-08-24T00:00:00.000Z",
  },
  "52dwNzfWa2MmHEUTJWTbKdjXpgiRG8kPiqWe7JZBJFv5": {
    category: "treasury",
    label: "Treasury · Strategic Reserve",
    protocol: "Virtuals",
    verified: true,
    sourceName: "Virtuals allocation schedule",
    sourceUrl: VIRTUALS_SOURCE,
    allocationNote: "200M allocation for CEX listings, strategic partnerships, and investors.",
    unlockAt: "2026-09-28T00:00:00.000Z",
  },
  AQ8aTQgvuSMwCqTfogi5nf1n1cx3xTAwkSV7gNz68DJ1: {
    category: "vesting",
    label: "Community · Program Reserve",
    protocol: "Virtuals",
    verified: true,
    sourceName: "Virtuals allocation schedule",
    sourceUrl: VIRTUALS_SOURCE,
    allocationNote: "80M allocation for mini-hackathons, airdrops, community initiatives, events, grants, and participation programs.",
    unlockAt: "2026-09-28T00:00:00.000Z",
  },
};

const USER_WALLET: Classification = {
  category: "user",
  label: "User wallet",
  protocol: null,
  verified: false,
  sourceName: null,
  sourceUrl: null,
  allocationNote: null,
  unlockAt: null,
};

export function classifyWallet(owner: string): Classification {
  return VERIFIED_WALLETS[owner] || USER_WALLET;
}
