import { useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, Activity, Timer, Share2, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import StakeModal from "./StakeModal";

export interface OpinionCardData {
  id: number | string;
  question: string;
  yesPercent: number;
  noPercent: number;
  coins: number;
  timeLeft: string;
  genre: string;
  topicIcon?: string;
  topicColor?: string;
  status?: "open" | "locked" | "resolved" | "draw";
  winner?: "yes" | "no";
  isLiveGame?: boolean;
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number;
  awayScore?: number;
  matchMinute?: string;
  options?: { label: string; percent: number }[];
  leagueName?: string;
}

const OPTION_COLORS = [
  { bg: "bg-gold/10", border: "border-gold/40", hover: "hover:bg-gold/20 hover:border-gold", text: "text-gold", glow: "hover:shadow-[0_0_14px_rgba(245,197,24,0.35)]" },
  { bg: "bg-green-500/10", border: "border-green-500/40", hover: "hover:bg-green-500/20 hover:border-green-500", text: "text-green-500", glow: "hover:shadow-[0_0_14px_rgba(34,197,94,0.35)]" },
  { bg: "bg-blue-500/10", border: "border-blue-500/40", hover: "hover:bg-blue-500/20 hover:border-blue-500", text: "text-blue-500", glow: "hover:shadow-[0_0_14px_rgba(59,130,246,0.35)]" },
  { bg: "bg-purple-500/10", border: "border-purple-500/40", hover: "hover:bg-purple-500/20 hover:border-purple-500", text: "text-purple-500", glow: "hover:shadow-[0_0_14px_rgba(168,85,247,0.35)]" },
  { bg: "bg-orange-500/10", border: "border-orange-500/40", hover: "hover:bg-orange-500/20 hover:border-orange-500", text: "text-orange-500", glow: "hover:shadow-[0_0_14px_rgba(249,115,22,0.35)]" },
];

const OpinionCard = ({ data, index }: { data: OpinionCardData; index: number }) => {
  const {
    question, yesPercent, noPercent, coins, timeLeft, genre,
    topicIcon, topicColor, status = "open",
    isLiveGame, homeTeam, awayTeam, homeScore, awayScore, matchMinute,
    options, leagueName,
  } = data;

  const navigate = useNavigate();
  const { isLoggedIn } = useApp();
  const [stakeModal, setStakeModal] = useState<{ side: "yes" | "no"; optionLabel?: string } | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);

  const isLive = isLiveGame || timeLeft === "Live" || timeLeft.includes("min");
  const hasMultipleOptions = options && options.length > 2;

  const openStake = (e: React.MouseEvent, side: "yes" | "no", label?: string) => {
    e.stopPropagation();
    if (!isLoggedIn) { toast.error("Log in to make a call!"); navigate("/auth"); return; }
    setStakeModal({ side, optionLabel: label });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.origin + "/opinion/" + data.id);
    toast.success("Link copied!");
  };

  return (
    <>
      <motion.div
        className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col cursor-pointer hover:border-gold/40 hover:shadow-lg transition-all duration-200 group"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.04 }}
        onClick={() => navigate(`/opinion/${data.id}`)}
      >
        <div className="p-4 flex flex-col gap-3 flex-1">

          {/* Header row — topic icon like Polymarket + live badge + actions */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              {/* Small topic icon — Polymarket style */}
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center text-sm border border-border bg-secondary flex-shrink-0"
                style={{ borderColor: topicColor ? topicColor + "40" : undefined }}
              >
                {topicIcon || "📰"}
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                {genre.replace(/\s*[\u{1F000}-\u{1FFFF}]/u, "").trim()}
              </span>
              {isLive && (
                <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive">
                  <span className="w-1 h-1 rounded-full bg-destructive animate-pulse inline-block" />
                  live
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button className="text-muted-foreground hover:text-gold transition-colors p-1" onClick={handleShare}>
                <Share2 className="h-3.5 w-3.5" />
              </button>
              <button className="text-muted-foreground hover:text-gold transition-colors p-1"
                onClick={(e) => { e.stopPropagation(); toast.success("Saved!"); }}>
                <Bookmark className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* League name */}
          {leagueName && (
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold -mt-1">{leagueName}</p>
          )}

          {/* Live Game Score */}
          {isLiveGame && homeTeam && awayTeam && (
            <div className="bg-secondary rounded-xl px-3 py-2.5 flex items-center justify-between">
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">{homeTeam}</p>
                <p className="text-[10px] text-muted-foreground">Home</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{homeScore} — {awayScore}</p>
                {matchMinute && (
                  <span className="text-[10px] font-medium text-destructive">{matchMinute}'</span>
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">{awayTeam}</p>
                <p className="text-[10px] text-muted-foreground">Away</p>
              </div>
            </div>
          )}

          {/* Question */}
          <h3 className="text-[15px] font-semibold text-foreground leading-snug line-clamp-2 flex-1">
            {question}
          </h3>

          {/* Options — colour graded with glow */}
          {options && options.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                {(showMore ? options : options.slice(0, 2)).map((opt, i) => {
                  const c = OPTION_COLORS[i % OPTION_COLORS.length];
                  const isSelected = selectedOption === opt.label;
                  return (
                    <button key={i}
                      onClick={(e) => { e.stopPropagation(); setSelectedOption(opt.label); openStake(e, "yes", opt.label); }}
                      className={`flex flex-col items-center justify-center px-2 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150 ${isSelected
                          ? `${c.bg} ${c.border} border-2 shadow-md`
                          : `border-border bg-secondary/50 ${c.hover} ${c.glow}`
                        }`}
                    >
                      <span className={`font-semibold text-sm ${isSelected ? c.text : "text-foreground"}`}>
                        {opt.label}
                      </span>
                      <span className={`text-[11px] mt-0.5 ${isSelected ? c.text : "text-muted-foreground"}`}>
                        {opt.percent}%
                      </span>
                    </button>
                  );
                })}
              </div>

              {showMore && options.length > 2 && (
                <div className="flex flex-col gap-1">
                  {options.slice(2).map((opt, i) => {
                    const c = OPTION_COLORS[(i + 2) % OPTION_COLORS.length];
                    const isSelected = selectedOption === opt.label;
                    return (
                      <button key={i}
                        onClick={(e) => { e.stopPropagation(); setSelectedOption(opt.label); openStake(e, "yes", opt.label); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-150 ${isSelected ? `${c.bg} ${c.border} border-2` : `border-border bg-secondary/50 ${c.hover} ${c.glow}`
                          }`}
                      >
                        <span className="flex-1 text-left text-sm font-medium text-foreground">{opt.label}</span>
                        <div className="w-14 h-1 rounded-full bg-border overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${opt.percent}%`, background: `var(--${c.text.replace("text-", "")}, #F5C518)` }} />
                        </div>
                        <span className="text-[11px] text-muted-foreground w-7 text-right">{opt.percent}%</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {hasMultipleOptions && (
                <button onClick={(e) => { e.stopPropagation(); setShowMore(!showMore); }}
                  className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-gold py-1 transition-colors">
                  {showMore
                    ? <><ChevronUp className="h-3 w-3" /> fewer options</>
                    : <><ChevronDown className="h-3 w-3" /> +{options.length - 2} more</>}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={(e) => openStake(e, "yes")}
                className="flex flex-col items-center py-2.5 rounded-xl border border-border bg-secondary/50 hover:border-green-500 hover:bg-green-500/10 hover:shadow-[0_0_14px_rgba(34,197,94,0.3)] transition-all duration-150">
                <span className="text-sm font-semibold text-green-500">Agree</span>
                <span className="text-[11px] text-muted-foreground">{yesPercent}%</span>
              </button>
              <button onClick={(e) => openStake(e, "no")}
                className="flex flex-col items-center py-2.5 rounded-xl border border-border bg-secondary/50 hover:border-destructive hover:bg-destructive/10 hover:shadow-[0_0_14px_rgba(239,68,68,0.3)] transition-all duration-150">
                <span className="text-sm font-semibold text-destructive">Disagree</span>
                <span className="text-[11px] text-muted-foreground">{noPercent}%</span>
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-auto">
            <span className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">{coins >= 1000 ? (coins / 1000).toFixed(1) + "K" : coins}</span> coins
            </span>
            {isLive ? (
              <span className="flex items-center gap-1 text-[11px] text-gold font-medium">
                <Activity className="h-3 w-3" /> Live
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Timer className="h-3 w-3" /> {timeLeft}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {stakeModal && (
        <StakeModal
          side={stakeModal.side}
          optionLabel={stakeModal.optionLabel}
          question={question}
          yesPercent={yesPercent}
          noPercent={noPercent}
          poolCoins={coins}
          onClose={() => setStakeModal(null)}
        />
      )}
    </>
  );
};

export default OpinionCard;