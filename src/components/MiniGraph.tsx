import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from "recharts";

interface MiniGraphProps {
  opinionId: string;
  options: string[];
  colors?: string[];
  height?: number;
  showEmpty?: boolean;
}

const COLORS = ["#F5C518", "#22C55E", "#EF4444", "#3B82F6", "#A855F7"];

export function MiniGraph({
  opinionId, options, colors = COLORS, height = 80, showEmpty = true
}: MiniGraphProps) {
  const [data, setData] = useState<any[]>([]);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    fetchHistory();
    const channel = supabase.channel(`graph-${opinionId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "option_price_history",
        filter: `opinion_id=eq.${opinionId}`,
      }, () => fetchHistory())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [opinionId]);

  const fetchHistory = async () => {
    const { data: rows } = await supabase
      .from("option_price_history")
      .select("option_label, percent, recorded_at")
      .eq("opinion_id", opinionId)
      .order("recorded_at", { ascending: true })
      .limit(50);

    if (!rows || rows.length === 0) { setHasData(false); return; }
    setHasData(true);

    // Pivot rows into chart format: [{ time, Yes: 60, No: 40 }, ...]
    const timeMap: Record<string, any> = {};
    for (const row of rows) {
      const t = new Date(row.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (!timeMap[t]) timeMap[t] = { time: t };
      timeMap[t][row.option_label] = row.percent;
    }
    setData(Object.values(timeMap));
  };

  if (!hasData) {
    if (!showEmpty) return null;
    return (
      <div className="flex items-center justify-center border border-dashed border-border rounded-lg"
        style={{ height }}>
        <p className="text-[11px] text-muted-foreground">No activity yet</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <YAxis domain={[0, 100]} hide />
        <Tooltip
          contentStyle={{
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: "8px", fontSize: "11px", padding: "4px 8px",
          }}
          formatter={(val: number, name: string) => [`${val}%`, name]}
          labelStyle={{ display: "none" }}
        />
        {options.map((opt, i) => (
          <Line
            key={opt}
            type="monotone"
            dataKey={opt}
            stroke={colors[i % colors.length]}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}