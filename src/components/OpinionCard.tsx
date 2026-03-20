import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Bookmark, Activity, Timer, Share2, MessageCircle,
  Eye, Users, CheckCircle2, XCircle, Bell, TrendingUp, TrendingDown, Coins,
  Swords, Flame, Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { PositionModal } from "@/components/debate/PositionModal";
import MiniGraph from "@/components/MiniGraph";
import { useMarketTimeline } from "@/hooks/useMarketTimeline";

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

const OPTION_COLORS = ["hsl(var(--muted-foreground))"];

function getOptionColor(_cardIndex: number, _optionIndex: number): string {
  return OPTION_COLORS[0];
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

function getActivityTag(data: OpinionCardData): { label: string; icon: React.ReactNode; color: string } | null {
  const { isRising, commentCount = 0, timeLeft, risingScore = 0 } = data;
  const isLive = timeLeft === "Live" || timeLeft.includes("min");
  if (isLive)
    return { label: "Active", icon: <Activity className="h-2.5 w-2.5" />, color: "hsl(var(--muted-foreground))" };
  if (timeLeft.includes("h left") && parseInt(timeLeft) <= 3)
    return { label: "Breaking", icon: <Zap className="h-2.5 w-2.5" />, color: "hsl(var(--muted-foreground))" };
  if (isRising || risingScore > 15)
    return { label: "Rising", icon: <TrendingUp className="h-2.5 w-2.5" />, color: "hsl(var(--muted-foreground))" };
  if (commentCount > 20 || risingScore > 8)
    return { label: "Heated", icon: <Flame className="h-2.5 w-2.5" />, color: "hsl(var(--muted-foreground))" };
  return null;
}

function getDelta(_cardIndex: number, _optionIndex: number): number {
  // Deprecated: deltas are now computed from real market timeline.
  return 0;
}

// ── Option bar ────────────────────────────────────────────────
const OptionBar = ({
  label, percent, showPercent, delta, onClick,
}: {
  label: string;
  percent: number;
  showPercent: boolean;
  delta: number;
  onClick: (e: React.MouseEvent) => void;
}) => (
  <button
    onClick={onClick}
    className="w-full rounded-lg border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors duration-150 overflow-hidden text-left"
  >
    <div className="px-3 py-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[13px] font-medium text-foreground truncate mr-2">{label}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[13px] font-semibold tabular-nums">
            {showPercent ? `${percent}%` : "—"}
          </span>
          {showPercent && delta !== 0 && (
            <span
              className="text-[10px] font-semibold tabular-nums"
              style={{ color: delta > 0 ? "hsl(var(--yes))" : "hsl(var(--no))" }}
            >
              {delta > 0 ? `+${delta}%` : `${delta}%`}
            </span>
          )}
        </div>
      </div>
      <div className="h-[2px] rounded-full bg-border/40 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: showPercent ? `${percent}%` : "0%",
            background: "hsl(var(--foreground) / 0.25)",
          }}
        />
      </div>
    </div>
  </button>
);

// ── Main card ─────────────────────────────────────────────────
const OpinionCard = ({ data, index }: { data: OpinionCardData; index: number }) => {
  const {
    question, yesPercent, noPercent, coins, timeLeft, genre,
    topicIcon, isLiveGame, homeTeam, awayTeam, homeScore, awayScore,
    matchMinute, options, leagueName, creatorUsername, creatorReputation,
    createdAt, commentCount = 0, followerCount = 0, isRising = false,
  } = data;

  const navigate = useNavigate();
  const { isLoggedIn } = useApp();
  const [followed, setFollowed] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [positionModal, setPositionModal] = useState<"agree" | "disagree" | null>(null);

  const isLive = isLiveGame || timeLeft === "Live" || timeLeft.includes("min");
  const cleanGenre = genre.replace(/\s*[\u{1F000}-\u{1FFFF}]/u, "").trim();
  const activityTag = getActivityTag(data);

  const optionLabels = options && options.length > 0 ? options.map((o) => o.label) : ["Yes", "No"];
  const { hasActivity, optionSeries, latestProbabilities, participants, totalCoinsStaked } = useMarketTimeline({
    opinionId: data.id,
    options: optionLabels,
    maxPoints: 14,
    enabled: !!data.id && optionLabels.length > 0,
    realtime: false,
    pollIntervalMs: 20000,
  });

  const deltaByLabel = useMemo(() => {
    const out: Record<string, number> = {};
    optionSeries.forEach((s) => {
      const last = s.data[s.data.length - 1]?.probability ?? 0;
      const prev = s.data[s.data.length - 2]?.probability ?? last;
      out[s.label] = last - prev;
    });
    return out;
  }, [optionSeries]);

  const leadingLabel = useMemo(() => {
    const [a, b] = optionSeries.slice(0, 2);
    if (!a) return null;
    if (!b) return a.label;
    const av = latestProbabilities[a.label] ?? 0;
    const bv = latestProbabilities[b.label] ?? 0;
    return av >= bv ? a.label : b.label;
  }, [optionSeries, latestProbabilities]);

  const leadingDelta = leadingLabel ? deltaByLabel[leadingLabel] ?? 0 : 0;

  // System-generated per-card “momentum” signal (labeled as such).
  const prevParticipantsRef = useRef<number>(participants);
  const prevSignalAtRef = useRef<number>(Date.now());
  const [systemSignal, setSystemSignal] = useState<string>("System feed: warming up");

  useEffect(() => {
    const prevParticipants = prevParticipantsRef.current;
    const deltaParticipants = participants - prevParticipants;
    const now = Date.now();
    const msSinceSignal = now - prevSignalAtRef.current;

    if (deltaParticipants > 0) {
      const coinsDelta = deltaParticipants * 50;
      const coinsIn2Min = Math.round((coinsDelta * 120000) / Math.max(1, msSinceSignal || 120000));
      const joined = Math.max(1, deltaParticipants);
      setSystemSignal(
        joined >= 6
          ? `System feed: ${joined} users just joined`
          : `System feed: +${Math.max(50, coinsIn2Min)} coins in last 2 min`,
      );
      prevSignalAtRef.current = now;
    } else if (hasActivity && msSinceSignal > 30000) {
      const moveAbs = Math.abs(leadingDelta);
      setSystemSignal(moveAbs >= 2 ? `System feed: Debate heating up` : `System feed: Market tightening`);
      prevSignalAtRef.current = now;
    }

    prevParticipantsRef.current = participants;
  }, [participants, hasActivity, leadingDelta]);

  const miniSeries = useMemo(() => {
    return optionSeries.slice(0, 2).map((s) => ({
      label: s.label,
      history: s.data.slice(-12).map((p) => ({ probability: p.probability })),
    }));
  }, [optionSeries]);

  const goToDetail = () => navigate(`/opinion/${data.id}`);

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) { toast.error("Log in to follow!"); navigate("/auth"); return; }
    setFollowed(f => !f);
    toast.success(followed ? "Unfollowed" : "Following this call!");
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/opinion/${data.id}`);
    toast.success("Link copied!");
  };

  const handleDebateAction = (e: React.MouseEvent, action: "agree" | "disagree" | "challenge") => {
    e.stopPropagation();
    if (action === "challenge") {
      navigate(`/opinion/${data.id}#debate`);
    } else {
      if (!isLoggedIn) { toast.error("Log in first!"); navigate("/auth"); return; }
      setPositionModal(action);
    }
  };

  return (
    <>
      <motion.div
        className="bg-card border border-border rounded-xl overflow-hidden flex flex-col cursor-pointer hover:border-border/80 transition-colors duration-200"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: Math.min(index * 0.035, 0.3) }}
        onClick={goToDetail}
      >
        <div className="p-4 flex flex-col gap-3 flex-1">

          {/* ── Header row: topic + actions ── */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {topicIcon && <span className="text-sm shrink-0">{topicIcon}</span>}
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                {cleanGenre}
              </span>
              {leagueName && (
                <>
                  <span className="text-[11px] text-muted-foreground/40 shrink-0">·</span>
                  <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider truncate">
                    {leagueName}
                  </span>
                </>
              )}
              {activityTag && (
                <span
                  className="flex items-center gap-0.5 text-[10px] font-semibold shrink-0 ml-0.5"
                  style={{ color: activityTag.color }}
                >
                  {activityTag.icon} {activityTag.label}
                </span>
              )}
              {isLive && !activityTag && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-destructive shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse inline-block" />
                  LIVE
                </span>
              )}
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={handleFollow}
                className={`p-1.5 rounded transition-colors ${followed ? "text-gold" : "text-muted-foreground/40 hover:text-muted-foreground"
                  }`}
              >
                <Bell className={`h-3.5 w-3.5 ${followed ? "fill-gold" : ""}`} />
              </button>
              <button onClick={handleShare}
                className="p-1.5 rounded text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                <Share2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); toast.success("Saved!"); }}
                className="p-1.5 rounded text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                <Bookmark className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Live score block */}
          {isLiveGame && homeTeam && awayTeam && (
            <div className="bg-secondary/60 rounded-lg px-3 py-2 flex items-center justify-between border border-border/50">
              <div className="text-center min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{homeTeam}</p>
                <p className="text-[10px] text-muted-foreground">Home</p>
              </div>
              <div className="text-center px-3">
                <p className="text-base font-bold text-foreground tabular-nums">
                  {homeScore} — {awayScore}
                </p>
                {matchMinute && (
                  <span className="text-[10px] font-medium text-destructive">{matchMinute}'</span>
                )}
              </div>
              <div className="text-center min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{awayTeam}</p>
                <p className="text-[10px] text-muted-foreground">Away</p>
              </div>
            </div>
          )}

          {/* ── Question ── */}
          <h3 className="text-[16px] leading-snug font-semibold text-foreground line-clamp-2">
            {question}
          </h3>

          {/* Creator line */}
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

          {/* ── Options ── */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Coins className="h-3 w-3" />
                <span>Staked: {formatCount(totalCoinsStaked)} coins</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{hasActivity ? `${participants} participants` : "No activity yet"}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Move</div>
              <div className="flex items-center justify-end gap-1 text-sm font-bold">
                {!hasActivity ? (
                  <span className="text-muted-foreground">—</span>
                ) : leadingDelta === 0 ? (
                  <span className="text-muted-foreground">±0%</span>
                ) : (
                  <>
                    {leadingDelta > 0 ? (
                      <TrendingUp className="h-4 w-4" style={{ color: "hsl(var(--yes))" }} />
                    ) : (
                      <TrendingDown className="h-4 w-4" style={{ color: "hsl(var(--no))" }} />
                    )}
                    <span style={{ color: leadingDelta > 0 ? "hsl(var(--yes))" : "hsl(var(--no))" }}>
                      {leadingDelta > 0 ? `+${leadingDelta}%` : `${leadingDelta}%`}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="mt-2">
            <MiniGraph series={miniSeries} height={44} />
            <div className="mt-2 text-[11px] text-muted-foreground">
              {systemSignal}
            </div>
          </div>
          {options && options.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {(showMore ? options : options.slice(0, 2)).map((opt, i) => (
                <OptionBar
                  key={i}
                  label={opt.label}
                  percent={latestProbabilities[opt.label] ?? opt.percent}
                  showPercent={hasActivity}
                  delta={deltaByLabel[opt.label] ?? 0}
                  onClick={(e) => { e.stopPropagation(); goToDetail(); }}
                />
              ))}
              {options.length > 2 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMore(s => !s); }}
                  className="text-[11px] text-muted-foreground hover:text-foreground py-0.5 transition-colors text-center"
                >
                  {showMore ? "↑ show less" : `+${options.length - 2} more options`}
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <OptionBar
                label="Yes"
                percent={yesPercent}
                showPercent={hasActivity}
                delta={deltaByLabel["Yes"] ?? 0}
                onClick={(e) => { e.stopPropagation(); goToDetail(); }}
              />
              <OptionBar
                label="No"
                percent={noPercent}
                showPercent={hasActivity}
                delta={deltaByLabel["No"] ?? 0}
                onClick={(e) => { e.stopPropagation(); goToDetail(); }}
              />
            </div>
          )}

          {/* ── Footer: social proof + time ── */}
          <div className="flex items-center justify-between pt-1.5 border-t border-border/40 mt-auto">
            <div className="flex items-center gap-3">
              {commentCount > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MessageCircle className="h-3 w-3" />
                  <span className="font-medium text-foreground/70">{commentCount}</span>
                </span>
              )}
              {followerCount > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  <span className="font-medium text-foreground/70">{formatCount(followerCount)}</span>
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

          {/* ── Bottom action bar ── */}
          <div className="grid grid-cols-4 gap-0.5 -mx-1 pt-1 border-t border-border/30">
            {[
              {
                label: "Agree",
                icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                hoverColor: "hover:text-[#22C55E] hover:bg-[#22C55E]/8",
                action: () => handleDebateAction as any,
                onClick: (e: React.MouseEvent) => handleDebateAction(e, "agree"),
              },
              {
                label: "Disagree",
                icon: <XCircle className="h-3.5 w-3.5" />,
                hoverColor: "hover:text-[#EF4444] hover:bg-[#EF4444]/8",
                onClick: (e: React.MouseEvent) => handleDebateAction(e, "disagree"),
              },
              {
                label: "Challenge",
                icon: <Swords className="h-3.5 w-3.5" />,
                hoverColor: "hover:text-gold hover:bg-gold/8",
                onClick: (e: React.MouseEvent) => handleDebateAction(e, "challenge"),
              },
              {
                label: followed ? "Following" : "Follow",
                icon: <Bell className="h-3.5 w-3.5" />,
                hoverColor: "hover:text-foreground/70",
                activeColor: followed ? "text-gold" : "",
                onClick: handleFollow,
              },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={btn.onClick}
                className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors text-muted-foreground ${btn.hoverColor} ${btn.activeColor || ""}`}
              >
                {btn.icon}
                <span className="hidden sm:inline">{btn.label}</span>
              </button>
            ))}
          </div>

        </div>
      </motion.div>

      {positionModal && (
        <PositionModal
          opinionId={data.id as string}
          opinionStatement={question}
          stance={positionModal}
          onClose={() => setPositionModal(null)}
        />
      )}
    </>
  );
};

export default OpinionCard;