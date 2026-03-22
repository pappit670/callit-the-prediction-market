import { useMemo } from "react";
import {
    LineChart, Line, ResponsiveContainer, YAxis,
    Tooltip, CartesianGrid, ReferenceLine,
} from "recharts";

const GRAPH_COLORS = [
    "#2563EB", // blue
    "#DC2626", // red
    "#7C3AED", // purple
    "#0891B2", // cyan
    "#059669", // green
    "#EA580C", // orange
];

export interface GraphSeries {
    label: string;
    data: { time: string; probability: number }[];
}

interface Props {
    series: GraphSeries[];
    height?: number;
    showGrid?: boolean;
    showTooltip?: boolean;
    compact?: boolean; // true = card mini graph, false = full detail graph
}

export function MarketGraph({
    series,
    height = 70,
    showGrid = false,
    showTooltip = true,
    compact = true,
}: Props) {
    const hasData = series.some(s => s.data.length > 1);

    // Merge all series into one array keyed by time
    const merged = useMemo(() => {
        if (!hasData) return [];
        const allTimes = Array.from(
            new Set(series.flatMap(s => s.data.map(d => d.time)))
        );
        return allTimes.map(time => {
            const pt: Record<string, any> = { time };
            series.forEach(s => {
                const match = s.data.find(d => d.time === time);
                pt[s.label] = match?.probability ?? null;
            });
            return pt;
        });
    }, [series, hasData]);

    if (!hasData) {
        // Faint placeholder graph — flat lines at even intervals
        const placeholderData = Array.from({ length: 10 }, (_, i) => ({ time: i }));
        const levels = series.map((s, i) => Math.round(100 / (series.length + 1)) * (i + 1));

        return (
            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={placeholderData} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
                    {series.map((s, i) => (
                        <Line
                            key={s.label}
                            type="monotone"
                            dataKey={() => levels[i]}
                            stroke={GRAPH_COLORS[i % GRAPH_COLORS.length]}
                            strokeWidth={1}
                            strokeOpacity={0.15}
                            dot={false}
                            isAnimationActive={false}
                            strokeDasharray="4 4"
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={merged} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
                {showGrid && (
                    <CartesianGrid
                        strokeDasharray="2 4"
                        stroke="var(--border)"
                        strokeOpacity={0.2}
                        vertical={false}
                    />
                )}
                <YAxis domain={[0, 100]} hide />
                {showTooltip && (
                    <Tooltip
                        contentStyle={{
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            fontSize: "11px",
                            padding: "4px 8px",
                        }}
                        formatter={(v: number, name: string) => [`${Math.round(v)}%`, name]}
                        labelStyle={{ display: "none" }}
                    />
                )}
                {series.map((s, i) => (
                    <Line
                        key={s.label}
                        type="monotone"
                        dataKey={s.label}
                        stroke={GRAPH_COLORS[i % GRAPH_COLORS.length]}
                        strokeWidth={compact ? 1.5 : 2}
                        dot={false}
                        activeDot={{ r: compact ? 3 : 4, strokeWidth: 0 }}
                        connectNulls
                        isAnimationActive={false}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}