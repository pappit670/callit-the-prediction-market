"use client";

import { CallitProbabilityChart } from "./callit-probability-chart";
import { SlidingNumber } from "./sliding-number";

interface DataPoint {
    time: string;
    probability: number;
}

interface CallitPredictionCardProps {
    title?: string;
    data: DataPoint[];
    color?: string;
    description?: string;
}

export function CallitPredictionCard({
    title = "Market Probability",
    data,
    color = "#d4af37",
    description,
}: CallitPredictionCardProps) {
    const latest = data[data.length - 1]?.probability ?? 0;
    const previous = data[data.length - 2]?.probability ?? latest;
    const delta = latest - previous;
    const isUp = delta >= 0;

    return (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            {/* Top section */}
            <div className="px-6 pt-6 pb-4 border-b border-border">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    {title}
                </p>

                <div className="flex items-end gap-3">
                    {/* Big animated percentage */}
                    <div
                        className="font-headline text-6xl font-bold flex items-baseline gap-0.5"
                        style={{ color }}
                    >
                        <SlidingNumber value={latest} />
                        <span className="text-4xl">%</span>
                    </div>

                    {/* Delta badge */}
                    <div
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold mb-1 ${isUp
                                ? "bg-green-500/15 text-green-500"
                                : "bg-destructive/15 text-destructive"
                            }`}
                    >
                        <span>{isUp ? "▲" : "▼"}</span>
                        <span>{Math.abs(delta)}%</span>
                    </div>
                </div>

                {description && (
                    <p className="text-sm text-muted-foreground mt-2">{description}</p>
                )}
            </div>

            {/* Chart */}
            <div className="px-4 py-4">
                <CallitProbabilityChart data={data} color={color} />
            </div>
        </div>
    );
}