"use client";

import { CallitProbabilityChart } from "./callit-probability-chart";
import type { DataPoint } from "./callit-probability-chart";
import { SlidingNumber } from "./sliding-number";
import { TrendingUp, TrendingDown } from "lucide-react";

interface OptionSeries {
    label: string;
    color: string;
    data: { time: string; probability: number }[];
}

interface CallitPredictionCardProps {
    title?: string;
    optionSeries: OptionSeries[];
    height?: number;
}

export function CallitPredictionCard({
    title = "Market Probability",
    optionSeries,
    height = 240,
}: CallitPredictionCardProps) {
    if (!optionSeries || optionSeries.length === 0) return null;

    const pointCount = optionSeries[0].data.length;

    const combinedData: DataPoint[] = Array.from({ length: pointCount }, (_, i) => {
        const point: DataPoint = {
            time: optionSeries[0].data[i]?.time || `Day ${i + 1}`,
        };
        optionSeries.forEach((s) => {
            point[s.label] = s.data[i]?.probability ?? 50;
        });
        return point;
    });

    const series = optionSeries.map((s) => ({
        key: s.label,
        label: s.label,
        color: s.color,
    }));

    const latestValues = optionSeries.map((s) => ({
        label: s.label,
        color: s.color,
        value: s.data[s.data.length - 1]?.probability ?? 50,
        prev: s.data[s.data.length - 2]?.probability ?? 50,
        high: Math.max(...s.data.map(d => d.probability)),
        low: Math.min(...s.data.map(d => d.probability)),
    }));

    const leading = latestValues.reduce((a, b) => (a.value >= b.value ? a : b));
    const delta = leading.value - leading.prev;
    const isUp = delta >= 0;

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Header — stats row */}
            <div className="px-5 pt-5 pb-4 border-b border-border">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    {title}
                </p>

                <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
                    {/* Leading big number */}
                    <div className="flex items-baseline gap-2">
                        <div
                            className="font-headline text-5xl font-bold flex items-baseline"
                            style={{ color: leading.color }}
                        >
                            <SlidingNumber value={leading.value} />
                            <span className="text-3xl ml-0.5">%</span>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold mb-1 ${isUp ? "bg-green-500/15 text-green-500" : "bg-destructive/15 text-destructive"
                            }`}>
                            {isUp
                                ? <TrendingUp className="h-3 w-3" />
                                : <TrendingDown className="h-3 w-3" />}
                            {Math.abs(delta)}%
                        </div>
                        <span className="text-sm text-muted-foreground mb-1">{leading.label}</span>
                    </div>

                    {/* High / Low */}
                    <div className="flex items-center gap-4 text-sm mb-1">
                        <span className="text-muted-foreground">
                            High: <span className="text-blue-500 font-semibold">{leading.high}%</span>
                        </span>
                        <span className="text-muted-foreground">
                            Low: <span className="text-yellow-500 font-semibold">{leading.low}%</span>
                        </span>
                    </div>
                </div>

                {/* All options legend */}
                <div className="flex items-center gap-4 flex-wrap">
                    {latestValues.map((v, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: v.color }} />
                            <span className="text-xs text-muted-foreground">{v.label}</span>
                            <span className="text-xs font-bold" style={{ color: v.color }}>{v.value}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div className="px-2 py-3">
                <CallitProbabilityChart data={combinedData} series={series} height={height} />
            </div>
        </div>
    );
}