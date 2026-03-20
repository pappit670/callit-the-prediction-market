import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { TrendingUp, Users, Coins } from "lucide-react";

interface MarketStatsProps {
  opinionId: string;
  callCount: number;
  coinsStaked?: number;
  compact?: boolean;
}

export function MarketStats({ opinionId, callCount, coinsStaked = 0, compact = false }: MarketStatsProps) {
  const [recentJoins, setRecentJoins] = useState(0);
  const [recentCoins, setRecentCoins] = useState(0);
  const [movement, setMovement]       = useState<string | null>(null);

  useEffect(() => {
    const fetchRecent = async () => {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60000).toISOString();
      const { count } = await supabase
        .from("calls")
        .select("id", { count: "exact", head: true })
        .eq("opinion_id", opinionId)
        .gte("created_at", fiveMinsAgo);
      if (count) { setRecentJoins(count); setRecentCoins(count * 50); }

      // Check for movement in price history
      const { data: history } = await supabase
        .from("option_price_history")
        .select("option_label, percent")
        .eq("opinion_id", opinionId)
        .order("recorded_at", { ascending: false })
        .limit(4);
      if (history && history.length >= 2) {
        const latest = history[0];
        const prev   = history[history.length - 1];
        if (latest.option_label === prev.option_label) {
          const diff = latest.percent - prev.percent;
          if (Math.abs(diff) >= 1) {
            setMovement(`${latest.option_label} ${diff > 0 ? "↑" : "↓"}${Math.abs(diff).toFixed(1)}%`);
          }
        }
      }
    };
    fetchRecent();
  }, [opinionId, callCount]);

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {recentJoins > 0 && (
          <span className="text-[10px] text-[#F97316] font-semibold flex items-center gap-0.5">
            <Users className="h-2.5 w-2.5" /> {recentJoins} recent
          </span>
        )}
        {recentCoins > 0 && (
          <span className="text-[10px] text-[#22C55E] font-semibold flex items-center gap-0.5">
            <TrendingUp className="h-2.5 w-2.5" /> +{recentCoins}c / 5m
          </span>
        )}
        {movement && (
          <span className="text-[10px] text-[#3B82F6] font-semibold">{movement}</span>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {[
        { icon: <Users className="h-3 w-3" />,  label: "Callers",      val: callCount.toLocaleString() },
        { icon: <Coins className="h-3 w-3" />,  label: "Staked",       val: `${(coinsStaked || callCount * 50).toLocaleString()}c` },
        { icon: <TrendingUp className="h-3 w-3" />, label: "5m activity", val: recentCoins > 0 ? `+${recentCoins}c` : "—" },
      ].map(s => (
        <div key={s.label} className="bg-secondary/40 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
            {s.icon}
          </div>
          <p className="text-sm font-bold text-foreground">{s.val}</p>
          <p className="text-[10px] text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  );
}