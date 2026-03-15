"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

interface DataPoint {
    time: string;
    probability: number;
}

interface CallitProbabilityChartProps {
    data: DataPoint[];
    color?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg">
                <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                <p className="text-sm font-bold text-gold">{payload[0].value}%</p>
            </div>
        );
    }
    return null;
};

export function CallitProbabilityChart({
    data,
    color = "#d4af37",
}: CallitProbabilityChartProps) {
    const gradientId = "callitGradient";

    return (
        <div className="w-full" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid
                        strokeDasharray="4 4"
                        stroke="hsl(var(--border))"
                        strokeOpacity={0.4}
                        vertical={false}
                    />

                    <XAxis
                        dataKey="time"
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        dy={8}
                    />

                    <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v}%`}
                    />

                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "4 4" }}
                    />

                    <Area
                        type="monotone"
                        dataKey="probability"
                        stroke={color}
                        strokeWidth={2.5}
                        fill={`url(#${gradientId})`}
                        dot={{ r: 4, fill: color, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: color, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}