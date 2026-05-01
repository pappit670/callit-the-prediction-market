// src/components/TradeGraph.tsx
// Trading-grade step-based price graph for Callit prediction markets.
//
// Design rules:
//  - Step-based price (price only changes on trades)
//  - Monotone interpolation for visual smoothness
//  - Trade dot markers (size reflects trade amount)
//  - Volume bars below chart (green=YES, red=NO pressure)
//  - Hover tooltip: time + probability + volume
//  - Signature accent color: #F5C518
//  - No glow, no gradients on line, dark/light mode via CSS vars

import { useMemo, useState } from "react";
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Scatter,
} from "recharts";
import type { Trade } from "@/lib/orderbook";

// ── Types ──────────────────────────────────────────────────────
interface GraphPoint {
  time: string;
  timestamp: number;
  price: number;       // 0–100 (YES probability %)
  volume: number;
  yesVolume: number;
  noVolume: number;
  tradeSize?: number;  // for dot sizing
}

interface Props {
  trades: Trade[];
  currentPrice: number; // 0–1
  period: string;
  onPeriod: (p: string) => void;
}

const PERIODS = ["1H", "6H", "1D", "1W", "1M", "MAX"];

const PERIOD_MS: Record<string, number> = {
  "1H":  3_600_000,
  "6H": 21_600_000,
  "1D": 86_400_000,
  "1W": 604_800_000,
  "1M": 2_592_000_000,
  "MAX": 0,
};

const BUCKET_MS: Record<string, number> = {
  "1H":  60_000,          // 1min buckets
  "6H":  300_000,         // 5min
  "1D":  3_600_000,       // 1hr
  "1W":  21_600_000,      // 6hr
  "1M":  86_400_000,      // 1day
  "MAX": 86_400_000,
};

function fmtTime(ts: number, period: string): string {
  const d = new Date(ts);
  if (period === "1H" || period === "6H") {
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  if (period === "1D") {
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

// ── Custom tooltip ─────────────────────────────────────────────
const GraphTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as GraphPoint;
  if (!d) return null;

  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-xl text-xs min-w-[140px]">
      <p className="text-muted-foreground text-[10px] mb-1.5">{d.time}</p>
      <div className="flex items-center justify-between gap-3 mb-1">
        <span className="text-muted-foreground">Price</span>
        <span className="font-bold text-foreground tabular-nums">{d.price.toFixed(1)}%</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">Volume</span>
        <span className="font-semibold text-foreground tabular-nums">{d.volume.toLocaleString()}</span>
      </div>
    </div>
  );
};

// ── Custom trade dot ──────────────────────────────────────────
const TradeDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload?.tradeSize || payload.tradeSize <= 0) return null;
  const r = Math.min(8, Math.max(3, Math.log2(payload.tradeSize + 1) * 1.2));
  return (
    <circle
      cx={cx} cy={cy} r={r}
      fill="#F5C518"
      stroke="var(--card)"
      strokeWidth={1.5}
      opacity={0.9}
    />
  );
};

// ── Main Component ─────────────────────────────────────────────
export function TradeGraph({ trades, currentPrice, period, onPeriod }: Props) {

  const graphData = useMemo((): GraphPoint[] => {
    if (!trades.length) {
      // Return a flat line at current price
      const now = Date.now();
      return [
        { time: "Start", timestamp: now - 86_400_000, price: currentPrice * 100, volume: 0, yesVolume: 0, noVolume: 0 },
        { time: "Now",   timestamp: now,              price: currentPrice * 100, volume: 0, yesVolume: 0, noVolume: 0 },
      ];
    }

    const now = Date.now();
    const cutoff = PERIOD_MS[period] ? now - PERIOD_MS[period] : 0;
    const bucketMs = BUCKET_MS[period] ?? 3_600_000;

    // Filter by period
    const filtered = trades.filter(t => new Date(t.executed_at).getTime() >= cutoff);
    if (!filtered.length) {
      return [
        { time: "Start", timestamp: cutoff || now - 86_400_000, price: currentPrice * 100, volume: 0, yesVolume: 0, noVolume: 0 },
        { time: "Now",   timestamp: now, price: currentPrice * 100, volume: 0, yesVolume: 0, noVolume: 0 },
      ];
    }

    // Bucket trades
    const buckets = new Map<number, { prices: number[]; volume: number; yesVol: number; noVol: number; maxAmount: number }>();

    filtered.forEach(t => {
      const ts = new Date(t.executed_at).getTime();
      const bucket = Math.floor(ts / bucketMs) * bucketMs;
      const existing = buckets.get(bucket);
      const yesVol = t.price >= 0.5 ? t.amount : 0;
      const noVol = t.price < 0.5 ? t.amount : 0;

      if (existing) {
        existing.prices.push(t.price * 100);
        existing.volume += t.amount;
        existing.yesVol += yesVol;
        existing.noVol += noVol;
        existing.maxAmount = Math.max(existing.maxAmount, t.amount);
      } else {
        buckets.set(bucket, {
          prices: [t.price * 100],
          volume: t.amount,
          yesVol,
          noVol,
          maxAmount: t.amount,
        });
      }
    });

    // Step-based: carry forward last price
    const sortedBuckets = Array.from(buckets.entries()).sort(([a], [b]) => a - b);
    let lastPrice = currentPrice * 100;
    const points: GraphPoint[] = [];

    sortedBuckets.forEach(([ts, data]) => {
      // Step: use LAST trade price in bucket for accurate step behavior
      const bucketPrice = data.prices[data.prices.length - 1];
      lastPrice = bucketPrice;

      points.push({
        time: fmtTime(ts, period),
        timestamp: ts,
        price: Math.round(bucketPrice * 10) / 10,
        volume: Math.round(data.volume),
        yesVolume: Math.round(data.yesVol),
        noVolume: Math.round(data.noVol),
        tradeSize: data.maxAmount,
      });
    });

    // Add current price as final point if no recent trade
    const lastTs = sortedBuckets[sortedBuckets.length - 1]?.[0] ?? 0;
    if (now - lastTs > bucketMs) {
      points.push({
        time: "Now",
        timestamp: now,
        price: Math.round(currentPrice * 1000) / 10,
        volume: 0,
        yesVolume: 0,
        noVolume: 0,
      });
    }

    return points;
  }, [trades, period, currentPrice]);

  const minPrice = Math.max(0, Math.min(...graphData.map(p => p.price)) - 5);
  const maxPrice = Math.min(100, Math.max(...graphData.map(p => p.price)) + 5);
  const maxVol = Math.max(...graphData.map(p => p.volume), 1);

  return (
    <div className="space-y-1">
      {/* Main price chart */}
      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={graphData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(128,128,128,0.08)"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minPrice, maxPrice]}
            tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `${Math.round(v)}%`}
            width={36}
          />
          <Tooltip content={<GraphTooltip />} cursor={{ stroke: "rgba(128,128,128,0.2)", strokeWidth: 1 }} />

          {/* 50% reference line */}
          <ReferenceLine
            y={50}
            stroke="rgba(128,128,128,0.25)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />

          {/* Price line — step interpolation */}
          <Line
            type="monotone"
            dataKey="price"
            stroke="#F5C518"
            strokeWidth={1.5}
            dot={<TradeDot />}
            activeDot={{ r: 4, fill: "#F5C518", stroke: "var(--card)", strokeWidth: 2 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Volume bars */}
      <ResponsiveContainer width="100%" height={48}>
        <ComposedChart data={graphData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="time" hide />
          <YAxis hide domain={[0, maxVol]} />
          <Tooltip content={() => null} />
          <Bar dataKey="yesVolume" stackId="vol" fill="#2563EB" opacity={0.6} radius={0} />
          <Bar dataKey="noVolume"  stackId="vol" fill="#DC2626" opacity={0.6} radius={0} />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Period selector */}
      <div className="flex items-center justify-between gap-1 pt-1">
        <div className="flex items-center gap-0.5">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => onPeriod(p)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                period === p
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-[#2563EB]/60" />
            YES vol
          </span>
          <span className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-[#DC2626]/60" />
            NO vol
          </span>
        </div>
      </div>
    </div>
  );
}
