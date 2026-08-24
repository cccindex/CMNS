# CMNS Holder Intelligence

Onchain holder analytics for Commons by Virtuals (`CMNS`) on Solana.

The app fetches every SPL token account for the CMNS mint, aggregates balances by owner, saves an immutable snapshot every ten minutes, and displays holder concentration and wallet movement over time.

## Local development

1. Run `npm install`.
2. Pull the Vercel environment with `npx vercel env pull .env.local`.
3. Run `npm run dev`.

## Data pipeline

- Solana JSON-RPC is the source of truth for balances and supply.
- DexScreener supplies current market data.
- Vercel Cron calls `/api/snapshot` every ten minutes.
- Vercel Blob stores the latest state, rolling chart history, and immutable full snapshots.

The snapshot endpoint requires the `CRON_SECRET` bearer token.
