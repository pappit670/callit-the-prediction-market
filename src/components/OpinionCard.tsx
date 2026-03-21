import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark, Activity, Timer, Share2, MessageCircle,
  Eye, Bell, TrendingUp, TrendingDown, Coins, Flame, Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { PositionModal } from "@/components/debate/PositionModal";
import MiniGraph from "@/components/MiniGraph";
import { useMarketTimeline } from "@/hooks/useMarketTimeline";
import { ShareSheet } from "@/components/ShareSheet";
import { MobileStakeSheet } from "@/components/MobileStakeSheet";

// ── Color system ──────────────────────────────────────────────
const optColor = (label: string, i: number): string => {
  const l = label.toLowerCase().trim();
  if (l === "yes" || l === "agree") return "#2563EB";
  if (l === "no" || l === "disagree") return "#DC2626";
  const multi = ["#F5C518", "#2563EB", "#DC2626", "#7C3AED", "#0891B2", "#059669"];
  return multi[i % multi.length];
};

const isBinaryYesNo = (opts: { label: string }[]): boolean => {
  if (opts.length !== 2) return false;
  const labels = opts.map(o => o.label.toLowerCase().trim());
  return (
    (labels.includes("yes") || labels.includes("agree")) &&
    (labels.includes("no") || labels.includes("disagree"))
  );
};

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
    return { label: "Active", icon: <Activity className="h-2.5 w-2.5" />, color: "#22C55E" };
  if (timeLeft.includes("h left") && parseInt(timeLeft) <= 3)
    return { label: "Breaking", icon: <Zap className="h-2.5 w-2.5" />, color: "#DC2626" };
  if (isRising || risingScore > 15)
    return { label: "Rising", icon: <TrendingUp className="h-2.5 w-2.5" />, color: "#F97316" };
  if (commentCount > 20 || risingScore > 8)
    return { label: "Heated", icon: <Flame className="h-2.5 w-2.5" />, color: "#F5C518" };
  return null;
}

// ── Option bar (vertical, multi-choice) ──────────────────────
const OptionBar = ({
  label, percent, showPercent, delta, onClick, index = 0,
}: {
  label: string; percent: number; showPercent: boolean;
  delta: number; onClick: (e: React.MouseEvent) => void; index?: number;
}) => {
  const color = optColor(label, index);
  return (
    <button onClick={onClick}
      className="w-full rounded-lg border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors duration-150 overflow-hidden text-left">
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: color }} />
            <span className="text-[13px] font-semibold truncate" style={{ color }}>{label}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[13px] font-bold tabular-nums"
              style={{ color: showPercent ? color : undefined }}>
              {showPercent ? `${percent}%` : "—"}
            </span>
            {showPercent && delta !== 0 && (
              <span className="text-[10px] font-semibold tabular-nums"
                style={{ color: delta > 0 ? "#22C55E" : "#DC2626" }}>
                {delta > 0 ? `+${delta}%` : `${delta}%`}
              </span>
            )}
          </div>
        </div>
        <div className="h-[2px] rounded-full bg-border/40 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: showPercent ? `${percent}%` : "0%", background: color + "80" }} />
        </div>
      </div>
    </button>
  );
};

// ── Main card ─────────────────────────────────────────────────
const OpinionCard = ({ data, index }: { data: OpinionCardData; index: number }) => {
  const {
    question, yesPercent, noPercent, coins, timeLeft, genre,
    topicIcon, isLiveGame, homeTeam, awayTeam, homeScore, awayScore,
    matchMinute, options, leagueName, creatorUsername, creatorReputation,
    createdAt, commentCount = 0, followerCount = 0,
  } = data;

  const navigate = useNavigate();
  const { isLoggedIn, user } = useApp();
  const [followed, setFollowed] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [shareSheet, setShareSheet] = useState(false);
  const [stakeSheet, setStakeSheet] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [positionModal, setPositionModal] = useState<"agree" | "disagree" | null>(null);

  const isLive = isLiveGame || timeLeft === "Live" || timeLeft.includes("min");
  const cleanGenre = genre.replace(/\s*[\u{1F000}-\u{1FFFF}]/u, "").trim();
  const activityTag = getActivityTag(data);
  const isOpen = data.status === "open";

  const optionLabels = options && options.length > 0 ? options.map(o => o.label) : ["Yes", "No"];
  const binaryYesNo = isBinaryYesNo(options && options.length > 0 ? options : [{ label: "Yes", percent: 50 }, { label: "No", percent: 50 }]);

  const { hasActivity, optionSeries, latestProbabilities, participants, totalCoinsStaked } = useMarketTimeline({
    opinionId: data.id,
    options: optionLabels,
    maxPoints: 14,
    enabled: !!data.id && optionLabels.length > 0,
    realtime: false,
    pollIntervalMs: 60000,
  });

  const deltaByLabel = useMemo(() => {
    const out: Record<string, number> = {};
    optionSeries.forEach(s => {
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
    return (latestProbabilities[a.label] ?? 0) >= (latestProbabilities[b.label] ?? 0) ? a.label : b.label;
  }, [optionSeries, latestProbabilities]);

  const leadingDelta = leadingLabel ? deltaByLabel[leadingLabel] ?? 0 : 0;

  const prevParticipantsRef = useRef<number>(participants);
  const prevSignalAtRef = useRef<number>(Date.now());
  const [systemSignal, setSystemSignal] = useState<string>("");

  useEffect(() => {
    const prev = prevParticipantsRef.current;
    const delta = participants - prev;
    const now = Date.now();
    const elapsed = now - prevSignalAtRef.current;
    if (delta > 0) {
      const coinsIn2Min = Math.round((delta * 50 * 120000) / Math.max(1, elapsed));
      setSystemSignal(delta >= 6
        ? `${delta} users just joined`
        : `+${Math.max(50, coinsIn2Min)} coins in last 2 min`);
      prevSignalAtRef.current = now;
    } else if (hasActivity && elapsed > 30000) {
      setSystemSignal(Math.abs(leadingDelta) >= 2 ? "Debate heating up" : "Market tightening");
      prevSignalAtRef.current = now;
    }
    prevParticipantsRef.current = participants;
  }, [participants, hasActivity, leadingDelta]);

  const miniSeries = useMemo(() =>
    optionSeries.slice(0, 2).map(s => ({
      label: s.label,
      history: s.data.slice(-12).map(p => ({ probability: p.probability })),
    })), [optionSeries]);

  const goToDetail = () => navigate(`/opinion/${data.id}`);

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) { toast.error("Log in to follow!"); navigate("/auth"); return; }
    setFollowed(f => !f);
    toast.success(followed ? "Unfollowed" : "Following this call!");
  };

  const handleOptionTap = (e: React.MouseEvent, optLabel: string) => {
    e.stopPropagation();
    if (!isOpen) { goToDetail(); return; }
    setSelectedOpt(optLabel);
    setStakeSheet(true);
  };

  const allOptions = options && options.length > 0
    ? options
    : [{ label: "Yes", percent: 50 }, { label: "No", percent: 50 }];

  return (
    <>
      <motion.div
        className="bg-card border border-border rounded-xl overflow-hidden flex flex-col cursor-pointer hover:border-border/80 transition-colors duration-200"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: Math.min(index * 0.035, 0.3) }}
        onClick={goToDetail}
      >
        <div className="p-4 flex flex-col gap-3 flex-1">

          {/* ── Header ── */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {topicIcon && <span className="text-sm shrink-0">{topicIcon}</span>}
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                {cleanGenre}
              </span>
              {leagueName && (
                <>
                  <span className="text-[11px] text-muted-foreground/40 shrink-0">·</span>
                  <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider truncate">{leagueName}</span>
                </>
              )}
              {activityTag && (
                <span className="flex items-center gap-0.5 text-[10px] font-semibold shrink-0 ml-0.5"
                  style={{ color: activityTag.color }}>
                  {activityTag.icon} {activityTag.label}
                </span>
              )}
              {isLive && !activityTag && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#DC2626] shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-pulse inline-block" /> LIVE
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button onClick={e => { e.stopPropagation(); setShareSheet(true); }}
                className="p-1.5 rounded text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                <Share2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={e => { e.stopPropagation(); toast.success("Saved!"); }}
                className="p-1.5 rounded text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                <Bookmark className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Live score */}
          {isLiveGame && homeTeam && awayTeam && (
            <div className="bg-secondary/60 rounded-lg px-3 py-2 flex items-center justify-between border border-border/50">
              <div className="text-center min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{homeTeam}</p>
                <p className="text-[10px] text-muted-foreground">Home</p>
              </div>
              <div className="text-center px-3">
                <p className="text-base font-bold text-foreground tabular-nums">{homeScore} — {awayScore}</p>
                {matchMinute && <span className="text-[10px] font-medium text-[#DC2626]">{matchMinute}'</span>}
              </div>
              <div className="text-center min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{awayTeam}</p>
                <p className="text-[10px] text-muted-foreground">Away</p>
              </div>
            </div>
          )}

          {/* Question */}
          <h3 className="text-[15px] leading-snug font-semibold text-foreground line-clamp-2">{question}</h3>

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
              {createdAt && <span className="text-[11px] text-muted-foreground">· {timeAgo(createdAt)}</span>}
            </div>
          )}

          {/* Mini graph */}
          <div>
            <MiniGraph series={miniSeries} height={40} />
            {systemSignal && hasActivity && (
              <p className="mt-1 text-[10px] text-muted-foreground">{systemSignal}</p>
            )}
          </div>

          {/* ── Options ── */}
          {binaryYesNo ? (
            /* Binary Yes/No — HORIZONTAL */
            <div className="grid grid-cols-2 gap-2">
              {allOptions.map((opt, i) => {
                const color = optColor(opt.label, i);
                const pct = hasActivity ? (latestProbabilities[opt.label] ?? opt.percent) : null;
                return (
                  <button key={i}
                    onClick={e => handleOptionTap(e, opt.label)}
                    className="flex flex-col items-center justify-center py-2.5 rounded-xl border border-border/60 bg-secondary/20 hover:bg-secondary/40 active:scale-95 transition-all">
                    <span className="text-sm font-bold" style={{ color }}>{opt.label}</span>
                    <span className="text-xs font-semibold tabular-nums mt-0.5"
                      style={{ color: pct !== null ? color : undefined }}>
                      {pct !== null ? `${pct}%` : "—"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Multi-choice — VERTICAL with scroll reveal */
            <div className="flex flex-col gap-1.5">
              <AnimatePresence>
                {(showMore ? allOptions : allOptions.slice(0, 2)).map((opt, i) => (
                  <motion.div key={opt.label}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}>
                    <OptionBar
                      label={opt.label}
                      percent={latestProbabilities[opt.label] ?? opt.percent}
                      showPercent={hasActivity}
                      delta={deltaByLabel[opt.label] ?? 0}
                      index={i}
                      onClick={e => handleOptionTap(e, opt.label)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              {allOptions.length > 2 && (
                <button
                  onClick={e => { e.stopPropagation(); setShowMore(s => !s); }}
                  className="text-[11px] text-muted-foreground hover:text-gold py-1 transition-colors text-center border border-border/40 rounded-lg">
                  {showMore ? "↑ show less" : `↓ ${allOptions.length - 2} more options`}
                </button>
              )}
            </div>
          )}

          {/* ── Footer: coins staked + follow ── */}
          <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-auto">
            <div className="flex items-center gap-1.5 text-[11px]">
              {hasActivity ? (
                <span className="flex items-center gap-1 text-gold font-semibold">
                  <Coins className="h-3 w-3" />
                  {formatCount(totalCoinsStaked)} staked
                </span>
              ) : (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Coins className="h-3 w-3" /> No activity yet
                </span>
              )}
              {hasActivity && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  {leadingDelta !== 0 && (
                    <span className="flex items-center gap-0.5 font-semibold"
                      style={{ color: leadingDelta > 0 ? "#22C55E" : "#DC2626" }}>
                      {leadingDelta > 0
                        ? <TrendingUp className="h-3 w-3" />
                        : <TrendingDown className="h-3 w-3" />}
                      {leadingDelta > 0 ? `+${leadingDelta}%` : `${leadingDelta}%`}
                    </span>
                  )}
                </>
              )}
            </div>
            <button
              onClick={handleFollow}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors border ${followed
                  ? "text-gold border-gold bg-gold/8"
                  : "text-muted-foreground border-border hover:text-gold hover:border-gold"
                }`}
            >
              <Bell className={`h-3 w-3 ${followed ? "fill-gold" : ""}`} />
              {followed ? "Following" : "Follow"}
            </button>
          </div>

        </div>
      </motion.div>

      {/* Share sheet */}
      {shareSheet && (
        <ShareSheet
          opinion={{ id: String(data.id), statement: question, topics: { name: genre, icon: topicIcon || "" } }}
          onClose={() => setShareSheet(false)}
        />
      )}

      {/* Mobile stake sheet — opens when option tapped */}
      {stakeSheet && (
        <MobileStakeSheet
          opinion={{ id: String(data.id), statement: question, call_count: coins, follower_count: followerCount || 0, end_time: "", source_name: null, source_url: null }}
          options={optionLabels}
          userCall={null}
          isOpen={isOpen}
          hasActivity={hasActivity}
          latestProbabilities={latestProbabilities}
          countdown=""
          onCall={async (opt, amount) => {
            if (!isLoggedIn) { toast.error("Log in first!"); navigate("/auth"); return; }
            toast.success(`Called: ${opt} · ${amount} coins`);
            navigate(`/opinion/${data.id}`);
          }}
          submitting={false}
          user={user}
          isLoggedIn={isLoggedIn}
          onClose={() => setStakeSheet(false)}
        />
      )}

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