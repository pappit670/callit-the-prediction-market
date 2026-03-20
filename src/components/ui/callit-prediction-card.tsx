import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { SlidingNumber } from "@/components/ui/sliding-number";
import { TrendingUp, TrendingDown } from "lucide-react";
import { CallitPredictionCard } from "@/components/ui/callit-prediction-card";
import { useMarketTimeline } from "@/hooks/useMarketTimeline";
export interface DataPoint {
  time: string;
  probability: number;
  [key: string]: string | number;
}

export interface OptionSeries {
  label: string;
  color: string;
  data: DataPoint[];
}

interface CallitPredictionCardProps {
  title:        string;
  optionSeries: OptionSeries[];
  height?:      number;
}

// Merge option series into a single recharts dataset
function mergeSeriesData(optionSeries: OptionSeries[]): any[] {
  if (!optionSeries.length) return [];
  const allTimes = Array.from(
    new Set(optionSeries.flatMap(s => s.data.map(d => d.time)))
  );
  return allTimes.map(time => {
    const point: Record<string, any> = { time };
    optionSeries.forEach(s => {
      const match = s.data.find(d => d.time === time);
      point[s.label] = match?.probability ?? null;
    });
    return point;
  });
}

export function CallitPredictionCard({
  title, optionSeries, height = 200,
}: CallitPredictionCardProps) {
  const hasData = optionSeries.some(s => s.data.length > 1);

  if (!hasData) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-sm font-semibold text-muted-foreground">No activity yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Graph appears after the first stake is placed
        </p>
      </div>
    );
  }

  const mergedData = mergeSeriesData(optionSeries);

  // Leading option for the big number display
  const leading     = optionSeries.reduce((a, b) => {
    const av = a.data[a.data.length - 1]?.probability ?? 0;
    const bv = b.data[b.data.length - 1]?.probability ?? 0;
    return av >= bv ? a : b;
  }, optionSeries[0]);

  const leadingPct  = leading?.data[leading.data.length - 1]?.probability ?? 0;
  const prevPct     = leading?.data[leading.data.length - 2]?.probability ?? leadingPct;
  const delta       = leadingPct - prevPct;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black tabular-nums" style={{ color: leading?.color }}>
              <SlidingNumber value={Math.round(leadingPct)} />
            </span>
            <span className="text-lg font-bold text-muted-foreground">%</span>
            {delta !== 0 && (
              <div className="flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full bg-secondary"
                style={{ color: delta > 0 ? "#22C55E" : "#EF4444" }}>
                {delta > 0
                  ? <TrendingUp className="h-3 w-3" />
                  : <TrendingDown className="h-3 w-3" />}
                {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}%
              </div>
            )}
            <span className="text-sm text-muted-foreground ml-1">{leading?.label}</span>
          </div>
        </div>
        {/* All options legend */}
        <div className="flex flex-col gap-1 text-right">
          {optionSeries.slice(0, 4).map(s => {
            const pct = s.data[s.data.length - 1]?.probability ?? 0;
            return (
              <div key={s.label} className="flex items-center gap-1.5 justify-end">
                <span className="text-xs font-bold tabular-nums" style={{ color: s.color }}>
                  {Math.round(pct)}%
                </span>
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={mergedData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border, #e5e7eb)"
            strokeOpacity={0.4}
            vertical={false}
          />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: "var(--muted-foreground, #9ca3af)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "var(--muted-foreground, #9ca3af)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${v}%`}
            width={32}
          />
          <Tooltip
            contentStyle={{
              background:   "var(--card, #fff)",
              border:       "1px solid var(--border, #e5e7eb)",
              borderRadius: "8px",
              fontSize:     "12px",
              padding:      "6px 10px",
            }}
            formatter={(val: number, name: string) => [`${val}%`, name]}
            labelStyle={{ fontSize: 11, color: "var(--muted-foreground)" }}
          />
          <ReferenceLine y={50} stroke="var(--border)" strokeDasharray="4 4" strokeOpacity={0.5} />
          {optionSeries.map(s => (
            <Line
              key={s.label}
              type="monotone"
              dataKey={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}