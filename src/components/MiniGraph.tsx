import { useMemo } from "react";
import { motion } from "framer-motion";

interface MiniGraphProps {
  yesPercent: number;
  noPercent: number;
  seed?: number;
}

const generatePoints = (target: number, seed: number, count = 10): number[] => {
  const points: number[] = [];
  let value = 50;
  let s = seed;
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280;
    const rand = (s / 233280 - 0.5) * 16;
    const pull = (target - value) * 0.25;
    value = Math.max(5, Math.min(95, value + pull + rand));
    points.push(value);
  }
  points[count - 1] = target;
  return points;
};

const toPath = (points: number[], width: number, height: number): string => {
  const stepX = width / (points.length - 1);
  const pts = points.map((p, i) => ({ x: i * stepX, y: height - (p / 100) * height }));

  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cx1 = pts[i - 1].x + stepX * 0.4;
    const cx2 = pts[i].x - stepX * 0.4;
    d += ` C${cx1},${pts[i - 1].y} ${cx2},${pts[i].y} ${pts[i].x},${pts[i].y}`;
  }
  return d;
};

const toAreaPath = (linePath: string, width: number, height: number): string => {
  return `${linePath} L${width},${height} L0,${height} Z`;
};

const MiniGraph = ({ yesPercent, noPercent, seed = 42 }: MiniGraphProps) => {
  const svgWidth = 200;
  const svgHeight = 48;

  const { yesPath, noPath, yesArea, noArea } = useMemo(() => {
    const yesPoints = generatePoints(yesPercent, seed);
    const noPoints = generatePoints(noPercent, seed + 1000);
    const yp = toPath(yesPoints, svgWidth, svgHeight);
    const np = toPath(noPoints, svgWidth, svgHeight);
    return {
      yesPath: yp,
      noPath: np,
      yesArea: toAreaPath(yp, svgWidth, svgHeight),
      noArea: toAreaPath(np, svgWidth, svgHeight),
    };
  }, [yesPercent, noPercent, seed]);

  return (
    <div className="flex items-center gap-3 mb-3 -mx-1">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="flex-1 h-12"
        preserveAspectRatio="none"
      >
        {/* Area fills */}
        <path d={yesArea} fill="#22C55E" opacity={0.1} />
        <path d={noArea} fill="#3B82F6" opacity={0.1} />

        {/* Animated lines */}
        <motion.path
          d={yesPath}
          fill="none"
          stroke="#22C55E"
          strokeWidth={1.5}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <motion.path
          d={noPath}
          fill="none"
          stroke="#3B82F6"
          strokeWidth={1.5}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        />
      </svg>

      {/* Current percentages */}
      <div className="flex flex-col items-end shrink-0">
        <span className="text-[13px] font-bold" style={{ color: "#22C55E" }}>
          {yesPercent}%
        </span>
        <span className="text-[13px] font-bold" style={{ color: "#3B82F6" }}>
          {noPercent}%
        </span>
      </div>
    </div>
  );
};

export default MiniGraph;
