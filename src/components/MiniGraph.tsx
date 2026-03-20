import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from "recharts";

interface SeriesItem {
  label: string;
  history: { probability: number }[];
}

interface MiniGraphProps {
  series: SeriesItem[];
  height?: number;
}

const COLORS = ["#F5C518", "#22C55E", "#EF4444", "#A855F7", "#3B82F6"];

// Flatten series into recharts format: [{p0: 60, p1: 40}, ...]
function buildData(series: SeriesItem[]) {
  if (!series.length || series.every(s => !s.history.length)) return [];
  const maxLen = Math.max(...series.map(s => s.history.length));
  return Array.from({ length: maxLen }, (_, i) => {
    const point: Record<string, number> = {};
    series.forEach((s, si) => {
      point[`p${si}`] = s.history[i]?.probability ?? s.history[s.history.length - 1]?.probability ?? 50;
    });
    return point;
  });
}

const MiniGraph = ({ series, height = 44 }: MiniGraphProps) => {
  const hasData = series.some(s => s.history.length > 1);
  const data    = buildData(series);

  if (!hasData) {
    return (
      <div
        className="flex items-center justify-center border border-dashed border-border/40 rounded-lg"
        style={{ height }}
      >
        <span className="text-[10px] text-muted-foreground">No activity yet</span>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 0 }}>
        <YAxis domain={[0, 100]} hide />
        <Tooltip
          contentStyle={{
            background:   "var(--card, #fff)",
            border:       "1px solid var(--border, #e5e7eb)",
            borderRadius: "6px",
            fontSize:     "11px",
            padding:      "3px 7px",
          }}
          formatter={(val: number, key: string) => {
            const idx = parseInt(key.replace("p", ""));
            return [`${val}%`, series[idx]?.label || key];
          }}
          labelStyle={{ display: "none" }}
        />
        {series.map((s, i) => (
          <Line
            key={i}
            type="monotone"
            dataKey={`p${i}`}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 2.5, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export { MiniGraph };