// src/components/OpinionCard.tsx  ── UPGRADED
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Bookmark, Activity, Timer, Share2,
  Bell, TrendingUp, TrendingDown, Coins, Flame, Zap, Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { PositionModal } from "@/components/debate/PositionModal";
import { MarketGraph } from "@/components/MarketGraph";
import { useMarketTimeline } from "@/hooks/useMarketTimeline";
import { ShareSheet } from "@/components/ShareSheet";
import { MobileStakeSheet } from "@/components/MobileStakeSheet";

// ── Colour system ─────────────────────────────────────────────
const optColor = (label: string, i: number): string => {
  const l = label.toLowerCase().trim();
  if (l === "yes" || l === "agree") return "#2563EB";
  if (l === "no" || l === "disagree") return "#DC2626";
  const multi = ["#7C3AED", "#0891B2", "#059669", "#EA580C", "#2563EB", "#DC2626"];
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

const isTwoAnswer = (opts: { label: string }[]): boolean => opts.length === 2;

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
  topicSlug?: string | null;
  iconUrl?: string | null;
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

// ── UPGRADED: Binary option button — matches Polymarket side-by-side style
const BinaryOptionCard = ({
  label, percent, showPercent, delta, index, withColorFade, onClick,
}: {
  label: string; percent: number; showPercent: boolean;
  delta: number; index: number; withColorFade: boolean;
  onClick: (e: React.MouseEvent) => void;
}) => {
  const color = optColor(label, index);
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-between px-3.5 py-3 rounded-xl border transition-all duration-200 relative overflow-hidden group"
      style={{
        borderColor: withColorFade ? color + "50" : "var(--border)",
        background: withColorFade ? color + "0D" : "var(--secondary)",
      }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        style={{
          background: withColorFade
            ? `linear-gradient(135deg, ${color}22 0%, ${color}08 100%)`
            : "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        }}
      />
      {/* Dot + label */}
      <div className="flex items-center gap-2 relative z-10">
        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-sm font-bold" style={{ color: withColorFade ? color : "var(--foreground)" }}>
          {label}
        </span>
      </div>
      {/* Percent + delta */}
      <div className="flex flex-col items-end relative z-10">
        {showPercent ? (
          <>
            <span className="text-sm font-bold tabular-nums" style={{ color: withColorFade ? color : "var(--foreground)" }}>
              {percent}%
            </span>
            {delta !== 0 && (
              <span className="text-[10px] font-semibold tabular-nums leading-none mt-0.5"
                style={{ color: delta > 0 ? "#22C55E" : "#DC2626" }}>
                {delta > 0 ? `+${delta}%` : `${delta}%`}
              </span>
            )}
          </>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>
    </button>
  );
};

// ── Multi-choice option bar ───────────────────────────────────
const OptionBar = ({
  label, percent, showPercent, delta, index, onClick,
}: {
  label: string; percent: number; showPercent: boolean;
  delta: number; index: number; onClick: (e: React.MouseEvent) => void;
}) => {
  const color = optColor(label, index);
  return (
    <button onClick={onClick}
      className="w-full shrink-0 rounded-lg border border-border/40 bg-secondary/15 hover:bg-secondary/35 transition-colors duration-150 overflow-hidden text-left">
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: color }} />
            <span className="text-[13px] font-semibold truncate text-foreground">{label}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[13px] font-bold tabular-nums text-muted-foreground">
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
        <div className="h-[2px] rounded-full bg-border/30 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: showPercent ? `${percent}%` : "0%", background: color + "60" }} />
        </div>
      </div>
    </button>
  );
};

// Scrollable multi options
const ScrollableOptions = ({ options, latestProbabilities, hasActivity, deltaByLabel, onOptionTap }: any) => (
  <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-0.5" style={{ scrollbarWidth: "none" }}>
    {options.map((opt: any, i: number) => (
      <OptionBar
        key={opt.label}
        label={opt.label}
        percent={latestProbabilities[opt.label] ?? opt.percent}
        showPercent={hasActivity}
        delta={deltaByLabel[opt.label] ?? 0}
        index={i}
        onClick={onOptionTap}
      />
    ))}
  </div>
);

// ── UPGRADED: Compact stats bar — volume prominent like Kalshi/Polymarket
const StatsBar = ({
  hasActivity, totalCoinsStaked, participants, timeLeft,
  leadingDelta, isLive, followed, onFollow,
}: any) => (
  <div className="flex items-center justify-between pt-2.5 border-t border-border/30 mt-auto">
    <div className="flex items-center gap-3 min-w-0 flex-1">
      {/* Volume — most prominent */}
      {hasActivity ? (
        <span className="flex items-center gap-1 text-[11px] font-bold text-[#22C55E]">
          <Coins className="h-3 w-3" />
          {formatCount(totalCoinsStaked)}c
        </span>
      ) : (
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Coins className="h-3 w-3" /> No stakes yet
        </span>
      )}

      {/* Participants */}
      {hasActivity && participants > 0 && (
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Users className="h-3 w-3" />
          {participants}
        </span>
      )}

      {/* Movement */}
      {hasActivity && leadingDelta !== 0 && (
        <span className="flex items-center gap-0.5 text-[11px] font-semibold"
          style={{ color: leadingDelta > 0 ? "#22C55E" : "#DC2626" }}>
          {leadingDelta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {leadingDelta > 0 ? `+${leadingDelta}%` : `${leadingDelta}%`}
        </span>
      )}

      {/* Time */}
      {!isLive && (
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Timer className="h-3 w-3" /> {timeLeft}
        </span>
      )}
      {isLive && (
        <span className="flex items-center gap-1 text-[11px] font-bold text-[#DC2626]">
          <Activity className="h-3 w-3" /> Live
        </span>
      )}
    </div>

    <button onClick={onFollow}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border shrink-0 ${followed
        ? "text-[#22C55E] border-[#22C55E]/50 bg-[#22C55E]/8"
        : "text-muted-foreground border-border/50 hover:brightness-110"
        }`}>
      <Bell className={`h-3 w-3 ${followed ? "fill-[#22C55E]" : ""}`} />
      {followed ? "Following" : "Follow"}
    </button>
  </div>
);

// ── Main card ─────────────────────────────────────────────────
const OpinionCard = ({
  data,
  index = 0,
}: {
  data: OpinionCardData;
  index?: number;
}) => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useApp();
  const {
    question, genre, topicIcon, timeLeft, leagueName,
    creatorUsername, creatorReputation, createdAt,
    followerCount, isLiveGame,
    homeTeam, awayTeam, homeScore, awayScore, matchMinute,
    options,
  } = data;

  const [followed, setFollowed] = useState(false);
  const [shareSheet, setShareSheet] = useState(false);
  const [stakeSheet, setStakeSheet] = useState(false);
  const [positionModal, setPositionModal] = useState<"agree" | "disagree" | null>(null);

  const isLive = isLiveGame || timeLeft === "Live" || timeLeft.includes("min");
  const cleanGenre = genre.replace(/\s*[\u{1F000}-\u{1FFFF}]/u, "").trim();
  const isOpen = data.status === "open";
  const activityTag = getActivityTag(data);

  const allOptions: { label: string; percent: number }[] =
    options && options.length > 0
      ? options
      : [{ label: "Yes", percent: 50 }, { label: "No", percent: 50 }];

  const isYesNo = isBinaryYesNo(allOptions);
  const isTwoOpt = isTwoAnswer(allOptions);
  const optionLabels = allOptions.map(o => o.label);

  const { hasActivity, optionSeries, latestProbabilities, participants, totalCoinsStaked } = useMarketTimeline({
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
    return (latestProbabilities[a.label] ?? 0) >= (latestProbabilities[b.label] ?? 0) ? a.label : b.label;
  }, [optionSeries, latestProbabilities]);

  const leadingDelta = leadingLabel ? (deltaByLabel[leadingLabel] ?? 0) : 0;

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
      setSignal(delta >= 6 ? `${delta} users just joined` : `+${Math.max(50, c)}c in 2 min`);
      prevSignalAtRef.current = now;
    } else if (hasActivity && elapsed > 30000) {
      setSignal(Math.abs(leadingDelta) >= 2 ? "Debate heating up" : "Market tightening");
      prevSignalAtRef.current = now;
    }
    prevPartsRef.current = participants;
  }, [participants, hasActivity, leadingDelta]);

  const graphSeries = useMemo(() =>
    optionSeries.slice(0, 3).map(s => ({
      label: s.label,
      data: s.data.map(p => ({ time: p.time, probability: p.probability })),
    })), [optionSeries]);

  const goToDetail = () => navigate(`/opinion/${data.id}`);

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) { toast.error("Log in to follow!"); navigate("/auth"); return; }
    setFollowed(f => !f);
    toast.success(followed ? "Unfollowed" : "Following!");
  };

  const handleOptionTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) { goToDetail(); return; }
    setStakeSheet(true);
  };

  return (
    <>
      <motion.div
        className="bg-card border border-border rounded-xl overflow-hidden flex flex-col cursor-pointer hover:brightness-[1.04] transition-all duration-200"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.25) }}
        onClick={goToDetail}
      >
        <div className="p-4 flex flex-col gap-2.5 flex-1">

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
                <span className="flex items-center gap-0.5 text-[10px] font-bold shrink-0 ml-0.5"
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

          {/* ── Live scoreboard ── */}
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

          {/* ── Question ── */}
          <h3 className="text-[15px] leading-snug font-semibold text-foreground line-clamp-2">{question}</h3>

          {/* ── Creator + accuracy badge ── */}
          {creatorUsername && (
            <div className="flex items-center gap-2 -mt-0.5 flex-wrap">
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

          {/* ── UPGRADED Graph: always shows, dashed placeholder when no data ── */}
          <div className="-mx-0">
            <MarketGraph series={graphSeries} height={56} compact={true} showTooltip={hasActivity} />
            {signal && hasActivity && (
              <div className="flex items-center gap-1.5 mt-1">
                <div className="h-1 w-1 rounded-full bg-[#22C55E] animate-pulse" />
                <p className="text-[10px] text-muted-foreground">{signal}</p>
              </div>
            )}
          </div>

          {/* ── UPGRADED Options ── */}
          {isTwoOpt ? (
            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
              {allOptions.map((opt, i) => (
                <BinaryOptionCard
                  key={opt.label}
                  label={opt.label}
                  percent={latestProbabilities[opt.label] ?? opt.percent}
                  showPercent={hasActivity}
                  delta={deltaByLabel[opt.label] ?? 0}
                  index={i}
                  withColorFade={isYesNo}
                  onClick={handleOptionTap}
                />
              ))}
            </div>
          ) : (
            <ScrollableOptions
              options={allOptions}
              latestProbabilities={latestProbabilities}
              hasActivity={hasActivity}
              deltaByLabel={deltaByLabel}
              onOptionTap={handleOptionTap}
            />
          )}

          {/* ── UPGRADED Footer with volume + participants prominent ── */}
          <StatsBar
            hasActivity={hasActivity}
            totalCoinsStaked={totalCoinsStaked}
            participants={participants}
            timeLeft={timeLeft}
            leadingDelta={leadingDelta}
            isLive={isLive}
            followed={followed}
            onFollow={handleFollow}
          />

        </div>
      </motion.div>

      {shareSheet && (
        <ShareSheet
          opinion={{ id: String(data.id), statement: question, topics: { name: genre, icon: topicIcon || "" } }}
          onClose={() => setShareSheet(false)}
        />
      )}

      {stakeSheet && (
        <MobileStakeSheet
          opinion={{ id: String(data.id), statement: question, call_count: data.coins, follower_count: followerCount, end_time: "", source_name: null, source_url: null }}
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
