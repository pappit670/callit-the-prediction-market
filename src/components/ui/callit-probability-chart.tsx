"use client";

import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    ReferenceLine,
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

type TooltipPayloadItem = {
    value?: number;
    name?: string;
    color?: string;
};

type CustomTooltipProps = {
    active?: boolean;
    payload?: TooltipPayloadItem[];
    label?: string;
};

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover border border-border rounded-xl px-3 py-2.5 shadow-xl">
                <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
                {payload.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 mb-0.5">
                        <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                        <span className="text-xs text-foreground">{p.name}</span>
                        <span className="text-xs font-bold ml-auto pl-4" style={{ color: p.color }}>
                            {p.value ?? 0}%
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
    // Find the midpoint time label for the reference line
    const midIndex = Math.floor(data.length / 2);
    const refLineTime = data[midIndex]?.time;

    return (
        <div className="w-full relative" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 16, right: 16, left: -10, bottom: 8 }}>
                    <defs>
                        <pattern id="dotGridRecharts" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                            <circle cx="10" cy="10" r="1" fill="hsl(var(--muted-foreground))" fillOpacity="0.12" />
                        </pattern>
                    </defs>

                    {/* Dot grid background */}
                    <rect x="0" y="0" width="100%" height="100%" fill="url(#dotGridRecharts)" style={{ pointerEvents: "none" }} />

                    <CartesianGrid
                        strokeDasharray="4 8"
                        stroke="hsl(var(--border))"
                        strokeOpacity={0.6}
                        horizontal={true}
                        vertical={false}
                    />

                    {/* Reference line at midpoint */}
                    {refLineTime && (
                        <ReferenceLine
                            x={refLineTime}
                            stroke="hsl(var(--muted-foreground))"
                            strokeDasharray="4 4"
                            strokeWidth={1}
                            strokeOpacity={0.4}
                        />
                    )}

                    <XAxis
                        dataKey="time"
                        tick={false}
                        axisLine={false}
                        tickLine={false}
                    />

                    <YAxis
                        domain={[0, 100]}
                        tick={false}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v}%`}
                        tickMargin={8}
                    />

                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{
                            stroke: "hsl(var(--muted-foreground))",
                            strokeDasharray: "3 3",
                            strokeOpacity: 0.5,
                        }}
                    />

                    {series.map((s) => (
                        <Line
                            key={s.key}
                            type="monotone"
                            dataKey={s.key}
                            name={s.label}
                            stroke={s.color}
                            strokeWidth={2}
                            dot={(props: { cx?: number; cy?: number; index?: number }) => {
                                const { cx, cy, index } = props;
                                if (typeof cx !== "number" || typeof cy !== "number" || typeof index !== "number") {
                                    return null;
                                }
                                // Only show dots at start, end, and peak
                                const isFirst = index === 0;
                                const isLast = index === data.length - 1;
                                const values = data.map(d => Number(d[s.key]) || 0);
                                const maxVal = Math.max(...values);
                                const isPeak = Number(data[index]?.[s.key]) === maxVal;

                                if (isFirst || isLast || isPeak) {
                                    return (
                                        <g key={`dot-${s.key}-${index}`}>
                                            <circle
                                                cx={cx} cy={cy} r={5}
                                                fill={s.color} opacity={0.25}
                                            />
                                            <circle
                                                cx={cx} cy={cy} r={3}
                                                fill={s.color}
                                                stroke="hsl(var(--background))"
                                                strokeWidth={2}
                                            />
                                        </g>
                                    );
                                }
                                return <g key={`dot-${s.key}-${index}`} />;
                            }}
                            activeDot={{
                                r: 5,
                                fill: s.color,
                                stroke: "hsl(var(--background))",
                                strokeWidth: 2,
                            }}
                        />
                    ))}
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}