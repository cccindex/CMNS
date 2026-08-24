import type { Holder } from "./types";

type Classification = Pick<Holder, "category" | "label" | "protocol" | "verified" | "sourceName" | "sourceUrl">;

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
  },
  HLnpSz9h2S4hiLQ43rnSD9XkcUThA7B8hQMKmDaiTLcC: {
    category: "pool",
    label: "DAMM v2 Pool Authority",
    protocol: "Meteora",
    verified: true,
    sourceName: "Meteora DAMM v2 documentation",
    sourceUrl: METEORA_SOURCE,
  },
  Cs7ZDjFYeJMZMur3XS5VxEhNcZmfRmf6QcvTiwjC5HuL: {
    category: "vesting",
    label: "Team Vesting",
    protocol: "Virtuals",
    verified: true,
    sourceName: "Virtuals allocation schedule",
    sourceUrl: VIRTUALS_SOURCE,
  },
  "52dwNzfWa2MmHEUTJWTbKdjXpgiRG8kPiqWe7JZBJFv5": {
    category: "treasury",
    label: "Treasury Vesting",
    protocol: "Virtuals",
    verified: true,
    sourceName: "Virtuals allocation schedule",
    sourceUrl: VIRTUALS_SOURCE,
  },
  AQ8aTQgvuSMwCqTfogi5nf1n1cx3xTAwkSV7gNz68DJ1: {
    category: "vesting",
    label: "Community Vesting",
    protocol: "Virtuals",
    verified: true,
    sourceName: "Virtuals allocation schedule",
    sourceUrl: VIRTUALS_SOURCE,
  },
};

const USER_WALLET: Classification = {
  category: "user",
  label: "User wallet",
  protocol: null,
  verified: false,
  sourceName: null,
  sourceUrl: null,
};

export function classifyWallet(owner: string): Classification {
  return VERIFIED_WALLETS[owner] || USER_WALLET;
}
