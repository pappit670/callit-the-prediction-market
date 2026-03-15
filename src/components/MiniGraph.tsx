import { SlidingNumber } from "@/components/ui/sliding-number";

interface MiniGraphProps {
  options?: { label: string; percent: number }[];
  yesPercent?: number;
  noPercent?: number;
  seed?: number;
}

const COLORS = ["#F5C518", "#22C55E", "#3B82F6", "#A855F7", "#F97316"];

function generatePath(percent: number, seed: number, w: number, h: number): string {
  const points: [number, number][] = [];
  const count = 24;
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
  const H = 72;

  const displayOptions = options && options.length > 0
    ? options
    : [
      { label: "Agree", percent: yesPercent },
      { label: "Disagree", percent: noPercent },
    ];

  return (
    <div className="w-full">
      {/* Chart area */}
      <div className="relative w-full rounded-lg overflow-hidden bg-secondary/30" style={{ height: H }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height={H}
          preserveAspectRatio="none"
        >
          {/* Subtle grid */}
          {[25, 50, 75].map(v => (
            <line
              key={v}
              x1={0} y1={H - (v / 100) * H}
              x2={W} y2={H - (v / 100) * H}
              stroke="currentColor"
              strokeOpacity={0.05}
              strokeWidth={0.5}
              strokeDasharray="4 4"
            />
          ))}

          {/* Area fills + lines */}
          {displayOptions.map((opt, i) => {
            const color = COLORS[i % COLORS.length];
            const path = generatePath(opt.percent, seed * 7 + i * 13, W, H);
            return (
              <g key={i}>
                <path
                  d={path + ` L ${W} ${H} L 0 ${H} Z`}
                  fill={color}
                  opacity={0.07}
                />
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* End dot with pulse ring */}
                <circle
                  cx={W - 2}
                  cy={H - (opt.percent / 100) * H}
                  r={4}
                  fill={color}
                  opacity={0.2}
                />
                <circle
                  cx={W - 2}
                  cy={H - (opt.percent / 100) * H}
                  r={2.5}
                  fill={color}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Stats row — label + sliding percent + bar */}
      <div className="flex flex-col gap-1.5 mt-3">
        {displayOptions.map((opt, i) => {
          const color = COLORS[i % COLORS.length];
          return (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-[11px] text-muted-foreground flex-shrink-0 w-16 truncate">{opt.label}</span>
              <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${opt.percent}%`, background: color }}
                />
              </div>
              <div className="text-[11px] font-semibold flex items-center flex-shrink-0" style={{ color }}>
                <SlidingNumber value={opt.percent} /><span>%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MiniGraph;