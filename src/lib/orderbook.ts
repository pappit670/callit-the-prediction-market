// src/lib/orderbook.ts
// Lightweight orderbook price engine for Callit prediction markets.
// - Maintains bids (YES buyers) and asks (NO sellers / YES sellers at higher price)
// - Virtual liquidity ensures markets are never dead
// - Price determined by last matched trade
// - Large trades consume multiple levels, moving price more

import { supabase } from "@/supabaseClient";

// ── Types ──────────────────────────────────────────────────────
export interface Order {
  id: string;
  opinion_id: string;
  user_id: string;
  side: "YES" | "NO";
  price: number; // 0–1 representing YES probability
  amount: number;
  filled: number;
  status: "open" | "partial" | "filled" | "cancelled";
  created_at: string;
  is_virtual?: boolean;
}

export interface Trade {
  id: string;
  opinion_id: string;
  price: number;
  amount: number;
  executed_at: string;
  is_virtual: boolean;
}

export interface PriceLevel {
  price: number;
  amount: number;
  count: number;
}

export interface OrderbookState {
  bids: PriceLevel[]; // YES bids — sorted desc by price
  asks: PriceLevel[]; // NO asks / YES asks at higher price — sorted asc
  lastPrice: number;
  spread: number;
  midPrice: number;
}

// ── Virtual Liquidity Seeding ──────────────────────────────────
// Creates synthetic bid/ask levels so markets are never empty.
// Real user orders take priority.
function generateVirtualLevels(midPrice: number): { bids: PriceLevel[]; asks: PriceLevel[] } {
  const bids: PriceLevel[] = [];
  const asks: PriceLevel[] = [];

  // 5 levels each side
  const spreads = [0.02, 0.04, 0.06, 0.09, 0.13];
  const baseSize = [200, 150, 120, 100, 80];

  spreads.forEach((spread, i) => {
    const bidPrice = Math.max(0.01, midPrice - spread);
    const askPrice = Math.min(0.99, midPrice + spread);

    bids.push({
      price: Math.round(bidPrice * 100) / 100,
      amount: baseSize[i] + Math.round(Math.random() * 50),
      count: 1 + Math.floor(Math.random() * 3),
    });
    asks.push({
      price: Math.round(askPrice * 100) / 100,
      amount: baseSize[i] + Math.round(Math.random() * 50),
      count: 1 + Math.floor(Math.random() * 3),
    });
  });

  return { bids, asks };
}

// ── Merge real orders with virtual levels ──────────────────────
function mergeLevels(
  realOrders: Order[],
  virtualLevels: PriceLevel[],
  side: "YES" | "NO"
): PriceLevel[] {
  // Aggregate real orders into price levels
  const realMap = new Map<number, PriceLevel>();
  realOrders
    .filter((o) => o.side === side && o.status === "open")
    .forEach((o) => {
      const price = Math.round(o.price * 100) / 100;
      const existing = realMap.get(price);
      if (existing) {
        existing.amount += o.amount - o.filled;
        existing.count += 1;
      } else {
        realMap.set(price, {
          price,
          amount: o.amount - o.filled,
          count: 1,
        });
      }
    });

  // Merge: real orders supplement or replace virtual at same price
  const merged = new Map<number, PriceLevel>();

  // Add virtual first
  virtualLevels.forEach((l) => {
    merged.set(l.price, { ...l });
  });

  // Real orders override or add to virtual
  realMap.forEach((level, price) => {
    const existing = merged.get(price);
    if (existing) {
      // Real order adds liquidity on top of virtual
      merged.set(price, {
        price,
        amount: existing.amount + level.amount,
        count: existing.count + level.count,
      });
    } else {
      merged.set(price, level);
    }
  });

  const levels = Array.from(merged.values());

  // Sort: bids desc, asks asc
  if (side === "YES") return levels.sort((a, b) => b.price - a.price);
  return levels.sort((a, b) => a.price - b.price);
}

// ── OrderBook class ────────────────────────────────────────────
export class OrderBook {
  private opinionId: string;
  private lastPrice: number;
  private onTradeCallback?: (trade: Trade) => void;

  constructor(opinionId: string, initialPrice = 0.5) {
    this.opinionId = opinionId;
    this.lastPrice = initialPrice;
  }

  onTrade(cb: (trade: Trade) => void) {
    this.onTradeCallback = cb;
  }

  // Place a new order and attempt matching
  async placeOrder(
    userId: string,
    side: "YES" | "NO",
    price: number,
    amount: number
  ): Promise<{ order: Order | null; trades: Trade[]; error?: string }> {
    if (price < 0 || price > 1) return { order: null, trades: [], error: "Price must be between 0 and 1" };
    if (amount <= 0) return { order: null, trades: [], error: "Amount must be positive" };

    // Write order to DB
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        opinion_id: this.opinionId,
        user_id: userId,
        side,
        price,
        amount,
        filled: 0,
        status: "open",
      })
      .select()
      .single();

    if (error || !order) return { order: null, trades: [], error: error?.message };

    // Attempt matching
    const trades = await this.matchOrders(order as Order);

    return { order: order as Order, trades };
  }

  // Match incoming order against existing book
  private async matchOrders(newOrder: Order): Promise<Trade[]> {
    const trades: Trade[] = [];
    let remaining = newOrder.amount;

    // For a YES order: match against lowest-price NO orders (asks)
    // For a NO order: match against highest-price YES bids above threshold
    const opposingSide = newOrder.side === "YES" ? "NO" : "YES";

    const { data: opposing } = await supabase
      .from("orders")
      .select("*")
      .eq("opinion_id", this.opinionId)
      .eq("side", opposingSide)
      .eq("status", "open")
      .order("price", { ascending: newOrder.side === "YES" }) // YES wants low asks, NO wants high bids
      .limit(20);

    const matchable = (opposing || []).filter((o: Order) => {
      if (newOrder.side === "YES") {
        // YES buyer wants to pay ≥ ask price (YES price + NO price = 1)
        return o.price <= 1 - newOrder.price;
      } else {
        // NO seller wants YES price ≤ their offer
        return o.price >= 1 - newOrder.price;
      }
    });

    for (const opposite of matchable) {
      if (remaining <= 0) break;

      const fillAmount = Math.min(remaining, opposite.amount - opposite.filled);
      if (fillAmount <= 0) continue;

      const tradePrice =
        newOrder.side === "YES" ? newOrder.price : 1 - newOrder.price;

      // Execute the trade
      const trade = await this.executeTrade(
        newOrder.side === "YES" ? newOrder.id : opposite.id,
        newOrder.side === "YES" ? opposite.id : newOrder.id,
        tradePrice,
        fillAmount
      );

      if (trade) {
        trades.push(trade);
        remaining -= fillAmount;

        // Update filled amount on opposing order
        const newFilled = opposite.filled + fillAmount;
        await supabase
          .from("orders")
          .update({
            filled: newFilled,
            status: newFilled >= opposite.amount ? "filled" : "partial",
          })
          .eq("id", opposite.id);
      }
    }

    // Update new order's fill status
    const totalFilled = newOrder.amount - remaining;
    if (totalFilled > 0) {
      await supabase
        .from("orders")
        .update({
          filled: totalFilled,
          status: totalFilled >= newOrder.amount ? "filled" : "partial",
        })
        .eq("id", newOrder.id);
    }

    return trades;
  }

  private async executeTrade(
    buyOrderId: string,
    sellOrderId: string,
    price: number,
    amount: number,
    isVirtual = false
  ): Promise<Trade | null> {
    const { data: trade, error } = await supabase
      .from("trades")
      .insert({
        opinion_id: this.opinionId,
        buy_order_id: buyOrderId || null,
        sell_order_id: sellOrderId || null,
        price,
        amount,
        is_virtual: isVirtual,
      })
      .select()
      .single();

    if (error || !trade) return null;

    this.lastPrice = price;

    // Update last_trade_price on opinion
    await supabase
      .from("opinions")
      .update({ last_trade_price: price })
      .eq("id", this.opinionId);

    this.onTradeCallback?.(trade as Trade);

    // Push to price history
    await supabase.from("option_price_history").insert({
      opinion_id: this.opinionId,
      option_label: "Yes",
      percent: Math.round(price * 100),
      recorded_at: new Date().toISOString(),
    });

    return trade as Trade;
  }

  // Get current orderbook state
  async getState(): Promise<OrderbookState> {
    const { data: openOrders } = await supabase
      .from("orders")
      .select("*")
      .eq("opinion_id", this.opinionId)
      .eq("status", "open")
      .limit(200);

    const virtual = generateVirtualLevels(this.lastPrice);
    const bids = mergeLevels(openOrders || [], virtual.bids, "YES");
    const asks = mergeLevels(openOrders || [], virtual.asks, "NO");

    const bestBid = bids[0]?.price ?? this.lastPrice - 0.02;
    const bestAsk = asks[0]?.price ?? this.lastPrice + 0.02;
    const spread = Math.round((bestAsk - bestBid) * 100) / 100;
    const midPrice = Math.round(((bestBid + bestAsk) / 2) * 100) / 100;

    return {
      bids: bids.slice(0, 8),
      asks: asks.slice(0, 8),
      lastPrice: this.lastPrice,
      spread,
      midPrice,
    };
  }

  getLastPrice(): number {
    return this.lastPrice;
  }
}

// ── Fetch recent trades for a market ──────────────────────────
export async function fetchTrades(
  opinionId: string,
  limit = 100
): Promise<Trade[]> {
  const { data } = await supabase
    .from("trades")
    .select("*")
    .eq("opinion_id", opinionId)
    .order("executed_at", { ascending: true })
    .limit(limit);

  return (data || []) as Trade[];
}

// ── Calculate price impact for a given order size ─────────────
export function calculatePriceImpact(
  amount: number,
  bookLevels: PriceLevel[],
  currentPrice: number
): { newPrice: number; averageFillPrice: number; slippage: number } {
  let remaining = amount;
  let totalCost = 0;
  let consumed = 0;

  for (const level of bookLevels) {
    if (remaining <= 0) break;
    const fill = Math.min(remaining, level.amount);
    totalCost += fill * level.price;
    consumed += fill;
    remaining -= fill;
  }

  // If order larger than book, add extra slippage
  if (remaining > 0) {
    const extraSlippage = (remaining / amount) * 0.05;
    totalCost += remaining * (currentPrice + extraSlippage);
    consumed += remaining;
  }

  const averageFillPrice = consumed > 0 ? totalCost / consumed : currentPrice;
  const newPrice = Math.min(0.99, Math.max(0.01, averageFillPrice));
  const slippage = Math.abs(newPrice - currentPrice);

  return {
    newPrice: Math.round(newPrice * 100) / 100,
    averageFillPrice: Math.round(averageFillPrice * 100) / 100,
    slippage: Math.round(slippage * 1000) / 1000,
  };
}
