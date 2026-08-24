import bs58 from "bs58";
import type { MarketData } from "./types";

export const MINT = "AMUgSjmdFsS8Y3JeL32u7A45Fpt8YF9xKaiwW5uGHdXk";
export const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const DEX_PAIR = "DEGN92EGHuV3gKwzuF7j2G6Dg9UXhKpECw2eN6uuyD9R";
const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

type RpcTokenAccounts = {
  result?: { context: { slot: number }; value: Array<{ account: { data: [string, string] } }> };
  error?: { message: string };
};
type RpcSupply = {
  result?: { value: { amount: string; decimals: number } };
  error?: { message: string };
};

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: method, method, params }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Solana RPC returned ${response.status}`);
  return response.json() as Promise<T>;
}

export async function fetchHolders() {
  const [accountsResponse, supplyResponse] = await Promise.all([
    rpc<RpcTokenAccounts>("getProgramAccounts", [TOKEN_PROGRAM, {
      withContext: true,
      encoding: "base64",
      filters: [{ dataSize: 165 }, { memcmp: { offset: 0, bytes: MINT } }],
      dataSlice: { offset: 32, length: 40 },
    }]),
    rpc<RpcSupply>("getTokenSupply", [MINT]),
  ]);

  if (!accountsResponse.result) throw new Error(accountsResponse.error?.message || "Unable to fetch token accounts");
  if (!supplyResponse.result) throw new Error(supplyResponse.error?.message || "Unable to fetch token supply");

  const balances = new Map<string, bigint>();
  for (const row of accountsResponse.result.value) {
    const bytes = Buffer.from(row.account.data[0], "base64");
    if (bytes.length < 40) continue;
    const amount = bytes.readBigUInt64LE(32);
    if (amount === 0n) continue;
    const owner = bs58.encode(bytes.subarray(0, 32));
    balances.set(owner, (balances.get(owner) || 0n) + amount);
  }

  return {
    slot: accountsResponse.result.context.slot,
    tokenAccountCount: accountsResponse.result.value.length,
    balances,
    decimals: supplyResponse.result.value.decimals,
    supplyRaw: supplyResponse.result.value.amount,
  };
}

export async function fetchMarket(): Promise<MarketData> {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/pairs/solana/${DEX_PAIR}`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!response.ok) throw new Error("Market data unavailable");
    const json = await response.json();
    const pair = json.pair || json.pairs?.[0];
    return {
      priceUsd: pair?.priceUsd ? Number(pair.priceUsd) : null,
      marketCap: pair?.marketCap ? Number(pair.marketCap) : null,
      liquidityUsd: pair?.liquidity?.usd ? Number(pair.liquidity.usd) : null,
      volume24h: pair?.volume?.h24 ? Number(pair.volume.h24) : null,
      priceChange24h: pair?.priceChange?.h24 != null ? Number(pair.priceChange.h24) : null,
    };
  } catch {
    return { priceUsd: null, marketCap: null, liquidityUsd: null, volume24h: null, priceChange24h: null };
  }
}
