import { useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, Activity, Timer, Share2, MessageCircle, Eye, Users, CheckCircle2, XCircle, Bell, TrendingUp, Swords } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";

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
  creatorReputation?: number;
  createdAt?: string;
  commentCount?: number;
  watcherCount?: number;
  followerCount?: number;
  risingScore?: number;
  isRising?: boolean;
}

const CARD_THEMES = [
  { accent: "#F5C518", borderHover: "hover:border-[#F5C518]/60", shadow: "hover:shadow-[0_0_24px_rgba(245,197,24,0.15)]", badge: "bg-[#F5C518]/10 text-[#F5C518]" },
  { accent: "#00C278", borderHover: "hover:border-[#00C278]/60", shadow: "hover:shadow-[0_0_24px_rgba(0,194,120,0.15)]", badge: "bg-[#00C278]/10 text-[#00C278]" },
  { accent: "#3B82F6", borderHover: "hover:border-[#3B82F6]/60", shadow: "hover:shadow-[0_0_24px_rgba(59,130,246,0.15)]", badge: "bg-[#3B82F6]/10 text-[#3B82F6]" },
  { accent: "#A855F7", borderHover: "hover:border-[#A855F7]/60", shadow: "hover:shadow-[0_0_24px_rgba(168,85,247,0.15)]", badge: "bg-[#A855F7]/10 text-[#A855F7]" },
  { accent: "#F97316", borderHover: "hover:border-[#F97316]/60", shadow: "hover:shadow-[0_0_24px_rgba(249,115,22,0.15)]", badge: "bg-[#F97316]/10 text-[#F97316]" },
  { accent: "#F43F5E", borderHover: "hover:border-[#F43F5E]/60", shadow: "hover:shadow-[0_0_24px_rgba(244,63,94,0.15)]", badge: "bg-[#F43F5E]/10 text-[#F43F5E]" },
  { accent: "#06B6D4", borderHover: "hover:border-[#06B6D4]/60", shadow: "hover:shadow-[0_0_24px_rgba(6,182,212,0.15)]", badge: "bg-[#06B6D4]/10 text-[#06B6D4]" },
];

const ALL_COLORS = [
  "#F5C518", "#00C278", "#3B82F6", "#A855F7",
  "#F97316", "#F43F5E", "#06B6D4", "#84CC16",
  "#EC4899", "#EAB308", "#14B8A6", "#8B5CF6",
];

function getOptionColor(cardIndex: number, optionIndex: number): string {
  return ALL_COLORS[(cardIndex * 3 + optionIndex * 2 + optionIndex) % ALL_COLORS.length];
}

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

function formatCount(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

function reputationColor(score?: number): string {
  if (!score) return "text-muted-foreground";
  if (score >= 75) return "text-[#00C278]";
  if (score >= 50) return "text-[#F5C518]";
  return "text-[#EF4444]";
}

const OpinionCard = ({ data, index }: { data: OpinionCardData; index: number }) => {
  const {
    question, yesPercent, noPercent, coins, timeLeft, genre,
    topicIcon, isLiveGame, homeTeam, awayTeam, homeScore, awayScore, matchMinute,
    options, leagueName, creatorUsername, creatorReputation, createdAt,
    commentCount = 0, followerCount = 0, isRising = false,
  } = data;

  const navigate = useNavigate();
  const { isLoggedIn } = useApp();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [followed, setFollowed] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const theme = CARD_THEMES[index % CARD_THEMES.length];
  const isLive = isLiveGame || timeLeft === "Live" || timeLeft.includes("min");
  const cleanGenre = genre.replace(/\s*[\u{1F000}-\u{1FFFF}]/u, "").trim();
  const yesColor = getOptionColor(index, 0);
  const noColor = getOptionColor(index, 1);

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) { toast.error("Log in to follow!"); navigate("/auth"); return; }
    setFollowed(!followed);
    toast.success(followed ? "Unfollowed" : "Following this call!");
  };

  const handleAgreeDisagree = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/opinion/${data.id}`);
  };

  const handleDiscuss = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/opinion/${data.id}#debate`);
  };

  return (
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
          <div className="flex items-center gap-2 flex-wrap">
            {/* No topic icon image — text badge only */}
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${theme.badge}`}>
              {cleanGenre}
            </span>
            {isRising && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-500">
                <TrendingUp className="h-2.5 w-2.5" /> Rising
              </span>
            )}
            {isLive && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive">
                <span className="w-1 h-1 rounded-full bg-destructive animate-pulse inline-block" />
                LIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              className={`p-1 transition-colors ${followed ? "text-gold" : "text-muted-foreground hover:text-gold"}`}
              onClick={handleFollow}
            >
              <Bell className={`h-3.5 w-3.5 ${followed ? "fill-gold" : ""}`} />
            </button>
            <button
              className="text-muted-foreground hover:text-gold transition-colors p-1"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(window.location.origin + "/opinion/" + data.id);
                toast.success("Link copied!");
              }}
            >
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

        {leagueName && (
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold -mt-1">
            {leagueName}
          </p>
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

        {/* Creator */}
        {creatorUsername && (
          <div className="flex items-center gap-2 -mt-1 flex-wrap">
            <span className="text-[11px] text-muted-foreground">
              by <span className="font-semibold" style={{ color: theme.accent }}>@{creatorUsername}</span>
            </span>
            {creatorReputation !== undefined && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-secondary ${reputationColor(creatorReputation)}`}>
                {creatorReputation}% accuracy
              </span>
            )}
            {createdAt && (
              <span className="text-[11px] text-muted-foreground">· {timeAgo(createdAt)}</span>
            )}
          </div>
        )}

        {/* Options — clean bar only, no background fill */}
        {options && options.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {(showMore ? options : options.slice(0, 2)).map((opt, i) => {
              const color = getOptionColor(index, i);
              const isSelected = selectedOption === opt.label;
              return (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setSelectedOption(opt.label); navigate(`/opinion/${data.id}`); }}
                  className={`w-full rounded-xl border transition-all duration-150 overflow-hidden ${isSelected ? "border-2 bg-secondary/50" : "border-border/40 bg-secondary/20 hover:bg-secondary/50"
                    }`}
                  style={isSelected ? { borderColor: color } : {}}
                >
                  <div className="px-3 py-2.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold"
                        style={{ color: isSelected ? color : undefined }}>
                        {isSelected
                          ? <span style={{ color }}>{opt.label}</span>
                          : <span className="text-foreground">{opt.label}</span>}
                      </span>
                      <span className="text-sm font-bold" style={{ color }}>{opt.percent}%</span>
                    </div>
                    <div className="h-[3px] rounded-full bg-border/60 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${opt.percent}%`, background: color }} />
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
                {showMore ? "↑ fewer" : `↓ +${options.length - 2} more options`}
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/opinion/${data.id}`); }}
              className="w-full rounded-xl border border-border/40 bg-secondary/20 hover:bg-secondary/50 transition-all duration-150 overflow-hidden"
            >
              <div className="px-3 py-2.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold" style={{ color: yesColor }}>Agree</span>
                  <span className="text-sm font-bold" style={{ color: yesColor }}>{yesPercent}%</span>
                </div>
                <div className="h-[3px] rounded-full bg-border/60 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${yesPercent}%`, background: yesColor }} />
                </div>
              </div>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/opinion/${data.id}`); }}
              className="w-full rounded-xl border border-border/40 bg-secondary/20 hover:bg-secondary/50 transition-all duration-150 overflow-hidden"
            >
              <div className="px-3 py-2.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold" style={{ color: noColor }}>Disagree</span>
                  <span className="text-sm font-bold" style={{ color: noColor }}>{noPercent}%</span>
                </div>
                <div className="h-[3px] rounded-full bg-border/60 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${noPercent}%`, background: noColor }} />
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Social proof */}
        <div className="flex items-center justify-between pt-1.5 border-t border-border/50 mt-auto">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Users className="h-3 w-3" />
              <span className="font-semibold text-foreground">{formatCount(coins)}</span> callers
            </span>
            {followerCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Eye className="h-3 w-3" /> {formatCount(followerCount)} watching
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

        {/* Engagement actions — all navigate to opinion detail */}
        <div className="flex items-center gap-1 -mx-1 pt-1 border-t border-border/30">
          <button
            onClick={handleAgreeDisagree}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-colors flex-1 justify-center"
            style={{ color: yesColor }}
            onMouseEnter={e => (e.currentTarget.style.background = yesColor + "15")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Agree
          </button>
          <button
            onClick={handleAgreeDisagree}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-colors flex-1 justify-center"
            style={{ color: noColor }}
            onMouseEnter={e => (e.currentTarget.style.background = noColor + "15")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <XCircle className="h-3.5 w-3.5" /> Disagree
          </button>
          <button
            onClick={handleDiscuss}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-muted-foreground hover:text-gold hover:bg-gold/10 transition-colors flex-1 justify-center"
          >
            <Swords className="h-3.5 w-3.5" /> Debate
          </button>
          <button
            onClick={handleFollow}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-colors flex-1 justify-center ${followed ? "text-gold bg-gold/10" : "text-muted-foreground hover:text-gold hover:bg-gold/10"
              }`}
          >
            <Bell className="h-3.5 w-3.5" /> {followed ? "Following" : "Follow"}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default OpinionCard;