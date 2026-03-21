import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Bookmark, Activity, Timer, Share2,
  Bell, TrendingUp, TrendingDown, Coins, Flame, Zap,
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

// ── Types ─────────────────────────────────────────────────────
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
  followerCount?: number;
  risingScore?: number;
  isRising?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────
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

function getActivityTag(data: OpinionCardData) {
  const { isRising, timeLeft, risingScore = 0 } = data;
  const isLive = timeLeft === "Live" || timeLeft.includes("min");
  if (isLive)
    return { label: "Live", icon: <Activity className="h-2.5 w-2.5" />, color: "#22C55E" };
  if (timeLeft.includes("h") && parseInt(timeLeft) <= 3)
    return { label: "Breaking", icon: <Zap className="h-2.5 w-2.5" />, color: "#DC2626" };
  if (isRising || risingScore > 15)
    return { label: "Rising", icon: <TrendingUp className="h-2.5 w-2.5" />, color: "#F97316" };
  if (risingScore > 8)
    return { label: "Heated", icon: <Flame className="h-2.5 w-2.5" />, color: "#F5C518" };
  return null;
}

// ── Single option bar (multi-choice) ─────────────────────────
const OptionBar = ({
  label, percent, showPercent, delta, index, onClick,
}: {
  label: string; percent: number; showPercent: boolean;
  delta: number; index: number; onClick: (e: React.MouseEvent) => void;
}) => {
  const color = optColor(label, index);
  return (
    <button
      onClick={onClick}
      className="w-full shrink-0 rounded-lg border border-border/50 bg-secondary/20 hover:bg-secondary/50 active:scale-[0.98] transition-all duration-150 overflow-hidden text-left"
    >
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: color }} />
            <span className="text-[13px] font-semibold truncate" style={{ color }}>
              {label}
            </span>
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

// ── Scrollable multi-choice options ──────────────────────────
const ScrollableOptions = ({
  options, latestProbabilities, hasActivity, deltaByLabel, onOptionTap,
}: {
  options: { label: string; percent: number }[];
  latestProbabilities: Record<string, number>;
  hasActivity: boolean;
  deltaByLabel: Record<string, number>;
  onOptionTap: (e: React.MouseEvent, label: string) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const checkScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 4);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  };

  useEffect(() => {
    // Small delay to let layout settle
    const t = setTimeout(checkScroll, 100);
    return () => clearTimeout(t);
  }, [options.length]);

  const ITEM_HEIGHT = 58; // approx px per option
  const VISIBLE = 2;  // how many to show collapsed
  const maxH = ITEM_HEIGHT * VISIBLE + 12;

  return (
    <div className="relative">
      {/* Fade top — more options above */}
      {canScrollUp && (
        <div className="absolute top-0 left-0 right-0 h-6 z-10 pointer-events-none rounded-t-lg"
          style={{ background: "linear-gradient(to bottom, var(--card), transparent)" }} />
      )}

      {/* Scrollable list */}
      <div
        ref={containerRef}
        onScroll={checkScroll}
        onWheel={e => e.stopPropagation()}
        onTouchMove={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        className="flex flex-col gap-1.5 overflow-y-auto overscroll-contain"
        style={{
          maxHeight: `${maxH}px`,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {options.map((opt, i) => (
          <OptionBar
            key={opt.label}
            label={opt.label}
            percent={latestProbabilities[opt.label] ?? opt.percent}
            showPercent={hasActivity}
            delta={deltaByLabel[opt.label] ?? 0}
            index={i}
            onClick={e => onOptionTap(e, opt.label)}
          />
        ))}
      </div>

      {/* Fade bottom + scroll hint */}
      {canScrollDown && (
        <div className="absolute bottom-0 left-0 right-0 h-8 z-10 pointer-events-none flex items-end justify-center pb-0.5 rounded-b-lg"
          style={{ background: "linear-gradient(to top, var(--card) 40%, transparent)" }}>
          <span className="text-[9px] text-muted-foreground font-medium">
            ↕ scroll for more
          </span>
        </div>
      )}
    </div>
  );
};

// ── Main card ─────────────────────────────────────────────────
const OpinionCard = ({ data, index }: { data: OpinionCardData; index: number }) => {
  const {
    question, yesPercent, noPercent, coins, timeLeft, genre,
    topicIcon, isLiveGame, homeTeam, awayTeam, homeScore, awayScore,
    matchMinute, options, leagueName, creatorUsername, creatorReputation,
    createdAt, followerCount = 0,
  } = data;

  const navigate = useNavigate();
  const { isLoggedIn, user } = useApp();

  const [followed, setFollowed] = useState(false);
  const [shareSheet, setShareSheet] = useState(false);
  const [stakeSheet, setStakeSheet] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [positionModal, setPositionModal] = useState<"agree" | "disagree" | null>(null);

  const isLive = isLiveGame || timeLeft === "Live" || timeLeft.includes("min");
  const cleanGenre = genre.replace(/\s*[\u{1F000}-\u{1FFFF}]/u, "").trim();
  const isOpen = data.status === "open";
  const activityTag = getActivityTag(data);

  const allOptions: { label: string; percent: number }[] =
    options && options.length > 0
      ? options
      : [{ label: "Yes", percent: 50 }, { label: "No", percent: 50 }];

  const binary = isBinaryYesNo(allOptions);

  const optionLabels = allOptions.map(o => o.label);

  const {
    hasActivity, optionSeries, latestProbabilities,
    participants, totalCoinsStaked,
  } = useMarketTimeline({
    opinionId: data.id,
    options: optionLabels,
    maxPoints: 14,
    enabled: !!data.id,
    realtime: false,
    pollIntervalMs: 60000,
  });

  const deltaByLabel = useMemo(() => {
    const out: Record<string, number> = {};
    optionSeries.forEach(s => {
      const last = s.data[s.data.length - 1]?.probability ?? 0;
      const prev = s.data[s.data.length - 2]?.probability ?? last;
      out[s.label] = Math.round(last - prev);
    });
    return out;
  }, [optionSeries]);

  const leadingLabel = useMemo(() => {
    const [a, b] = optionSeries.slice(0, 2);
    if (!a) return null;
    if (!b) return a.label;
    return (latestProbabilities[a.label] ?? 0) >= (latestProbabilities[b.label] ?? 0)
      ? a.label : b.label;
  }, [optionSeries, latestProbabilities]);

  const leadingDelta = leadingLabel ? (deltaByLabel[leadingLabel] ?? 0) : 0;

  // System signal
  const prevPartsRef = useRef(participants);
  const prevSignalAtRef = useRef(Date.now());
  const [signal, setSignal] = useState("");

  useEffect(() => {
    const prev = prevPartsRef.current;
    const delta = participants - prev;
    const now = Date.now();
    const elapsed = now - prevSignalAtRef.current;
    if (delta > 0) {
      const c = Math.round((delta * 50 * 120000) / Math.max(1, elapsed));
      setSignal(delta >= 6 ? `${delta} users joined` : `+${Math.max(50, c)}c in 2 min`);
      prevSignalAtRef.current = now;
    } else if (hasActivity && elapsed > 30000) {
      setSignal(Math.abs(leadingDelta) >= 2 ? "Debate heating up" : "Market tightening");
      prevSignalAtRef.current = now;
    }
    prevPartsRef.current = participants;
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
    toast.success(followed ? "Unfollowed" : "Following!");
  };

  const handleOptionTap = (e: React.MouseEvent, label: string) => {
    e.stopPropagation();
    if (!isOpen) { goToDetail(); return; }
    setSelectedOpt(label);
    setStakeSheet(true);
  };

  return (
    <>
      <motion.div
        className="bg-card border border-border rounded-xl overflow-hidden flex flex-col cursor-pointer hover:border-border/60 transition-colors duration-200"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.25) }}
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
                  <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider truncate">
                    {leagueName}
                  </span>
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
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-pulse inline-block" />
                  LIVE
                </span>
              )}
            </div>

            {/* Top-right actions */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={e => { e.stopPropagation(); setShareSheet(true); }}
                className="p-1.5 rounded text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                <Share2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); toast.success("Saved!"); }}
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
                <p className="text-base font-bold text-foreground tabular-nums">
                  {homeScore} — {awayScore}
                </p>
                {matchMinute && (
                  <span className="text-[10px] font-medium text-[#DC2626]">{matchMinute}'</span>
                )}
              </div>
              <div className="text-center min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{awayTeam}</p>
                <p className="text-[10px] text-muted-foreground">Away</p>
              </div>
            </div>
          )}

          {/* Question */}
          <h3 className="text-[15px] leading-snug font-semibold text-foreground line-clamp-2">
            {question}
          </h3>

          {/* Creator */}
          {creatorUsername && (
            <div className="flex items-center gap-2 -mt-1 flex-wrap">
              <span className="text-[11px] text-muted-foreground">
                by{" "}
                <span className="font-medium text-foreground/70">@{creatorUsername}</span>
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

          {/* Mini graph */}
          <div>
            <MiniGraph series={miniSeries} height={40} />
            {signal && hasActivity && (
              <p className="mt-1 text-[10px] text-muted-foreground">{signal}</p>
            )}
          </div>

          {/* ── Options ── */}
          {binary ? (
            /* Yes/No — HORIZONTAL, tappable */
            <div className="grid grid-cols-2 gap-2" onClick={e => e.stopPropagation()}>
              {allOptions.map((opt, i) => {
                const color = optColor(opt.label, i);
                const pct = hasActivity
                  ? (latestProbabilities[opt.label] ?? opt.percent)
                  : null;
                return (
                  <button key={opt.label}
                    onClick={e => handleOptionTap(e, opt.label)}
                    className="flex flex-col items-center justify-center py-3 rounded-xl border border-border/60 bg-secondary/20 hover:bg-secondary/50 active:scale-[0.97] transition-all">
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
            /* Multi-choice — SCROLLABLE vertical */
            <ScrollableOptions
              options={allOptions}
              latestProbabilities={latestProbabilities}
              hasActivity={hasActivity}
              deltaByLabel={deltaByLabel}
              onOptionTap={handleOptionTap}
            />
          )}

          {/* ── Footer: coins staked + market move + follow ── */}
          <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-auto">
            <div className="flex items-center gap-2 min-w-0">
              {hasActivity ? (
                <span className="flex items-center gap-1 text-[11px] text-gold font-semibold">
                  <Coins className="h-3 w-3" />
                  {formatCount(totalCoinsStaked)}c staked
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Coins className="h-3 w-3" /> No activity yet
                </span>
              )}

              {hasActivity && leadingDelta !== 0 && (
                <>
                  <span className="text-muted-foreground/40 text-[11px]">·</span>
                  <span className="flex items-center gap-0.5 text-[11px] font-semibold"
                    style={{ color: leadingDelta > 0 ? "#22C55E" : "#DC2626" }}>
                    {leadingDelta > 0
                      ? <TrendingUp className="h-3 w-3" />
                      : <TrendingDown className="h-3 w-3" />}
                    {leadingDelta > 0 ? `+${leadingDelta}%` : `${leadingDelta}%`}
                  </span>
                </>
              )}

              {!hasActivity && (
                <>
                  <span className="text-muted-foreground/40 text-[11px]">·</span>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Timer className="h-3 w-3" /> {timeLeft}
                  </span>
                </>
              )}

              {hasActivity && isLive && (
                <>
                  <span className="text-muted-foreground/40 text-[11px]">·</span>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-[#22C55E]">
                    <Activity className="h-3 w-3" /> Live
                  </span>
                </>
              )}
            </div>

            <button
              onClick={handleFollow}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors border shrink-0 ${followed
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
          opinion={{
            id: String(data.id),
            statement: question,
            topics: { name: genre, icon: topicIcon || "" },
          }}
          onClose={() => setShareSheet(false)}
        />
      )}

      {/* Mobile stake sheet */}
      {stakeSheet && (
        <MobileStakeSheet
          opinion={{
            id: String(data.id),
            statement: question,
            call_count: coins,
            follower_count: followerCount,
            end_time: "",
            source_name: null,
            source_url: null,
          }}
          options={optionLabels}
          userCall={null}
          isOpen={isOpen}
          hasActivity={hasActivity}
          latestProbabilities={latestProbabilities}
          countdown={timeLeft}
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