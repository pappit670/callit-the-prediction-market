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
  status?: "open" | "locked" | "resolved" | "draw";
  winner?: "yes" | "no";
  isSystemGenerated?: boolean;
  isLiveGame?: boolean;
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number;
  awayScore?: number;
  matchMinute?: string;
  options?: { label: string; percent: number }[];
  imageUrl?: string;
  leagueName?: string;
}

const OPTION_COLORS = [
  { bg: "bg-gold/10", border: "border-gold/40", hover: "hover:bg-gold/20 hover:border-gold", text: "text-gold", glow: "hover:shadow-[0_0_16px_rgba(245,197,24,0.3)]" },
  { bg: "bg-yes/10", border: "border-yes/40", hover: "hover:bg-yes/20 hover:border-yes", text: "text-yes", glow: "hover:shadow-[0_0_16px_rgba(34,197,94,0.3)]" },
  { bg: "bg-blue-500/10", border: "border-blue-500/40", hover: "hover:bg-blue-500/20 hover:border-blue-500", text: "text-blue-500", glow: "hover:shadow-[0_0_16px_rgba(59,130,246,0.3)]" },
  { bg: "bg-purple-500/10", border: "border-purple-500/40", hover: "hover:bg-purple-500/20 hover:border-purple-500", text: "text-purple-500", glow: "hover:shadow-[0_0_16px_rgba(168,85,247,0.3)]" },
  { bg: "bg-orange-500/10", border: "border-orange-500/40", hover: "hover:bg-orange-500/20 hover:border-orange-500", text: "text-orange-500", glow: "hover:shadow-[0_0_16px_rgba(249,115,22,0.3)]" },
];

const getTopicIcon = (genre: string) => {
  const map: Record<string, string> = {
    "Local": "🇰🇪", "Sports": "⚽", "Crypto": "₿", "Tech": "💻",
    "Politics": "⚖️", "Culture": "🎭", "Economy": "📈", "Science": "🔬",
    "Markets": "📊", "Trending": "🔥", "News": "🚨", "Music": "🎵",
    "Entertainment": "🎬", "Football": "⚽", "Basketball": "🏀",
    "Business": "💼", "World": "🌍",
  };
  const clean = genre.replace(/\s*[\u{1F000}-\u{1FFFF}]/u, "").trim();
  return map[clean] || "📰";
};

const OpinionCard = ({ data, index }: { data: OpinionCardData; index: number }) => {
  const {
    question, yesPercent, noPercent, coins, timeLeft, genre,
    status = "open", isLiveGame, homeTeam, awayTeam,
    homeScore, awayScore, matchMinute, options, imageUrl, leagueName,
  } = data;

  const navigate = useNavigate();
  const { isLoggedIn } = useApp();
  const [stakeModal, setStakeModal] = useState<{ side: "yes" | "no"; optionLabel?: string } | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);

  const isLive = isLiveGame || timeLeft === "Live" || timeLeft.includes("min");
  const cleanGenre = genre.replace(/\s*[\u{1F000}-\u{1FFFF}]/u, "").trim();
  const hasMultipleOptions = options && options.length > 2;
  const visibleOptions = options ? (showMore ? options : options.slice(0, 2)) : null;
  const hiddenCount = options ? options.length - 2 : 0;

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
        className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col cursor-pointer hover:border-gold/40 transition-all duration-200 group"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        onClick={() => navigate(`/opinion/${data.id}`)}
      >
        {/* Image */}
        {imageUrl && (
          <div className="w-full h-36 overflow-hidden relative">
            <img
              src={imageUrl}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Live badge over image */}
            {isLive && (
              <span className="absolute top-2 left-2 flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full bg-destructive/90 text-white backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                live
              </span>
            )}
            {/* Topic badge over image */}
            <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-1 rounded-full bg-black/50 text-white backdrop-blur-sm">
              {getTopicIcon(genre)} {cleanGenre}
            </span>
          </div>
        )}

        <div className="p-4 flex flex-col gap-3 flex-1">
          {/* Header — only show if no image */}
          {!imageUrl && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isLive ? (
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse inline-block" />
                    live
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full bg-gold/10 text-gold">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />
                    open
                  </span>
                )}
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                  {getTopicIcon(genre)} {cleanGenre}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-muted-foreground hover:text-gold transition-colors" onClick={handleShare}>
                  <Share2 className="h-3.5 w-3.5" />
                </button>
                <button className="text-muted-foreground hover:text-gold transition-colors"
                  onClick={(e) => { e.stopPropagation(); toast.success("Saved!"); }}>
                  <Bookmark className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Live Game Score */}
          {isLiveGame && homeTeam && awayTeam && (
            <div className="bg-secondary rounded-xl px-4 py-3 flex items-center justify-between">
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">{homeTeam}</p>
                <p className="text-[10px] text-muted-foreground">Home</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold text-foreground">{homeScore} — {awayScore}</p>
                {matchMinute && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive mt-0.5">
                    <span className="w-1 h-1 rounded-full bg-destructive animate-pulse inline-block" />
                    {matchMinute}
                  </span>
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">{awayTeam}</p>
                <p className="text-[10px] text-muted-foreground">Away</p>
              </div>
            </div>
          )}

          {/* League name for sports */}
          {leagueName && (
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{leagueName}</p>
          )}

          {/* Question */}
          <h3 className="text-base font-semibold text-foreground leading-snug line-clamp-2">
            {question}
          </h3>

          {/* Options */}
          {options && options.length > 0 ? (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                {(showMore ? options : options.slice(0, 2)).map((opt, i) => {
                  const colors = OPTION_COLORS[i % OPTION_COLORS.length];
                  return (
                    <button key={i}
                      onClick={(e) => { e.stopPropagation(); setSelectedOption(opt.label); openStake(e, "yes", opt.label); }}
                      className={`flex flex-col items-center justify-center px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${selectedOption === opt.label
                          ? `${colors.bg} ${colors.border} border-2`
                          : `border-border bg-secondary ${colors.hover} ${colors.glow}`
                        }`}
                    >
                      <span className={`font-semibold text-sm ${selectedOption === opt.label ? colors.text : "text-foreground"}`}>
                        {opt.label}
                      </span>
                      <span className={`text-[11px] mt-0.5 ${selectedOption === opt.label ? colors.text : "text-muted-foreground"}`}>
                        {opt.percent}%
                      </span>
                    </button>
                  );
                })}
              </div>

              {showMore && options.length > 2 && (
                <div className="flex flex-col gap-1.5">
                  {options.slice(2).map((opt, i) => {
                    const colors = OPTION_COLORS[(i + 2) % OPTION_COLORS.length];
                    return (
                      <button key={i}
                        onClick={(e) => { e.stopPropagation(); setSelectedOption(opt.label); openStake(e, "yes", opt.label); }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${selectedOption === opt.label
                            ? `${colors.bg} ${colors.border} border-2`
                            : `border-border bg-secondary ${colors.hover} ${colors.glow}`
                          }`}
                      >
                        <span className="flex-1 text-left text-sm font-medium text-foreground">{opt.label}</span>
                        <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gold" style={{ width: `${opt.percent}%` }} />
                        </div>
                        <span className="text-[11px] text-muted-foreground w-7 text-right">{opt.percent}%</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {hasMultipleOptions && (
                <button onClick={(e) => { e.stopPropagation(); setShowMore(!showMore); }}
                  className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-gold border border-dashed border-border hover:border-gold/50 rounded-xl py-1.5 transition-all">
                  {showMore
                    ? <><ChevronUp className="h-3 w-3" /> fewer options</>
                    : <><ChevronDown className="h-3 w-3" /> +{hiddenCount} more options</>}
                </button>
              )}
            </div>
          ) : (
            /* Standard Agree/Disagree */
            <div className="grid grid-cols-2 gap-2">
              <button onClick={(e) => openStake(e, "yes")}
                className="flex flex-col items-center py-2.5 rounded-xl border border-border bg-secondary hover:border-yes hover:bg-yes/10 hover:shadow-[0_0_16px_rgba(34,197,94,0.25)] transition-all">
                <span className="text-sm font-semibold text-yes">Agree</span>
                <span className="text-[11px] text-muted-foreground">{yesPercent}%</span>
              </button>
              <button onClick={(e) => openStake(e, "no")}
                className="flex flex-col items-center py-2.5 rounded-xl border border-border bg-secondary hover:border-destructive hover:bg-destructive/10 hover:shadow-[0_0_16px_rgba(239,68,68,0.25)] transition-all">
                <span className="text-sm font-semibold text-destructive">Disagree</span>
                <span className="text-[11px] text-muted-foreground">{noPercent}%</span>
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-border mt-auto">
            <span className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">{coins > 100 ? Math.floor(coins / 100) + "K" : coins}</span> coins
            </span>
            {isLive ? (
              <span className="flex items-center gap-1 text-[11px] text-gold">
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