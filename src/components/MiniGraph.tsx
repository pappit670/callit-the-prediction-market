import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface MiniGraphProps {
  yesPercent: number;
  noPercent: number;
}

export function MiniGraph({ yesPercent, noPercent }: MiniGraphProps) {
  const [points, setPoints] = useState<{ y: number; n: number }[]>([]);

  useEffect(() => {
    // Generate seeded random walk converging to the current percentages
    const pts = [];
    let curY = 50;
    let curN = 50;
    
    // Start at 50/50, end at yesPercent/noPercent
    for (let i = 0; i <= 10; i++) {
      if (i === 10) {
        pts.push({ y: yesPercent, n: noPercent });
      } else {
        // Random walk towards target
        const progress = i / 10;
        const targetY = 50 + (yesPercent - 50) * progress;
        const targetN = 50 + (noPercent - 50) * progress;
        
        curY = targetY + (Math.random() * 10 - 5);
        curN = targetN + (Math.random() * 10 - 5);
        
        // Clamp
        curY = Math.max(5, Math.min(95, curY));
        curN = Math.max(5, Math.min(95, curN));
        
        pts.push({ y: curY, n: curN });
      }
    }
    setPoints(pts);
  }, [yesPercent, noPercent]);

  if (points.length === 0) return null;

  const width = 200;
  const height = 48;
  const padding = 4;
  
  const dx = width / 10;
  
  const getPath = (key: "y" | "n") => {
    let d = `M 0 ${height - (points[0][key] / 100) * (height - padding * 2) - padding}`;
    for (let i = 1; i <= 10; i++) {
      const x = i * dx;
      const y = height - (points[i][key] / 100) * (height - padding * 2) - padding;
      // Simple cubic bezier
      const prevX = (i - 1) * dx;
      const prevY = height - (points[i - 1][key] / 100) * (height - padding * 2) - padding;
      const cpX1 = prevX + dx * 0.5;
      const cpX2 = x - dx * 0.5;
      d += ` C ${cpX1} ${prevY}, ${cpX2} ${y}, ${x} ${y}`;
    }
    return d;
  };

  const getArea = (key: "y" | "n") => {
    const d = getPath(key);
    return `${d} L ${width} ${height} L 0 ${height} Z`;
  };

  return (
    <div className="flex items-center gap-3 w-full h-[48px] my-2">
      <div className="relative flex-1 h-full">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
          {/* Yes Area */}
          <motion.path
            d={getArea("y")}
            fill="#22C55E"
            opacity={0.1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ duration: 0.6 }}
          />
          {/* No Area */}
          <motion.path
            d={getArea("n")}
            fill="#3B82F6"
            opacity={0.1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ duration: 0.6 }}
          />
          {/* Yes Line */}
          <motion.path
            d={getPath("y")}
            fill="none"
            stroke="#22C55E"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          {/* No Line */}
          <motion.path
            d={getPath("n")}
            fill="none"
            stroke="#3B82F6"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </svg>
      </div>
      <div className="flex flex-col justify-center items-end shrink-0 w-10">
        <span className="text-[13px] font-bold text-[#22C55E]">{yesPercent}%</span>
        <span className="text-[13px] font-bold text-[#3B82F6]">{noPercent}%</span>
      </div>
    </div>
  );
}