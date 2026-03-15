"use client";

import { CallitProbabilityChart } from "./callit-probability-chart";
import type { DataPoint } from "./callit-probability-chart";
import { SlidingNumber } from "./sliding-number";

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
    }));

    const leading = latestValues.reduce((a, b) => (a.value >= b.value ? a : b));

    return (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-border">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    {title}
                </p>

                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div className="flex items-baseline gap-1">
                        <div
                            className="font-headline text-5xl font-bold flex items-baseline gap-0.5"
                            style={{ color: leading.color }}
                        >
                            <SlidingNumber value={leading.value} />
                            <span className="text-3xl">%</span>
                        </div>
                        <span className="text-sm text-muted-foreground ml-2 mb-1">{leading.label}</span>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap justify-end">
                        {latestValues.map((v, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: v.color }} />
                                <span className="text-xs text-muted-foreground">{v.label}</span>
                                <span className="text-xs font-bold" style={{ color: v.color }}>{v.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="px-3 py-3">
                <CallitProbabilityChart data={combinedData} series={series} height={height} />
            </div>
        </div>
    );
}