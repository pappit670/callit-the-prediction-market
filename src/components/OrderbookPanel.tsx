// src/components/OrderbookPanel.tsx
// Lightweight orderbook UI for Callit prediction markets.
// Shows YES bids (green) and NO asks (red) with depth bars.

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OrderBook, type OrderbookState, type PriceLevel } from "@/lib/orderbook";

interface Props {
  orderbook: OrderBook | null;
  lastPrice: number; // 0–1
  refreshInterval?: number; // ms, default 3000
}

function DepthBar({ amount, maxAmount, color }: { amount: number; maxAmount: number; color: string }) {
  const pct = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
  return (
    <div className="absolute inset-y-0 right-0 left-0 opacity-15 rounded" style={{ background: color }}>
      <div className="absolute inset-y-0 right-0" style={{ width: `${100 - pct}%`, background: "var(--card)" }} />
    </div>
  );
}

function PriceLevelRow({
  level, side, maxAmount, animate,
}: {
  level: PriceLevel;
  side: "YES" | "NO";
  maxAmount: number;
  animate: boolean;
}) {
  const color = side === "YES" ? "#2563EB" : "#DC2626";
  const pricePct = Math.round(level.price * 100);
  const remaining = Math.round(level.amount);

  return (
    <motion.div
      layout
      initial={animate ? { opacity: 0, x: side === "YES" ? -8 : 8 } : undefined}
      animate={{ opacity: 1, x: 0 }}
      className="relative flex items-center justify-between px-3 py-1.5 text-xs rounded overflow-hidden"
    >
      <DepthBar amount={level.amount} maxAmount={maxAmount} color={color} />
      <span className="relative z-10 font-bold tabular-nums" style={{ color }}>
        {pricePct}¢
      </span>
      <span className="relative z-10 text-muted-foreground tabular-nums">
        {remaining.toLocaleString()}
      </span>
    </motion.div>
  );
}

export function OrderbookPanel({ orderbook, lastPrice, refreshInterval = 3000 }: Props) {
  const [state, setState] = useState<OrderbookState | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!orderbook) return;
    const s = await orderbook.getState();
    setState(s);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [orderbook, refreshInterval]);

  const bids = state?.bids ?? [];
  const asks = state?.asks ?? [];
  const maxBidAmt = Math.max(...bids.map(b => b.amount), 1);
  const maxAskAmt = Math.max(...asks.map(a => a.amount), 1);
  const spread = state?.spread ?? 0;
  const lastPricePct = Math.round(lastPrice * 100);

  if (loading) {
    return (
      <div className="space-y-1">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-7 rounded bg-secondary animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Header row */}
      <div className="flex items-center justify-between px-3 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-bold border-b border-border/40">
        <span>Price</span>
        <span>Amount</span>
      </div>

      {/* Ask levels (NO side) — shown top, price ascending */}
      <div className="space-y-0.5">
        <AnimatePresence initial={false}>
          {asks.slice().reverse().map((level, i) => (
            <PriceLevelRow
              key={`ask-${level.price}-${i}`}
              level={level}
              side="NO"
              maxAmount={maxAskAmt}
              animate={i === 0}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Spread / last trade marker */}
      <div className="flex items-center gap-2 px-3 py-2 my-0.5 border-y border-border/40 bg-secondary/20">
        <div className="h-2 w-2 rounded-full bg-[#F5C518]" />
        <span className="text-sm font-black tabular-nums text-foreground">
          {lastPricePct}¢
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto">
          spread {Math.round(spread * 100)}¢
        </span>
      </div>

      {/* Bid levels (YES side) — price descending */}
      <div className="space-y-0.5">
        <AnimatePresence initial={false}>
          {bids.map((level, i) => (
            <PriceLevelRow
              key={`bid-${level.price}-${i}`}
              level={level}
              side="YES"
              maxAmount={maxBidAmt}
              animate={i === 0}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
