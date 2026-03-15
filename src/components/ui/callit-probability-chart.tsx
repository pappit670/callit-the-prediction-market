"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

export type DataPoint = {
    time: string;
    [key: string]: string | number;
};

interface SeriesConfig {
    key: string;
    label: string;
    color: string;
}

interface CallitProbabilityChartProps {
    data: DataPoint[];
    series: SeriesConfig[];
    height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border rounded-xl px-3 py-2.5 shadow-lg">
                <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
                {payload.map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 mb-0.5">
                        <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                        <span className="text-xs text-foreground">{p.name}</span>
                        <span className="text-xs font-bold ml-auto pl-4" style={{ color: p.color }}>
                            {p.value}%
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export function CallitProbabilityChart({
    data,
    series,
    height = 260,
}: CallitProbabilityChartProps) {
    return (
        <div className="w-full" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid
                        strokeDasharray="4 4"
                        stroke="hsl(var(--border))"
                        strokeOpacity={0.4}
                        vertical={false}
                    />
                    <XAxis
                        dataKey="time"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        dy={8}
                    />
                    <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                    />
                    {series.map((s) => (
                        <Line
                            key={s.key}
                            type="monotone"
                            dataKey={s.key}
                            name={s.label}
                            stroke={s.color}
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{
                                r: 5,
                                fill: s.color,
                                strokeWidth: 2,
                                stroke: "hsl(var(--background))",
                            }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}