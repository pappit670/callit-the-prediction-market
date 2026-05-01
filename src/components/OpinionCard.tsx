// src/components/OpinionCard.tsx ── REDESIGN
// Matches Polymarket card layout from screenshots:
//   - Question icon left
//   - Options listed vertically with % bars
//   - For 2-option: shows both with colour-coded bars like Polymarket feed
//   - For multi: shows top 3 options with "N more" indicator
//   - Volume/callers in footer

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Timer, TrendingUp } from "lucide-react";
import { QuestionIcon } from "@/components/QuestionIcon";
import { MiniGraph } from "@/components/MiniGraph";

interface CardOption {
  label: string;
  percent: number;
}

interface CardData {
  id: string;
  question: string;
  options?: CardOption[];
  coins?: number;
  timeLeft?: string;
  genre?: string;
  topicIcon?: string;
  topicColor?: string;
  topicSlug?: string;
  iconUrl?: string | null;
  status?: string;
  creatorUsername?: string | null;
  createdAt?: string;
  followerCount?: number;
  isRising?: boolean;
  yesPercent?: number;
  noPercent?: number;
}

interface Props {
  data: CardData;
  index?: number;
}

const optColor = (label: string, i: number): string => {
  const l = label.toLowerCase().trim();
  if (l === "yes" || l === "agree") return "#2563EB";
  if (l === "no" || l === "disagree") return "#DC2626";
  return ["#7C3AED", "#0891B2", "#059669", "#EA580C", "#F59E0B", "#EC4899"][i % 6];
};

const isYN = (l: string) => ["yes", "no", "agree", "disagree"].includes(l.toLowerCase().trim());
const isPureYN = (opts: CardOption[]) => opts.length > 0 && opts.every(o => isYN(o.label));

export default function OpinionCard({ data, index = 0 }: Props) {
  const navigate = useNavigate();
  const options: CardOption[] = data.options ?? [
    { label: "Yes", percent: data.yesPercent ?? 50 },
    { label: "No", percent: data.noPercent ?? 50 },
  ];
  const pureYN = isPureYN(options);
  const showOpts = options.slice(0, 3);
  const extra = options.length > 3 ? options.length - 3 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      onClick={() => navigate(`/opinion/${data.id}`)}
      className="bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:brightness-[1.04] hover:border-border/80 transition-all"
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <QuestionIcon
            iconUrl={data.iconUrl}
            statement={data.question}
            size={44}
            className="shrink-0 mt-0.5"
          />
          <div className="flex-1 min-w-0">
            {/* Topic + rising */}
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              {data.topicIcon && <span className="text-[11px]">{data.topicIcon}</span>}
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {data.genre || "General"}
              </span>
              {data.isRising && (
                <span className="flex items-center gap-0.5 text-[9px] font-bold text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded-full">
                  <TrendingUp className="h-2.5 w-2.5" /> Rising
                </span>
              )}
            </div>
            {/* Question */}
            <p className="text-sm font-bold text-foreground leading-snug line-clamp-2">
              {data.question}
            </p>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="px-4 pb-3 space-y-2" onClick={e => e.stopPropagation()}>
        {pureYN && options.length >= 2 && (
          <MiniGraph 
            yesPercent={options.find(o => ["yes", "agree"].includes(o.label.toLowerCase()))?.percent ?? 50} 
            noPercent={options.find(o => ["no", "disagree"].includes(o.label.toLowerCase()))?.percent ?? 50} 
          />
        )}
        {showOpts.map((opt, i) => {
          const color = optColor(opt.label, i);
          const pct = opt.percent ?? Math.round(100 / options.length);
          return (
            <div key={opt.label}>
              {/* Label + percent */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ background: color }} />
                  <span className="text-xs font-semibold" style={{ color }}>{opt.label}</span>
                </div>
                <span className="text-xs font-bold tabular-nums" style={{ color }}>{pct}%</span>
              </div>
              {/* Probability bar */}
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </div>
          );
        })}

        {extra > 0 && (
          <p className="text-[10px] text-muted-foreground pl-3.5">+{extra} more options</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/40">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Users className="h-3 w-3" />
            <span className="font-semibold text-foreground">{(data.coins || 0).toLocaleString()}</span>
          </span>
          {data.timeLeft && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Timer className="h-3 w-3" />
              {data.timeLeft}
            </span>
          )}
        </div>
        {data.creatorUsername && (
          <span className="text-[10px] text-muted-foreground">
            @{data.creatorUsername}
          </span>
        )}
      </div>
    </motion.div>
  );
}
