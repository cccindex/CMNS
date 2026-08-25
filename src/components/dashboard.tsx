"use client";

import { useEffect, useMemo, useState } from "react";
import type { DashboardPayload, Holder, SnapshotSummary } from "@/lib/types";

const MINT = "AMUgSjmdFsS8Y3JeL32u7A45Fpt8YF9xKaiwW5uGHdXk";
const PAIR = "DEGN92EGHuV3gKwzuF7j2G6Dg9UXhKpECw2eN6uuyD9R";
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 2 });
const precise = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });
const starFormat = new Intl.NumberFormat("en", { maximumFractionDigits: 8 });
const money = (value: number | null | undefined) => value == null ? "—" : `$${compact.format(value)}`;
const short = (address: string) => `${address.slice(0, 5)}…${address.slice(-5)}`;
const signed = (value: number) => `${value > 0 ? "+" : ""}${compact.format(value)}`;
const unlockDate = (value: string) => new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value));
type HolderFilter = "all" | "pool" | "protocol" | "controlled" | "user";
const PAGE_SIZE = 100;

function Sparkline({ history }: { history: SnapshotSummary[] }) {
  const values = history.slice(-72).map((point) => point.holderCount);
  if (values.length < 2) return <div className="empty-chart">More history appears after the next snapshot</div>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${42 - ((value - min) / range) * 34}`).join(" ");
  return <svg className="sparkline" viewBox="0 0 100 48" preserveAspectRatio="none" aria-label="Holder count history">
    <defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f3eedd" stopOpacity=".24"/><stop offset="1" stopColor="#f3eedd" stopOpacity="0"/></linearGradient></defs>
    <polygon points={`0,48 ${points} 100,48`} fill="url(#fill)" />
    <polyline points={points} fill="none" stroke="#f3eedd" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
  </svg>;
}

function Metric({ label, value, note, tone }: { label: string; value: string; note: string; tone?: string }) {
  return <article className="metric"><div className="metric-label">{label}</div><div className="metric-line"><div className={`metric-value ${tone || ""}`}>{value}</div><div className="metric-note">{note}</div></div></article>;
}

function HolderRow({ holder, priceUsd }: { holder: Holder; priceUsd: number | null }) {
  const deltaClass = holder.delta > 0 ? "positive" : holder.delta < 0 ? "negative" : "muted";
  return <tr>
    <td className="rank">{String(holder.rank).padStart(2, "0")}</td>
    <td><div className="wallet-cell"><div className="wallet-address-line"><a className="address" href={`https://solscan.io/account/${holder.owner}`} target="_blank" rel="noreferrer">{short(holder.owner)} <span>↗</span></a>{holder.protocol && <span className={`protocol-badge ${holder.category}`}>{holder.protocol}</span>}{holder.verified && <span className="verified-source" tabIndex={0}>✓<span className="source-tooltip"><b>VERIFIED SOURCE</b><strong>{holder.sourceName}</strong>{holder.allocationNote && <p>{holder.allocationNote}</p>}{holder.unlockAt && <em>UNLOCKS {unlockDate(holder.unlockAt)}</em>}<a href={holder.sourceUrl || "#"} target="_blank" rel="noreferrer">Open evidence ↗</a></span></span>}</div><span className={`wallet-label ${holder.category}`}>{holder.label}</span>{holder.unlockAt && <span className="unlock-date">UNLOCKS {unlockDate(holder.unlockAt)}</span>}</div></td>
    <td className="number strong">{precise.format(holder.balance)}</td>
    <td className="number usd-value">{priceUsd == null ? "—" : money(holder.balance * priceUsd)}</td>
    <td className="number star-score">{holder.category === "user" ? <><span aria-hidden>★</span>{starFormat.format(holder.stars || 0)}</> : "—"}</td>
    <td className="number"><div className="share"><span style={{ width: `${Math.min(holder.sharePct * 2, 70)}px` }} />{holder.sharePct.toFixed(2)}%</div></td>
    <td className={`number ${deltaClass}`}>{signed(holder.delta)}</td>
    <td className="number">{holder.status === "new" ? <span className="new-pill">NEW</span> : holder.rankChange ? `${holder.rankChange > 0 ? "↑" : "↓"} ${Math.abs(holder.rankChange)}` : "—"}</td>
  </tr>;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<HolderFilter>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/dashboard", { cache: "no-store" });
        if (!response.ok) throw new Error();
        const payload = await response.json();
        if (active) { setData(payload); setError(false); }
      } catch { if (active) setError(true); }
    };
    load();
    const timer = setInterval(load, 60_000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  const latest = data?.latest;
  const holders = useMemo(() => {
    if (!latest) return [];
    const needle = query.trim().toLowerCase();
    return latest.holders.filter((holder) => {
      const matchesFilter = filter === "all" || (filter === "controlled" ? holder.category === "treasury" || holder.category === "vesting" : holder.category === filter);
      const matchesQuery = !needle || `${holder.owner} ${holder.label} ${holder.protocol || ""}`.toLowerCase().includes(needle);
      return matchesFilter && matchesQuery;
    });
  }, [latest, query, filter]);

  useEffect(() => { setPage(1); }, [filter, query]);

  const totalPages = Math.max(1, Math.ceil(holders.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedHolders = holders.slice(pageStart, pageStart + PAGE_SIZE);

  const copyMint = async () => {
    await navigator.clipboard.writeText(MINT);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!data && !error) return <main className="loading"><div className="loader"/><span>Reading Solana state</span></main>;
  if (error) return <main className="loading"><div className="error-mark">!</div><span>Could not load holder data. Retrying automatically.</span></main>;
  if (!data?.ready || !latest) return <main className="loading"><div className="loader"/><span>Waiting for the first onchain snapshot</span></main>;

  const ageMinutes = Math.max(0, Math.floor((Date.now() - new Date(latest.capturedAt).getTime()) / 60_000));
  const history = data.history || [];
  const categoryCounts = latest.holders.reduce((counts, holder) => {
    counts[holder.category] = (counts[holder.category] || 0) + 1;
    return counts;
  }, {} as Record<Holder["category"], number>);
  const lockedHolders = latest.holders.filter((holder) => holder.category === "treasury" || holder.category === "vesting");
  const lockedBalance = lockedHolders.reduce((sum, holder) => sum + holder.balance, 0);
  const poolBalance = latest.holders.filter((holder) => holder.category === "pool").reduce((sum, holder) => sum + holder.balance, 0);
  const protocolBalance = latest.holders.filter((holder) => holder.category === "protocol").reduce((sum, holder) => sum + holder.balance, 0);
  const userBalance = latest.holders.filter((holder) => holder.category === "user").reduce((sum, holder) => sum + holder.balance, 0);
  const circulatingEstimate = Math.max(0, latest.trackedSupply - lockedBalance);
  const circulatingShare = (value: number) => circulatingEstimate ? value / circulatingEstimate * 100 : 0;
  const topHolderShare = (count: number) => latest.trackedSupply ? latest.holders.slice(0, count).reduce((sum, holder) => sum + holder.balance, 0) / latest.trackedSupply * 100 : 0;
  return <main>
    <header>
      <a className="brand" href="/"><span className="brand-mark">C</span><span>CMNS</span><small>Holder room</small></a>
      <nav>
        <a href="https://app.virtuals.io/virtuals/136564" target="_blank" rel="noreferrer">VIRTUALS ↗</a>
        <a href={`https://dexscreener.com/solana/${PAIR}`} target="_blank" rel="noreferrer">DEX ↗</a>
        <span className="live"><i/> LIVE · {ageMinutes === 0 ? "NOW" : `${ageMinutes}M AGO`}</span>
      </nav>
    </header>

    <section className="hero">
      <div><div className="eyebrow">COMMONS HOLDER ROOM <span>·</span> SOLANA</div><h1>Who owns<br/><em>the commons?</em></h1><p>Every wallet. Every movement. One fresh snapshot every ten minutes.</p><div className="hero-backing">Backed by <strong>Virtuals Protocol</strong></div></div>
      <button className="mint" onClick={copyMint}><span>MINT ADDRESS</span><b>{short(MINT)}</b><i>{copied ? "COPIED" : "COPY"}</i></button>
    </section>

    <section className="supply-overview panel">
      <div className="supply-cards">
        <article><span>USER / UNCLASSIFIED</span><div className="supply-value-row"><b className="acid">{compact.format(userBalance)}</b><small>{circulatingShare(userBalance).toFixed(1)}% of circulating</small></div></article>
        <article><span>LIQUIDITY POOLS</span><div className="supply-value-row"><b>{compact.format(poolBalance)}</b><small>{circulatingShare(poolBalance).toFixed(1)}% of circulating</small></div></article>
        <article><span>PROTOCOL / TEAM</span><div className="supply-value-row"><b>{compact.format(protocolBalance)}</b><small>{circulatingShare(protocolBalance).toFixed(1)}% of circulating</small></div></article>
      </div>
    </section>

    <section className="metrics">
      <Metric label="ONCHAIN HOLDERS" value={precise.format(latest.holderCount)} note={`${latest.entrants} entered · ${latest.exits} exited`} tone="acid" />
      <Metric label="TOKEN PRICE" value={latest.market.priceUsd == null ? "—" : `$${latest.market.priceUsd.toFixed(6)}`} note={`${latest.market.priceChange24h != null && latest.market.priceChange24h >= 0 ? "+" : ""}${latest.market.priceChange24h?.toFixed(2) ?? "—"}% over 24h`} tone={latest.market.priceChange24h && latest.market.priceChange24h < 0 ? "red" : ""} />
      <Metric label="MARKET CAP" value={money(latest.market.marketCap)} note={`${money(latest.market.volume24h)} volume / 24h`} />
    </section>

    <section className="concentration-strip">
      <div><span>HOLDER CONCENTRATION</span><p>Share of tracked CMNS held by the largest wallets, including pools and identified project wallets.</p></div>
      <dl><div><dt>TOP 10 HOLDERS</dt><dd>{topHolderShare(10).toFixed(2)}%</dd></div><div><dt>TOP 25 HOLDERS</dt><dd>{topHolderShare(25).toFixed(2)}%</dd></div></dl>
    </section>

    <section className="insight-grid">
      <article className="panel trend-panel"><div className="panel-head"><div><span className="kicker">HOLDER TREND</span><h2>{latest.holderCount} wallets</h2></div><span className="period">LAST 12H</span></div><Sparkline history={history} /><div className="trend-foot"><span><i className="dot acid-dot"/> Current holders</span><span>{history.length} snapshots saved</span></div></article>
      <article className="panel movement-panel"><div className="panel-head"><div><span className="kicker">SINCE LAST SNAPSHOT</span><h2>Wallet movement</h2></div><span className="period">10 MIN</span></div><div className="movement-stats"><div><b className="positive">+{latest.entrants}</b><span>NEW WALLETS</span></div><div><b className="positive">{latest.movers.increased}</b><span>ACCUMULATED</span></div><div><b className="negative">{latest.movers.decreased}</b><span>REDUCED / EXITED</span></div><div><b>{compact.format(latest.movers.transferred)}</b><span>CMNS MOVED</span></div></div></article>
    </section>

    <section className="panel table-panel">
      <div className="table-title"><div><span className="kicker">LIVE DISTRIBUTION</span><h2>{filter === "all" ? "All holders" : filter === "pool" ? "Liquidity pools" : filter === "protocol" ? "Protocol wallets" : filter === "controlled" ? "Treasury & vesting" : "User wallets"}</h2></div><label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search wallet or label" /></label></div>
      <div className="holder-filters">
        <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>ALL <b>{latest.holderCount}</b></button>
        <button className={filter === "pool" ? "active" : ""} onClick={() => setFilter("pool")}>POOLS <b>{categoryCounts.pool || 0}</b></button>
        <button className={filter === "protocol" ? "active" : ""} onClick={() => setFilter("protocol")}>PROTOCOL <b>{categoryCounts.protocol || 0}</b></button>
        <button className={filter === "controlled" ? "active" : ""} onClick={() => setFilter("controlled")}>TREASURY + VESTING <b>{(categoryCounts.treasury || 0) + (categoryCounts.vesting || 0)}</b></button>
        <button className={filter === "user" ? "active" : ""} onClick={() => setFilter("user")}>USERS <b>{categoryCounts.user || 0}</b></button>
      </div>
      <div className="table-scroll"><table><thead><tr><th>RANK</th><th>WALLET</th><th className="number">BALANCE</th><th className="number">USD VALUE</th><th className="number star-heading" title="Each eligible snapshot awards 0.00000001 Stars per CMNS held. Project-controlled wallets and pools are excluded.">★ STARS</th><th className="number">SHARE</th><th className="number">10M CHANGE</th><th className="number">RANK MOVE</th></tr></thead><tbody>{pagedHolders.map((holder) => <HolderRow key={holder.owner} holder={holder} priceUsd={latest.market.priceUsd} />)}</tbody></table></div>
      {!holders.length && <div className="no-results">No wallet matched this filter.</div>}
      {!!holders.length && <div className="pagination"><span>SHOWING {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, holders.length)} OF {holders.length}</span><div><button onClick={() => setPage(1)} disabled={currentPage === 1}>FIRST</button><button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1}>← PREV</button><b>PAGE {currentPage} / {totalPages}</b><button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage === totalPages}>NEXT →</button><button onClick={() => setPage(totalPages)} disabled={currentPage === totalPages}>LAST</button></div></div>}
    </section>

    <footer><span>CMNS HOLDER INTELLIGENCE</span><span>BLOCK {latest.slot.toLocaleString()} · {new Date(latest.capturedAt).toLocaleString()}</span><span>DATA: SOLANA RPC + DEXSCREENER</span></footer>
  </main>;
}
