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

const OPTION_COLORS = [
  { border: "border-[#F5C518]", bg: "bg-[#F5C518]/15", text: "text-[#F5C518]", hoverBorder: "hover:border-[#F5C518]", hoverBg: "hover:bg-[#F5C518]/15", glow: "hover:shadow-[0_0_18px_rgba(245,197,24,0.45)]", hex: "#F5C518", barBg: "bg-[#F5C518]" },
  { border: "border-[#00C278]", bg: "bg-[#00C278]/15", text: "text-[#00C278]", hoverBorder: "hover:border-[#00C278]", hoverBg: "hover:bg-[#00C278]/15", glow: "hover:shadow-[0_0_18px_rgba(0,194,120,0.45)]", hex: "#00C278", barBg: "bg-[#00C278]" },
  { border: "border-[#3B82F6]", bg: "bg-[#3B82F6]/15", text: "text-[#3B82F6]", hoverBorder: "hover:border-[#3B82F6]", hoverBg: "hover:bg-[#3B82F6]/15", glow: "hover:shadow-[0_0_18px_rgba(59,130,246,0.45)]", hex: "#3B82F6", barBg: "bg-[#3B82F6]" },
  { border: "border-[#A855F7]", bg: "bg-[#A855F7]/15", text: "text-[#A855F7]", hoverBorder: "hover:border-[#A855F7]", hoverBg: "hover:bg-[#A855F7]/15", glow: "hover:shadow-[0_0_18px_rgba(168,85,247,0.45)]", hex: "#A855F7", barBg: "bg-[#A855F7]" },
  { border: "border-[#F97316]", bg: "bg-[#F97316]/15", text: "text-[#F97316]", hoverBorder: "hover:border-[#F97316]", hoverBg: "hover:bg-[#F97316]/15", glow: "hover:shadow-[0_0_18px_rgba(249,115,22,0.45)]", hex: "#F97316", barBg: "bg-[#F97316]" },
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
        className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col cursor-pointer hover:border-gold/40 hover:shadow-lg transition-all duration-200 group"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.04 }}
        onClick={() => navigate(`/opinion/${data.id}`)}
      >
        <div className="p-4 flex flex-col gap-3 flex-1">

          {/* Header — topic icon + genre + live + actions */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center text-sm border bg-secondary flex-shrink-0"
                style={{ borderColor: topicColor ? topicColor + "50" : "hsl(var(--border))" }}
              >
                {topicIcon || "📰"}
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
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
                title="Follow this call"
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
          <div className="flex items-center gap-2 -mt-1">
            {creatorUsername && (
              <span className="text-[11px] text-muted-foreground">
                by <span className="text-gold font-semibold">@{creatorUsername}</span>
              </span>
            )}
            {createdAt && (
              <span className="text-[11px] text-muted-foreground">· {timeAgo(createdAt)}</span>
            )}
          </div>

          {/* Options with probability bars */}
          {options && options.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {(showMore ? options : options.slice(0, 2)).map((opt, i) => {
                const c = OPTION_COLORS[i % OPTION_COLORS.length];
                const isSelected = selectedOption === opt.label;
                return (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setSelectedOption(opt.label); openStake(e, "yes", opt.label); }}
                    className={`w-full rounded-xl border-2 overflow-hidden transition-all duration-150 ${isSelected ? `${c.bg} ${c.border} shadow-lg` : `border-border/40 bg-secondary/40 ${c.hoverBorder} ${c.hoverBg} ${c.glow}`
                      }`}
                  >
                    {/* Probability bar background */}
                    <div className="relative px-3 py-2.5">
                      {/* Bar fill */}
                      <div
                        className={`absolute inset-0 opacity-20 rounded-xl transition-all duration-500`}
                        style={{ width: `${opt.percent}%`, background: c.hex }}
                      />
                      {/* Label + percent */}
                      <div className="relative flex items-center justify-between">
                        <span className={`text-sm font-bold ${isSelected ? c.text : "text-foreground"}`}>
                          {opt.label}
                        </span>
                        <span className="text-sm font-bold" style={{ color: c.hex }}>
                          {opt.percent}%
                        </span>
                      </div>
                      {/* Progress bar at bottom */}
                      <div className="relative mt-1.5 h-1 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${opt.percent}%`, background: c.hex }}
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
            /* Standard Yes / No with bars */
            <div className="flex flex-col gap-1.5">
              <button
                onClick={(e) => openStake(e, "yes")}
                className="w-full rounded-xl border-2 border-border/40 bg-secondary/40 hover:border-[#00C278] hover:bg-[#00C278]/15 hover:shadow-[0_0_18px_rgba(0,194,120,0.4)] transition-all duration-150 overflow-hidden"
              >
                <div className="relative px-3 py-2.5">
                  <div className="absolute inset-0 opacity-20 rounded-xl" style={{ width: `${yesPercent}%`, background: "#00C278" }} />
                  <div className="relative flex items-center justify-between">
                    <span className="text-sm font-bold text-[#00C278]">Agree</span>
                    <span className="text-sm font-bold text-[#00C278]">{yesPercent}%</span>
                  </div>
                  <div className="relative mt-1.5 h-1 rounded-full bg-border overflow-hidden">
                    <div className="h-full rounded-full bg-[#00C278] transition-all duration-500" style={{ width: `${yesPercent}%` }} />
                  </div>
                </div>
              </button>
              <button
                onClick={(e) => openStake(e, "no")}
                className="w-full rounded-xl border-2 border-border/40 bg-secondary/40 hover:border-[#EF4444] hover:bg-[#EF4444]/15 hover:shadow-[0_0_18px_rgba(239,68,68,0.4)] transition-all duration-150 overflow-hidden"
              >
                <div className="relative px-3 py-2.5">
                  <div className="absolute inset-0 opacity-20 rounded-xl" style={{ width: `${noPercent}%`, background: "#EF4444" }} />
                  <div className="relative flex items-center justify-between">
                    <span className="text-sm font-bold text-[#EF4444]">Disagree</span>
                    <span className="text-sm font-bold text-[#EF4444]">{noPercent}%</span>
                  </div>
                  <div className="relative mt-1.5 h-1 rounded-full bg-border overflow-hidden">
                    <div className="h-full rounded-full bg-[#EF4444] transition-all duration-500" style={{ width: `${noPercent}%` }} />
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Engagement row */}
          <div className="flex items-center justify-between pt-1.5 border-t border-border/50 mt-auto">
            {/* Social proof */}
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

            {/* Time */}
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