import { useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, Activity, Timer, Share2, MessageCircle, Eye, Users, CheckCircle2, XCircle, Bell, TrendingUp, Swords, Flame, Zap } from "lucide-react";
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

// Neutral-only — color is used ONLY for data bars and percentages, never for card structure
const OPTION_COLORS = [
  "#F5C518", "#22C55E", "#3B82F6", "#A855F7",
  "#F97316", "#EF4444", "#06B6D4", "#84CC16",
  "#EC4899", "#14B8A6", "#8B5CF6", "#EAB308",
];

function getOptionColor(cardIndex: number, optionIndex: number): string {
  return OPTION_COLORS[(cardIndex * 3 + optionIndex * 2 + optionIndex) % OPTION_COLORS.length];
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
  if (score >= 75) return "text-[#22C55E]";
  if (score >= 50) return "text-[#F5C518]";
  return "text-[#EF4444]";
}

/** Derive an activity tag from card data */
function getActivityTag(data: OpinionCardData): { label: string; icon: React.ReactNode; color: string } | null {
  const { isRising, commentCount = 0, timeLeft, risingScore = 0 } = data;
  const isLive = timeLeft === "Live" || timeLeft.includes("min");
  if (isLive) return { label: "Active", icon: <Activity className="h-2.5 w-2.5" />, color: "#22C55E" };
  if (timeLeft.includes("h left") && parseInt(timeLeft) <= 3)
    return { label: "Breaking", icon: <Zap className="h-2.5 w-2.5" />, color: "#EF4444" };
  if (isRising || risingScore > 15)
    return { label: "Rising", icon: <TrendingUp className="h-2.5 w-2.5" />, color: "#F97316" };
  if (commentCount > 20 || risingScore > 8)
    return { label: "Heated", icon: <Flame className="h-2.5 w-2.5" />, color: "#F5C518" };
  return null;
}

/** Simulated belief delta */
function getDelta(cardIndex: number, optionIndex: number): number {
  const seed = (cardIndex * 7 + optionIndex * 3 + 13) % 9;
  return [-5, -3, -2, -1, 0, 1, 2, 3, 5][seed];
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



  const isLive = isLiveGame || timeLeft === "Live" || timeLeft.includes("min");
  // Strip emoji from genre string for clean display
  const cleanGenre = genre.replace(/\s*[\u{1F000}-\u{1FFFF}]/u, "").trim();
  const yesColor = getOptionColor(index, 0);
  const noColor = getOptionColor(index, 1);
  const activityTag = getActivityTag(data);

  const openDebate = (e: React.MouseEvent, stance: "agree" | "disagree" | "challenge") => {
    e.stopPropagation();
    navigate(`/opinion/${data.id}`);
  };


  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) { toast.error("Log in to follow!"); navigate("/auth"); return; }
    setFollowed(!followed);
    toast.success(followed ? "Unfollowed" : "Following this call!");
  };

  return (
    <>
      <motion.div
        className="bg-card border border-border rounded-xl overflow-hidden flex flex-col cursor-pointer transition-colors duration-200 hover:border-border/80"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: index * 0.035 }}
        onClick={() => navigate(`/opinion/${data.id}`)}
      >
        <div className="p-4 flex flex-col gap-3 flex-1">

          {/* ── Topic context label — FOOTBALL • PREMIER LEAGUE style ── */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {topicIcon && (
                <span className="text-sm shrink-0">{topicIcon}</span>
              )}
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  {cleanGenre}
                </span>
                {leagueName && (
                  <>
                    <span className="text-[11px] text-muted-foreground/50">•</span>
                    <span className="text-[11px] text-muted-foreground/70 uppercase tracking-wider truncate">
                      {leagueName}
                    </span>
                  </>
                )}
              </div>
              {/* Activity tag — small and subtle */}
              {activityTag && (
                <span
                  className="flex items-center gap-0.5 text-[10px] font-semibold ml-1 shrink-0"
                  style={{ color: activityTag.color + "CC" }}
                >
                  {activityTag.icon} {activityTag.label}
                </span>
              )}
              {isLive && !activityTag && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-destructive shrink-0">
                  <span className="w-1 h-1 rounded-full bg-destructive animate-pulse inline-block" />
                  LIVE
                </span>
              )}
            </div>
            {/* Actions row — top right */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                className={`p-1.5 rounded transition-colors ${followed ? "text-gold" : "text-muted-foreground/50 hover:text-muted-foreground"}`}
                onClick={handleFollow}
              >
                <Bell className={`h-3.5 w-3.5 ${followed ? "fill-gold" : ""}`} />
              </button>
              <button
                className="text-muted-foreground/50 hover:text-muted-foreground transition-colors p-1.5 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(window.location.origin + "/opinion/" + data.id);
                  toast.success("Link copied!");
                }}
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
              <button
                className="text-muted-foreground/50 hover:text-muted-foreground transition-colors p-1.5 rounded"
                onClick={(e) => { e.stopPropagation(); toast.success("Saved!"); }}
              >
                <Bookmark className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Live Score */}
          {isLiveGame && homeTeam && awayTeam && (
            <div className="bg-secondary/60 rounded-lg px-3 py-2 flex items-center justify-between border border-border/50">
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">{homeTeam}</p>
                <p className="text-[10px] text-muted-foreground">Home</p>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-foreground">{homeScore} — {awayScore}</p>
                {matchMinute && <span className="text-[10px] font-medium text-destructive">{matchMinute}'</span>}
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">{awayTeam}</p>
                <p className="text-[10px] text-muted-foreground">Away</p>
              </div>
            </div>
          )}

          {/* ── Question — 18px / 600 per spec ── */}
          <h3 className="text-[17px] leading-snug font-semibold text-foreground line-clamp-2 flex-1">
            {question}
          </h3>

          {/* Creator */}
          {creatorUsername && (
            <div className="flex items-center gap-2 -mt-1 flex-wrap">
              <span className="text-[11px] text-muted-foreground">
                by <span className="font-medium text-foreground/70">@{creatorUsername}</span>
              </span>
              {creatorReputation !== undefined && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded bg-secondary ${reputationColor(creatorReputation)}`}>
                  {creatorReputation}% acc.
                </span>
              )}
              {createdAt && (
                <span className="text-[11px] text-muted-foreground">· {timeAgo(createdAt)}</span>
              )}
            </div>
          )}

          {/* ── Belief options with delta indicators — data-first ── */}
          {options && options.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {(showMore ? options : options.slice(0, 2)).map((opt, i) => {
                const color = getOptionColor(index, i);
                const isSelected = selectedOption === opt.label;
                const delta = getDelta(index, i);
                return (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setSelectedOption(opt.label); navigate(`/opinion/${data.id}`); }}
                    className={`w-full rounded-lg border transition-colors duration-150 overflow-hidden text-left ${
                      isSelected
                        ? "border-border bg-secondary/60"
                        : "border-border/50 bg-secondary/20 hover:bg-secondary/40"
                    }`}
                  >
                    <div className="px-3 py-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[13px] font-medium text-foreground">
                          {opt.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-semibold" style={{ color }}>{opt.percent}%</span>
                          {delta !== 0 && (
                            <span className="text-[10px] font-semibold tabular-nums"
                              style={{ color: delta > 0 ? "#22C55E" : "#EF4444" }}>
                              {delta > 0 ? `↑+${delta}` : `↓${delta}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-[2px] rounded-full bg-border overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${opt.percent}%`, background: color + "CC" }} />
                      </div>
                    </div>
                  </button>
                );
              })}
              {options.length > 2 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMore(!showMore); }}
                  className="text-[11px] text-muted-foreground hover:text-foreground py-0.5 transition-colors text-center"
                >
                  {showMore ? "↑ less" : `+${options.length - 2} more`}
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {[{ label: "Agree", color: yesColor, pct: yesPercent, di: 0 }, { label: "Disagree", color: noColor, pct: noPercent, di: 1 }].map(({ label, color, pct, di }) => {
                const delta = getDelta(index, di);
                return (
                  <button key={label}
                    onClick={(e) => { e.stopPropagation(); navigate(`/opinion/${data.id}`); }}
                    className="w-full rounded-lg border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors duration-150 overflow-hidden text-left"
                  >
                    <div className="px-3 py-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[13px] font-medium text-foreground">{label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-semibold" style={{ color }}>{pct}%</span>
                          {delta !== 0 && (
                            <span className="text-[10px] font-semibold tabular-nums"
                              style={{ color: delta > 0 ? "#22C55E" : "#EF4444" }}>
                              {delta > 0 ? `↑+${delta}` : `↓${delta}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-[2px] rounded-full bg-border overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color + "CC" }} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Social proof — understated ── */}
          <div className="flex items-center justify-between pt-1.5 border-t border-border/40 mt-auto">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Users className="h-3 w-3" />
                <span className="font-medium text-foreground/70">{formatCount(coins)}</span> callers
              </span>
              {commentCount > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MessageCircle className="h-3 w-3" />
                  <span className="font-medium text-foreground/70">{commentCount}</span> arguments
                </span>
              )}
              {followerCount > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Eye className="h-3 w-3" /> {formatCount(followerCount)}
                </span>
              )}
            </div>
            {isLive ? (
              <span className="flex items-center gap-1 text-[11px] font-medium text-[#22C55E]">
                <Activity className="h-3 w-3" /> Live
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Timer className="h-3 w-3" /> {timeLeft}
              </span>
            )}
          </div>

          {/* ── Debate actions — opens modal, NOT navigation ── */}
          <div className="flex items-center gap-0.5 -mx-0.5 pt-1 border-t border-border/30">
            <button
              onClick={(e) => openDebate(e, "agree")}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex-1 justify-center text-muted-foreground hover:text-[#22C55E] hover:bg-[#22C55E]/8"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Agree
            </button>
            <button
              onClick={(e) => openDebate(e, "disagree")}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex-1 justify-center text-muted-foreground hover:text-[#EF4444] hover:bg-[#EF4444]/8"
            >
              <XCircle className="h-3.5 w-3.5" /> Disagree
            </button>
            <button
              onClick={(e) => openDebate(e, "challenge")}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex-1 justify-center text-muted-foreground hover:text-gold hover:bg-gold/8"
            >
              <Swords className="h-3.5 w-3.5" /> Challenge
            </button>
            <button
              onClick={handleFollow}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex-1 justify-center ${
                followed
                  ? "text-gold"
                  : "text-muted-foreground hover:text-muted-foreground/80"
              }`}
            >
              <Bell className="h-3.5 w-3.5" /> {followed ? "Following" : "Follow"}
            </button>
          </div>
        </div>
      </motion.div>


    </>

  );
};

export default OpinionCard;