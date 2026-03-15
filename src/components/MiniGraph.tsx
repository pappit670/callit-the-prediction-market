import { useEffect, useRef } from "react";

interface MiniGraphProps {
  options?: { label: string; percent: number }[];
  yesPercent?: number;
  noPercent?: number;
  seed?: number;
}

const COLORS = ["#F5C518", "#22C55E", "#3B82F6", "#A855F7", "#F97316"];

function generatePath(percent: number, seed: number, w: number, h: number): string {
  const points: [number, number][] = [];
  const count = 20;
  let val = 40 + (seed % 20);
  for (let i = 0; i < count; i++) {
    const noise = Math.sin(seed * 13.37 + i * 2.1) * 6 + Math.cos(seed * 7.53 + i * 3.7) * 4;
    val = val + (percent - val) * 0.2 + noise * (1 - (i / count) * 0.6);
    val = Math.max(2, Math.min(98, val));
    if (i === count - 1) val = percent;
    const x = (i / (count - 1)) * w;
    const y = h - (val / 100) * h;
    points.push([x, y]);
  }
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const cp1x = points[i - 1][0] + (points[i][0] - points[i - 1][0]) * 0.4;
    const cp2x = points[i][0] - (points[i][0] - points[i - 1][0]) * 0.4;
    d += ` C ${cp1x} ${points[i - 1][1]}, ${cp2x} ${points[i][1]}, ${points[i][0]} ${points[i][1]}`;
  }
  d += ` L ${points[points.length - 1][0]} ${points[points.length - 1][1]}`;
  return d;
}

const MiniGraph = ({ options, yesPercent = 50, noPercent = 50, seed = 1 }: MiniGraphProps) => {
  const W = 300;
  const H = 80;

  const displayOptions = options && options.length > 0
    ? options
    : [
      { label: "Agree", percent: yesPercent },
      { label: "Disagree", percent: noPercent },
    ];

  return (
    <div className="w-full">
      {/* Chart */}
      <div className="relative w-full" style={{ height: H }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height={H}
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          {/* Grid lines */}
          {[25, 50, 75].map(v => (
            <line
              key={v}
              x1={0} y1={H - (v / 100) * H}
              x2={W} y2={H - (v / 100) * H}
              stroke="currentColor"
              strokeOpacity={0.06}
              strokeWidth={0.5}
              strokeDasharray="3 3"
            />
          ))}

          {/* Lines per option */}
          {displayOptions.map((opt, i) => {
            const color = COLORS[i % COLORS.length];
            const path = generatePath(opt.percent, seed * 7 + i * 13, W, H);
            return (
              <g key={i}>
                <path
                  d={path + ` L ${W} ${H} L 0 ${H} Z`}
                  fill={color}
                  opacity={0.06}
                />
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
                {/* End dot */}
                <circle
                  cx={W}
                  cy={H - (opt.percent / 100) * H}
                  r={3}
                  fill={color}
                />
              </g>
            );
          })}
        </svg>

        {/* Y axis labels */}
        <div className="absolute right-0 top-0 h-full flex flex-col justify-between pointer-events-none pr-0">
          <span className="text-[9px] text-muted-foreground">100%</span>
          <span className="text-[9px] text-muted-foreground">50%</span>
          <span className="text-[9px] text-muted-foreground">0%</span>
        </div>
      </div>

      {/* Legend with percentages */}
      <div className="flex items-center gap-3 mt-2 flex-wrap">
        {displayOptions.map((opt, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="text-[11px] text-muted-foreground">{opt.label}</span>
            <span
              className="text-[11px] font-semibold"
              style={{ color: COLORS[i % COLORS.length] }}
            >
              {opt.percent}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MiniGraph;