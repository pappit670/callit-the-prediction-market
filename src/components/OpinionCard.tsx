import { useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, Activity, Timer, Share2, MessageCircle, Eye, Users, CheckCircle2, XCircle, Bell } from "lucide-react";
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
  creatorUsername?: string;
  createdAt?: string;
  commentCount?: number;
  watcherCount?: number;
}

const CARD_THEMES = [
  {
    accent: "#F5C518",
    borderHover: "hover:border-[#F5C518]/60",
    shadow: "hover:shadow-[0_0_24px_rgba(245,197,24,0.15)]",
    badge: "bg-[#F5C518]/10 text-[#F5C518]",
    topBorder: "border-t-[#F5C518]",
  },
  {
    accent: "#00C278",
    borderHover: "hover:border-[#00C278]/60",
    shadow: "hover:shadow-[0_0_24px_rgba(0,194,120,0.15)]",
    badge: "bg-[#00C278]/10 text-[#00C278]",
    topBorder: "border-t-[#00C278]",
  },
  {
    accent: "#3B82F6",
    borderHover: "hover:border-[#3B82F6]/60",
    shadow: "hover:shadow-[0_0_24px_rgba(59,130,246,0.15)]",
    badge: "bg-[#3B82F6]/10 text-[#3B82F6]",
    topBorder: "border-t-[#3B82F6]",
  },
  {
    accent: "#A855F7",
    borderHover: "hover:border-[#A855F7]/60",
    shadow: "hover:shadow-[0_0_24px_rgba(168,85,247,0.15)]",
    badge: "bg-[#A855F7]/10 text-[#A855F7]",
    topBorder: "border-t-[#A855F7]",
  },
  {
    accent: "#F97316",
    borderHover: "hover:border-[#F97316]/60",
    shadow: "hover:shadow-[0_0_24px_rgba(249,115,22,0.15)]",
    badge: "bg-[#F97316]/10 text-[#F97316]",
    topBorder: "border-t-[#F97316]",
  },
  {
    accent: "#F43F5E",
    borderHover: "hover:border-[#F43F5E]/60",
    shadow: "hover:shadow-[0_0_24px_rgba(244,63,94,0.15)]",
    badge: "bg-[#F43F5E]/10 text-[#F43F5E]",
    topBorder: "border-t-[#F43F5E]",
  },
  {
    accent: "#06B6D4",
    borderHover: "hover:border-[#06B6D4]/60",
    shadow: "hover:shadow-[0_0_24px_rgba(6,182,212,0.15)]",
    badge: "bg-[#06B6D4]/10 text-[#06B6D4]",
    topBorder: "border-t-[#06B6D4]",
  },
];

// Per option colors — cycle through independently of card theme
const OPTION_COLORS = [
  { hex: "#F5C518", border: "border-[#F5C518]/40", bg: "bg-[#F5C518]/10", text: "text-[#F5C518]", hover: "hover:border-[#F5C518] hover:bg-[#F5C518]/20 hover:shadow-[0_0_16px_rgba(245,197,24,0.35)]" },
  { hex: "#00C278", border: "border-[#00C278]/40", bg: "bg-[#00C278]/10", text: "text-[#00C278]", hover: "hover:border-[#00C278] hover:bg-[#00C278]/20 hover:shadow-[0_0_16px_rgba(0,194,120,0.35)]" },
  { hex: "#3B82F6", border: "border-[#3B82F6]/40", bg: "bg-[#3B82F6]/10", text: "text-[#3B82F6]", hover: "hover:border-[#3B82F6] hover:bg-[#3B82F6]/20 hover:shadow-[0_0_16px_rgba(59,130,246,0.35)]" },
  { hex: "#A855F7", border: "border-[#A855F7]/40", bg: "bg-[#A855F7]/10", text: "text-[#A855F7]", hover: "hover:border-[#A855F7] hover:bg-[#A855F7]/20 hover:shadow-[0_0_16px_rgba(168,85,247,0.35)]" },
  { hex: "#F97316", border: "border-[#F97316]/40", bg: "bg-[#F97316]/10", text: "text-[#F97316]", hover: "hover:border-[#F97316] hover:bg-[#F97316]/20 hover:shadow-[0_0_16px_rgba(249,115,22,0.35)]" },
  { hex: "#F43F5E", border: "border-[#F43F5E]/40", bg: "bg-[#F43F5E]/10", text: "text-[#F43F5E]", hover: "hover:border-[#F43F5E] hover:bg-[#F43F5E]/20 hover:shadow-[0_0_16px_rgba(244,63,94,0.35)]" },
  { hex: "#06B6D4", border: "border-[#06B6D4]/40", bg: "bg-[#06B6D4]/10", text: "text-[#06B6D4]", hover: "hover:border-[#06B6D4] hover:bg-[#06B6D4]/20 hover:shadow-[0_0_16px_rgba(6,182,212,0.35)]" },
];

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}

const OpinionCard = ({ data, index }: { data: OpinionCardData; index: number }) => {
  const {
    question, yesPercent, noPercent, coins, timeLeft, genre,
    topicIcon, topicColor, status = "open",
    isLiveGame, homeTeam, awayTeam, homeScore, awayScore, matchMinute,
    options, leagueName, creatorUsername, createdAt,
    commentCount = 0, watcherCount = 0,
  } = data;

  const navigate = useNavigate();
  const { isLoggedIn } = useApp();
  const [stakeModal, setStakeModal] = useState<{ side: "yes" | "no"; optionLabel?: string } | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [followed, setFollowed] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // Each card gets a unique theme based on index
  const theme = CARD_THEMES[index % CARD_THEMES.length];
  const isLive = isLiveGame || timeLeft === "Live" || timeLeft.includes("min");
  const cleanGenre = genre.replace(/\s*[\u{1F000}-\u{1FFFF}]/u, "").trim();

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

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) { toast.error("Log in to follow!"); navigate("/auth"); return; }
    setFollowed(!followed);
    toast.success(followed ? "Unfollowed" : "Following this call!");
  };

  const handleDiscuss = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/opinion/${data.id}#comments`);
  };

  return (
    <>
      <motion.div
        className={`bg-card border border-border rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-200 group border-t-2 ${theme.borderHover} ${theme.shadow}`}
        style={{ borderTopColor: theme.accent }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.04 }}
        onClick={() => navigate(`/opinion/${data.id}`)}
      >
        <div className="p-4 flex flex-col gap-3 flex-1">

          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center text-sm border bg-secondary flex-shrink-0"
                style={{ borderColor: theme.accent + "50" }}
              >
                {topicIcon || "📰"}
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${theme.badge}`}
              >
                {cleanGenre}
              </span>
              {isLive && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive">
                  <span className="w-1 h-1 rounded-full bg-destructive animate-pulse inline-block" />
                  LIVE
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                className={`p-1 transition-colors ${followed ? "text-gold" : "text-muted-foreground hover:text-gold"}`}
                onClick={handleFollow}
              >
                <Bell className={`h-3.5 w-3.5 ${followed ? "fill-gold" : ""}`} />
              </button>
              <button className="text-muted-foreground hover:text-gold transition-colors p-1" onClick={handleShare}>
                <Share2 className="h-3.5 w-3.5" />
              </button>
              <button
                className="text-muted-foreground hover:text-gold transition-colors p-1"
                onClick={(e) => { e.stopPropagation(); toast.success("Saved!"); }}
              >
                <Bookmark className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* League */}
          {leagueName && (
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold -mt-1">{leagueName}</p>
          )}

          {/* Live Score */}
          {isLiveGame && homeTeam && awayTeam && (
            <div className="bg-secondary rounded-xl px-3 py-2.5 flex items-center justify-between">
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">{homeTeam}</p>
                <p className="text-[10px] text-muted-foreground">Home</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{homeScore} — {awayScore}</p>
                {matchMinute && <span className="text-[10px] font-medium text-destructive">{matchMinute}'</span>}
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">{awayTeam}</p>
                <p className="text-[10px] text-muted-foreground">Away</p>
              </div>
            </div>
          )}

          {/* Question */}
          <h3 className="text-[17px] font-semibold text-foreground leading-snug line-clamp-2 flex-1">
            {question}
          </h3>

          {/* Creator + time */}
          {(creatorUsername || createdAt) && (
            <div className="flex items-center gap-2 -mt-1">
              {creatorUsername && (
                <span className="text-[11px] text-muted-foreground">
                  by <span className="font-semibold" style={{ color: theme.accent }}>@{creatorUsername}</span>
                </span>
              )}
              {createdAt && (
                <span className="text-[11px] text-muted-foreground">· {timeAgo(createdAt)}</span>
              )}
            </div>
          )}

          {/* Options with probability bars */}
          {options && options.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {(showMore ? options : options.slice(0, 2)).map((opt, i) => {
                // Options use their own color cycle independent of card theme
                const oc = OPTION_COLORS[i % OPTION_COLORS.length];
                const isSelected = selectedOption === opt.label;
                return (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setSelectedOption(opt.label); openStake(e, "yes", opt.label); }}
                    className={`w-full rounded-xl border-2 overflow-hidden transition-all duration-150 ${isSelected ? `${oc.bg} ${oc.border} shadow-lg` : `border-border/40 bg-secondary/40 ${oc.hover}`
                      }`}
                  >
                    <div className="relative px-3 py-2.5">
                      <div
                        className="absolute inset-0 opacity-15 rounded-xl transition-all duration-500"
                        style={{ width: `${opt.percent}%`, background: oc.hex }}
                      />
                      <div className="relative flex items-center justify-between">
                        <span className={`text-sm font-bold ${isSelected ? oc.text : "text-foreground"}`}>
                          {opt.label}
                        </span>
                        <span className="text-sm font-bold" style={{ color: oc.hex }}>
                          {opt.percent}%
                        </span>
                      </div>
                      <div className="relative mt-1.5 h-1 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${opt.percent}%`, background: oc.hex }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}

              {options.length > 2 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMore(!showMore); }}
                  className="text-[11px] text-muted-foreground hover:text-gold py-1 transition-colors text-center"
                >
                  {showMore ? "↑ fewer options" : `↓ +${options.length - 2} more options`}
                </button>
              )}
            </div>
          ) : (
            /* Standard Yes / No */
            <div className="flex flex-col gap-1.5">
              <button
                onClick={(e) => openStake(e, "yes")}
                className="w-full rounded-xl border-2 border-border/40 bg-secondary/40 hover:border-[#00C278] hover:bg-[#00C278]/15 hover:shadow-[0_0_18px_rgba(0,194,120,0.4)] transition-all duration-150 overflow-hidden"
              >
                <div className="relative px-3 py-2.5">
                  <div className="absolute inset-0 opacity-15 rounded-xl" style={{ width: `${yesPercent}%`, background: "#00C278" }} />
                  <div className="relative flex items-center justify-between">
                    <span className="text-sm font-bold text-[#00C278]">Agree</span>
                    <span className="text-sm font-bold text-[#00C278]">{yesPercent}%</span>
                  </div>
                  <div className="relative mt-1.5 h-1 rounded-full bg-border overflow-hidden">
                    <div className="h-full rounded-full bg-[#00C278] transition-all" style={{ width: `${yesPercent}%` }} />
                  </div>
                </div>
              </button>
              <button
                onClick={(e) => openStake(e, "no")}
                className="w-full rounded-xl border-2 border-border/40 bg-secondary/40 hover:border-[#EF4444] hover:bg-[#EF4444]/15 hover:shadow-[0_0_18px_rgba(239,68,68,0.4)] transition-all duration-150 overflow-hidden"
              >
                <div className="relative px-3 py-2.5">
                  <div className="absolute inset-0 opacity-15 rounded-xl" style={{ width: `${noPercent}%`, background: "#EF4444" }} />
                  <div className="relative flex items-center justify-between">
                    <span className="text-sm font-bold text-[#EF4444]">Disagree</span>
                    <span className="text-sm font-bold text-[#EF4444]">{noPercent}%</span>
                  </div>
                  <div className="relative mt-1.5 h-1 rounded-full bg-border overflow-hidden">
                    <div className="h-full rounded-full bg-[#EF4444] transition-all" style={{ width: `${noPercent}%` }} />
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Social proof footer */}
          <div className="flex items-center justify-between pt-1.5 border-t border-border/50 mt-auto">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Users className="h-3 w-3" />
                <span className="font-semibold text-foreground">{coins >= 1000 ? (coins / 1000).toFixed(1) + "K" : coins}</span>
              </span>
              {watcherCount > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Eye className="h-3 w-3" /> {watcherCount}
                </span>
              )}
              {commentCount > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MessageCircle className="h-3 w-3" /> {commentCount}
                </span>
              )}
            </div>
            {isLive ? (
              <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: theme.accent }}>
                <Activity className="h-3 w-3" /> Live
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Timer className="h-3 w-3" /> {timeLeft}
              </span>
            )}
          </div>

          {/* Engagement actions */}
          <div className="flex items-center gap-1 -mx-1 pt-1 border-t border-border/30">
            <button
              onClick={(e) => openStake(e, "yes")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[#00C278] hover:bg-[#00C278]/10 transition-colors flex-1 justify-center"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Agree
            </button>
            <button
              onClick={(e) => openStake(e, "no")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors flex-1 justify-center"
            >
              <XCircle className="h-3.5 w-3.5" /> Disagree
            </button>
            <button
              onClick={handleDiscuss}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-muted-foreground hover:text-gold hover:bg-gold/10 transition-colors flex-1 justify-center"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Discuss
            </button>
            <button
              onClick={handleFollow}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors flex-1 justify-center ${followed ? "text-gold bg-gold/10" : "text-muted-foreground hover:text-gold hover:bg-gold/10"
                }`}
            >
              <Bell className="h-3.5 w-3.5" /> {followed ? "Following" : "Follow"}
            </button>
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