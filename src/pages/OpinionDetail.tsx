import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Share2, Send, ThumbsUp, MessageCircle, Coins, Info, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { sampleCards } from "@/data/sampleCards";
import { systemGeneratedCards } from "@/data/systemGeneratedCards";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import ResolutionScreen from "@/components/ResolutionScreen";
import { getCrowdContext, calculateNetWin, getMaxCall } from "@/lib/callit";
import type { SuggestedAnswer } from "@/components/AnswerOptions";

// --- Data ---
const activityFeed = [
  { user: "cryptobro", side: "yes" as const, amount: 120, time: "2 min ago" },
  { user: "vibecheck", side: "no" as const, amount: 85, time: "5 min ago" },
  { user: "goatdebater", side: "yes" as const, amount: 300, time: "12 min ago" },
  { user: "nairobiguide", side: "yes" as const, amount: 50, time: "28 min ago" },
  { user: "worklife", side: "no" as const, amount: 200, time: "1 hr ago" },
];

const initialComments = [
  { user: "hiphophead", text: "This is a no-brainer. The evidence speaks for itself.", time: "3 hrs ago", coins: 200, side: "yes" as const },
  { user: "cryptobro", text: "I'm not so sure honestly. Could go either way.", time: "5 hrs ago", coins: 85, side: "no" as const },
  { user: "vibecheck", text: "Called big on Yes. Let's see how this plays out 🔥", time: "8 hrs ago", coins: 500, side: "yes" as const },
];

const OPTION_COLORS = ["hsl(var(--gold))", "hsl(var(--yes))", "hsl(var(--no))", "hsl(270, 60%, 60%)", "hsl(280, 50%, 55%)"];
const OPTION_HEX = ["#F5C518", "#22C55E", "#EF4444", "#A855F7", "#8B5CF6"];

const TIME_FILTERS = ["1H", "6H", "1D", "1W", "1M", "ALL"] as const;
const COMMENT_TABS = ["Comments", "Top Callers", "Positions", "Activity"] as const;
const CHART_W = 800;
const CHART_H = 220;
const CHART_PAD = 32;

// --- Helpers ---
function parseTimeLeft(timeLeft: string): number {
  const match = timeLeft.match(/(\d+)\s*(day|hour|hr|min)/i);
  if (!match) return 0;
  const val = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  if (unit.startsWith("day")) return val * 86400;
  if (unit.startsWith("hour") || unit === "hr") return val * 3600;
  if (unit.startsWith("min")) return val * 60;
  return 0;
}

function formatCountdown(s: number) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${d}d ${h}h ${m}m ${sec}s`;
}

function getEarlyEntryMultiplier(postedDaysAgo: number, timeLeft: string): { multiplier: number; label: string } | null {
  const totalSeconds = parseTimeLeft(timeLeft) + postedDaysAgo * 86400;
  const elapsed = postedDaysAgo * 86400;
  const pct = totalSeconds > 0 ? elapsed / totalSeconds : 0;
  if (pct <= 0.1) return { multiplier: 1.5, label: "1.5x" };
  if (pct <= 0.4) return { multiplier: 1.25, label: "1.25x" };
  if (pct <= 0.8) return null;
  return { multiplier: 0.85, label: "0.85x late penalty" };
}

const resolutionDescriptions: Record<string, string> = {
  crowd: "The side with the most called coins when the timer ends wins.",
  event: "Based on whether the real-world event occurs by the deadline.",
  metric: "Based on predefined measurable metrics.",
};

const statusConfig: Record<string, { label: string; classes: string }> = {
  open: { label: "Open", classes: "bg-yes/15 text-yes" },
  locked: { label: "Closing", classes: "bg-gold/15 text-gold" },
  resolved: { label: "Resolved", classes: "bg-muted text-muted-foreground" },
  draw: { label: "Draw — Refunded", classes: "bg-no/15 text-no" },
};

const resolutionTypeLabels: Record<string, string> = {
  crowd: "Crowd Based",
  event: "Event Based",
  metric: "Metric Based",
};

function generateChartData(currentPercent: number, seed: number, points: number = 30) {
  const data: { x: number; y: number }[] = [];
  let val = 40 + (seed % 20);
  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    const target = currentPercent;
    const noise = (Math.sin(seed * 13.37 + i * 2.1) * 8) + (Math.cos(seed * 7.53 + i * 3.7) * 5);
    val = val + (target - val) * 0.15 + noise * (1 - progress * 0.7);
    val = Math.max(2, Math.min(98, val));
    if (i === points - 1) val = currentPercent;
    data.push({ x: i, y: Math.round(val * 10) / 10 });
  }
  return data;
}

function generateDateLabels(count: number): string[] {
  const labels: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    labels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
  }
  return labels;
}

function dataToSmoothPath(data: { x: number; y: number }[], width: number, height: number, padding: number = 0): string {
  if (data.length < 2) return "";
  const xScale = (i: number) => padding + (i / (data.length - 1)) * (width - padding * 2);
  const yScale = (val: number) => height - padding - (val / 100) * (height - padding * 2);
  let path = `M ${xScale(0)} ${yScale(data[0].y)}`;
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1];
    const curr = data[i];
    const cpx1 = xScale(i - 1) + (xScale(i) - xScale(i - 1)) * 0.4;
    const cpy1 = yScale(prev.y);
    const cpx2 = xScale(i) - (xScale(i) - xScale(i - 1)) * 0.4;
    const cpy2 = yScale(curr.y);
    path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${xScale(i)} ${yScale(curr.y)}`;
  }
  return path;
}

function dataToAreaPath(data: { x: number; y: number }[], width: number, height: number, padding: number = 0): string {
  const linePath = dataToSmoothPath(data, width, height, padding);
  const xScale = (i: number) => padding + (i / (data.length - 1)) * (width - padding * 2);
  return `${linePath} L ${xScale(data.length - 1)} ${height - padding} L ${xScale(0)} ${height - padding} Z`;
}

function getValueAtX(data: { x: number; y: number }[], xPos: number, width: number, padding: number): number {
  const usableWidth = width - padding * 2;
  const normalizedX = (xPos - padding) / usableWidth;
  const index = normalizedX * (data.length - 1);
  const i = Math.max(0, Math.min(data.length - 2, Math.floor(index)));
  const t = index - i;
  return Math.round((data[i].y * (1 - t) + data[i + 1].y * t) * 10) / 10;
}

// --- Component ---
const OpinionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const allCards = [...sampleCards, ...systemGeneratedCards];
  const card = allCards.find((c) => c.id === Number(id));

  const [stakeAmount, setStakeAmount] = useState("");
  const [selectedSide, setSelectedSide] = useState<"yes" | "no">("yes");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState(initialComments);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [showResolution, setShowResolution] = useState(false);
  const [activeTimeFilter, setActiveTimeFilter] = useState<typeof TIME_FILTERS[number]>("1W");
  const [activeCommentTab, setActiveCommentTab] = useState<typeof COMMENT_TABS[number]>("Comments");
  const [hoverX, setHoverX] = useState<number | null>(null);
  const chartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (card) {
      setSecondsLeft(parseTimeLeft(card.timeLeft));
      if (card.suggestedAnswers?.length) {
        setSelectedOption(card.suggestedAnswers[0].id);
      }
    }
  }, [card]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  const handleChartMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CHART_W;
    setHoverX(Math.max(CHART_PAD, Math.min(CHART_W - CHART_PAD, x)));
  }, []);

  const handleChartMouseLeave = useCallback(() => setHoverX(null), []);

  if (!card) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Opinion not found.</p>
      </div>
    );
  }

  const { question, yesPercent, noPercent, coins, genre, creator, postedDaysAgo, callerCount, isResolved, winner, resolutionType = "crowd", status = "open" } = card;
  const hasMultipleOptions = card.suggestedAnswers && card.suggestedAnswers.length > 0;
  const options: { id: string; label: string; percent: number; coins: number; callerCount: number; change: number }[] = hasMultipleOptions
    ? card.suggestedAnswers!.map((a, i) => ({
        id: a.id,
        label: a.label,
        percent: a.yesPercent,
        coins: a.coins,
        callerCount: a.callerCount,
        change: Math.round((Math.sin(i * 3.7 + (a.yesPercent ?? 50)) * 4) * 10) / 10,
      }))
    : [
        { id: "yes", label: "Yes", percent: yesPercent, coins: Math.round(coins * yesPercent / 100), callerCount: Math.round((callerCount ?? 0) * 0.6), change: 2.3 },
        { id: "no", label: "No", percent: noPercent, coins: Math.round(coins * noPercent / 100), callerCount: Math.round((callerCount ?? 0) * 0.4), change: -1.8 },
      ];

  const currentSelectedOption = selectedOption || options[0]?.id;
  const selectedOpt = options.find(o => o.id === currentSelectedOption) || options[0];
  const selectedOptIndex = options.indexOf(selectedOpt);

  const earlyEntry = getEarlyEntryMultiplier(postedDaysAgo ?? 1, card.timeLeft);
  const multiplier = earlyEntry?.multiplier ?? 1;
  const stakeNum = parseFloat(stakeAmount) || 0;
  const sidePercent = selectedSide === "yes" ? selectedOpt.percent : (100 - selectedOpt.percent);
  const { netWin, floorApplied } = calculateNetWin(stakeNum, sidePercent, multiplier);
  const statusInfo = statusConfig[status] || statusConfig.open;
  const isActive = status === "open" || status === "locked";
  const crowdContext = getCrowdContext(yesPercent, noPercent);
  const maxCall = getMaxCall(coins);
  const isOverWhaleLimit = stakeNum > maxCall;
  const isUnderMinimum = stakeNum > 0 && stakeNum < 10;

  // Generate chart data for all options
  const chartW = 800;
  const chartH = 220;
  const chartPad = 32;
  const dateLabels = generateDateLabels(7);

  const allChartData = useMemo(() =>
    options.map((opt, i) => generateChartData(opt.percent, i * 17 + (card.id ?? 0) * 7, 30)),
    [options, card.id]
  );

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied!", description: "Share this call with your friends." });
  };

  const handleComment = () => {
    if (!commentInput.trim()) return;
    setComments([{ user: "you", text: commentInput, time: "Just now", coins: 0, side: "yes" }, ...comments]);
    setCommentInput("");
  };

  const userCalledSide = isResolved ? "yes" : null;
  const userCallCoins = isResolved ? 200 : 0;
  const userWon = isResolved && winner === userCalledSide;
  const userNetPayout = userWon ? Math.round(userCallCoins * (100 / yesPercent) * 0.9 - userCallCoins) : userCallCoins;

  if (showResolution && isResolved) {
    return (
      <ResolutionScreen
        card={card}
        userWon={!!userWon}
        userPayout={userNetPayout}
        onDismiss={() => { setShowResolution(false); navigate("/"); }}
      />
    );
  }

  // Top callers data (mock)
  const topCallers = [
    { user: "goatdebater", coins: 500, side: "yes" as const },
    { user: "vibecheck", coins: 350, side: "yes" as const },
    { user: "worklife", coins: 200, side: "no" as const },
    { user: "hiphophead", coins: 200, side: "yes" as const },
    { user: "cryptobro", coins: 85, side: "no" as const },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="px-12 pt-8 pb-24">
        <div className="flex gap-10">
          {/* ============ LEFT COLUMN ============ */}
          <div className="flex-[65] min-w-0">
            {/* Breadcrumb */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-5">
              <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-gold transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-muted-foreground font-body">
                Feed › {genre} › Opinion
              </span>
            </motion.div>

            {/* Tags row */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex items-center gap-2.5 flex-wrap mb-4">
              <span className="rounded-full bg-gold/10 px-3.5 py-1 text-xs font-semibold text-gold font-body">{genre}</span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground font-body">
                {resolutionTypeLabels[resolutionType]}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusInfo.classes}`}>
                {statusInfo.label}
              </span>
            </motion.div>

            {/* Question */}
            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-headline text-3xl sm:text-4xl text-foreground leading-tight mb-4">
              {question}
            </motion.h1>

            {/* Resolution info */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground font-body">
                How this resolves: {resolutionDescriptions[resolutionType]}
              </p>
            </motion.div>

            {/* Creator chip */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <Link to={`/user/${creator}`} className="inline-flex items-center gap-2.5 hover:opacity-80 transition-opacity mb-8">
                <div className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                  {creator[0].toUpperCase()}
                </div>
                <span className="text-[13px] text-muted-foreground font-body">@{creator} · Posted {postedDaysAgo ?? 1} days ago</span>
              </Link>
            </motion.div>

            {/* ========== CHART ========== */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-8">
              {/* Legend */}
              <div className="flex items-center gap-5 flex-wrap mb-4">
                {options.map((opt, i) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: OPTION_HEX[i % OPTION_HEX.length] }} />
                    <span className="text-[13px] text-foreground font-body">{opt.label}</span>
                    <span className="text-[13px] font-semibold font-body" style={{ color: OPTION_HEX[i % OPTION_HEX.length] }}>{opt.percent}%</span>
                  </div>
                ))}
              </div>

              {/* SVG Chart */}
              <div className="w-full relative rounded-xl bg-card border border-border" style={{ height: chartH + 40 }}>
                <svg
                  ref={chartRef}
                  viewBox={`0 0 ${chartW} ${chartH}`}
                  className="w-full"
                  style={{ height: chartH }}
                  preserveAspectRatio="none"
                  onMouseMove={handleChartMouseMove}
                  onMouseLeave={handleChartMouseLeave}
                >
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map(v => {
                    const y = chartH - chartPad - (v / 100) * (chartH - chartPad * 2);
                    return <line key={v} x1={chartPad} y1={y} x2={chartW - chartPad} y2={y} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4 4" />;
                  })}

                  {/* Lines per option */}
                  {allChartData.map((chartData, i) => {
                    const color = OPTION_HEX[i % OPTION_HEX.length];
                    const linePath = dataToSmoothPath(chartData, chartW, chartH, chartPad);
                    const areaPath = dataToAreaPath(chartData, chartW, chartH, chartPad);
                    return (
                      <g key={options[i]?.id || i}>
                        <path d={areaPath} fill={color} opacity={0.08} />
                        <motion.path
                          d={linePath}
                          fill="none"
                          stroke={color}
                          strokeWidth="2.5"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                        />
                      </g>
                    );
                  })}

                  {/* Hover crosshair */}
                  {hoverX !== null && (
                    <line
                      x1={hoverX}
                      y1={chartPad}
                      x2={hoverX}
                      y2={chartH - chartPad}
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth="1"
                      strokeDasharray="4 3"
                      opacity={0.5}
                    />
                  )}
                </svg>

                {/* Y-axis labels */}
                <div className="absolute right-3 top-0 flex flex-col justify-between py-[32px] pointer-events-none" style={{ height: chartH }}>
                  {[100, 75, 50, 25, 0].map(v => (
                    <span key={v} className="text-[11px] text-muted-foreground font-body">{v}%</span>
                  ))}
                </div>

                {/* Hover tooltip */}
                <AnimatePresence>
                  {hoverX !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute top-2 rounded-lg border border-gold-border bg-card px-3 py-2.5 shadow-lg pointer-events-none z-10"
                      style={{ left: Math.min(hoverX / chartW * 100, 75) + "%", minWidth: 140 }}
                    >
                      <p className="text-[11px] text-muted-foreground font-body mb-1.5">
                        {dateLabels[Math.min(Math.floor((hoverX - chartPad) / (chartW - chartPad * 2) * (dateLabels.length - 1)), dateLabels.length - 1)] || ""}
                      </p>
                      {allChartData.map((chartData, i) => {
                        const val = getValueAtX(chartData, hoverX, chartW, chartPad);
                        return (
                          <div key={i} className="flex items-center gap-2 mb-0.5">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: OPTION_HEX[i % OPTION_HEX.length] }} />
                            <span className="text-[12px] font-body text-foreground">{options[i]?.label}</span>
                            <span className="text-[12px] font-bold font-body ml-auto" style={{ color: OPTION_HEX[i % OPTION_HEX.length] }}>{val}%</span>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* X-axis labels */}
                <div className="flex justify-between px-8 pt-2">
                  {dateLabels.map((label, i) => (
                    <span key={i} className="text-[11px] text-muted-foreground font-body">{label}</span>
                  ))}
                </div>
              </div>

              {/* Time filter tabs */}
              <div className="flex items-center gap-1 mt-4">
                {TIME_FILTERS.map(tf => (
                  <button
                    key={tf}
                    onClick={() => setActiveTimeFilter(tf)}
                    className={`px-3 py-1.5 text-[13px] font-medium font-body rounded transition-all ${
                      activeTimeFilter === tf
                        ? "text-gold border-b-2 border-gold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* ========== ANSWER OPTIONS LIST ========== */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mb-10">
              <div className="divide-y divide-border">
                {options.map((opt, i) => {
                  const isPositiveChange = opt.change >= 0;
                  return (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-5 py-5 cursor-pointer transition-colors hover:bg-secondary/40 px-2 -mx-2 rounded-lg ${currentSelectedOption === opt.id ? "bg-secondary/30" : ""}`}
                      onClick={() => setSelectedOption(opt.id)}
                    >
                      {/* Name + volume */}
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-foreground font-body">{opt.label}</p>
                        <p className="text-[13px] text-muted-foreground font-body mt-0.5">{opt.coins.toLocaleString()} coins Vol.</p>
                      </div>

                      {/* Percentage + change */}
                      <div className="flex items-center gap-2.5">
                        <span className="text-[28px] font-bold font-body leading-none" style={{ color: OPTION_HEX[i % OPTION_HEX.length] }}>
                          {opt.percent}%
                        </span>
                        <span className={`flex items-center gap-0.5 text-[13px] font-medium font-body ${isPositiveChange ? "text-yes" : "text-destructive"}`}>
                          {isPositiveChange ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                          {isPositiveChange ? "+" : ""}{opt.change}%
                        </span>
                      </div>

                      {/* Call buttons */}
                      {isActive && (
                        <div className="flex gap-2.5 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedOption(opt.id); setSelectedSide("yes"); }}
                            className="rounded-lg bg-yes px-5 py-2.5 text-sm font-semibold text-white font-body hover:brightness-90 transition-all"
                          >
                            Call Yes {opt.percent}%
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedOption(opt.id); setSelectedSide("no"); }}
                            className="rounded-lg border border-no bg-no/10 px-5 py-2.5 text-sm font-semibold text-no font-body hover:bg-no hover:text-white transition-all"
                          >
                            Call No {100 - opt.percent}%
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Summary stats */}
              <div className="flex items-center gap-8 mt-5 flex-wrap">
                <span className="text-sm text-muted-foreground font-body">{coins.toLocaleString()} coins Vol.</span>
                <span className="text-sm text-muted-foreground font-body">Ends {card.timeLeft}</span>
                <span className="text-sm text-muted-foreground font-body">{callerCount ?? 0} people have called</span>
              </div>
            </motion.div>

            {/* Resolved status */}
            {(isResolved || status === "resolved" || status === "draw") && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10">
                {status === "draw" ? (
                  <div className="rounded-2xl bg-no/15 p-6">
                    <p className="font-headline text-xl font-bold text-no mb-2">Draw — All calls refunded</p>
                    <p className="text-sm text-muted-foreground font-body">Total pool: {coins.toLocaleString()} coins</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-2xl bg-gold p-6">
                      <p className="font-headline text-xl font-bold text-primary-foreground mb-2">Resolved · {winner === "yes" ? "Yes" : "No"} Won</p>
                      <p className="text-sm text-primary-foreground/80 font-body">Total pool: {coins.toLocaleString()} · Winner payout: {Math.round(coins * 0.9).toLocaleString()} coins</p>
                    </div>
                    <button onClick={() => setShowResolution(true)} className="w-full rounded-xl border border-gold text-gold font-body text-sm font-semibold py-3 hover:bg-gold hover:text-primary-foreground transition-all">
                      View Full Result
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ========== COMMENTS ========== */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-10">
              <h3 className="font-headline text-2xl mb-5">The Conversation</h3>

              {/* Tabs */}
              <div className="flex items-center gap-6 border-b border-border mb-6">
                {COMMENT_TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveCommentTab(tab)}
                    className={`pb-3 text-sm font-semibold font-body transition-colors relative ${
                      activeCommentTab === tab
                        ? "text-gold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "Comments" ? `Comments (${comments.length})` : tab}
                    {activeCommentTab === tab && (
                      <motion.div layoutId="commentTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {activeCommentTab === "Comments" && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">Y</div>
                    <input
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleComment()}
                      placeholder="Drop your take..."
                      className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                    />
                    <button onClick={handleComment} className="h-10 w-10 rounded-lg bg-gold flex items-center justify-center hover:bg-gold-hover transition-colors shrink-0">
                      <Send className="h-4 w-4 text-primary-foreground" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {comments.slice(0, 3).map((c, i) => (
                      <div key={i} className="rounded-xl bg-secondary p-5 border-l-2 border-gold">
                        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                            {c.user[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-foreground font-body">@{c.user}</span>
                          {c.coins > 0 && (
                            <span className="text-[11px] font-medium text-muted-foreground font-body">
                              · {c.coins} coins · Called {c.side === "yes" ? "Yes" : "No"}
                            </span>
                          )}
                          <span className="text-[11px] text-muted-foreground font-body">· {c.time}</span>
                        </div>
                        <p className="text-sm text-foreground font-body mb-3">{c.text}</p>
                        <div className="flex items-center gap-4">
                          <button className="text-muted-foreground hover:text-gold transition-colors flex items-center gap-1 text-xs font-body">
                            <ThumbsUp className="h-3.5 w-3.5" /> Like
                          </button>
                          <button className="text-muted-foreground hover:text-gold transition-colors flex items-center gap-1 text-xs font-body">
                            <MessageCircle className="h-3.5 w-3.5" /> Reply
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {comments.length > 3 && (
                    <button className="mt-5 text-sm font-medium text-gold hover:text-gold-hover transition-colors font-body">
                      Load more comments
                    </button>
                  )}
                </>
              )}

              {activeCommentTab === "Top Callers" && (
                <div className="space-y-3">
                  {topCallers.map((caller, i) => (
                    <div key={i} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                      <span className="text-sm font-bold text-muted-foreground font-body w-6">#{i + 1}</span>
                      <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                        {caller.user[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-foreground font-body flex-1">@{caller.user}</span>
                      <span className="text-sm font-bold text-gold font-body">{caller.coins} coins</span>
                      <span className={`text-xs font-medium font-body ${caller.side === "yes" ? "text-yes" : "text-no"}`}>
                        Called {caller.side === "yes" ? "Yes" : "No"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeCommentTab === "Positions" && (
                <div className="space-y-4">
                  {options.map((opt, i) => (
                    <div key={opt.id} className="rounded-xl bg-secondary p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: OPTION_HEX[i % OPTION_HEX.length] }} />
                        <span className="text-sm font-semibold text-foreground font-body">{opt.label}</span>
                        <span className="text-sm font-bold font-body ml-auto" style={{ color: OPTION_HEX[i % OPTION_HEX.length] }}>{opt.percent}%</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground font-body">
                        <span>{opt.callerCount} callers</span>
                        <span>{opt.coins.toLocaleString()} coins</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeCommentTab === "Activity" && (
                <div className="space-y-2">
                  {activityFeed.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                      <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                        {item.user[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-body text-foreground flex-1">
                        <span className="font-semibold">@{item.user}</span>
                        {" called "}
                        <span className={`font-bold ${item.side === "yes" ? "text-yes" : "text-no"}`}>
                          {item.side === "yes" ? "Yes" : "No"}
                        </span>
                        {" with "}
                        <span className="font-bold text-gold">{item.amount} coins</span>
                      </span>
                      <span className="text-xs text-muted-foreground font-body shrink-0">{item.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Share + source */}
            <div className="flex items-center gap-3 mb-10">
              <button onClick={handleShare} className="rounded-xl border border-gold text-gold font-body text-sm font-semibold py-3 px-6 flex items-center gap-2 hover:bg-gold hover:text-primary-foreground transition-all">
                <Share2 className="h-4 w-4" /> Share
              </button>
              {card.isSystemGenerated && (
                <span className="text-xs text-muted-foreground font-body">
                  Generated from {card.generatedFrom}
                  {card.socialSource?.url && (
                    <a href={card.socialSource.url} target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-hover ml-1">View source →</a>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* ============ RIGHT COLUMN — STICKY STAKE PANEL ============ */}
          <div className="hidden lg:block flex-[35] min-w-[340px]">
            <div className="sticky top-24">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border border-gold-border bg-card p-6"
                style={{ boxShadow: "0 4px 24px hsl(var(--gold-glow))" }}
              >
                {/* Selected option header */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="h-12 w-12 rounded-full bg-secondary border-2 border-gold flex items-center justify-center text-base font-bold text-foreground">
                    {selectedOpt.label[0]}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground font-body">{selectedOpt.label}</p>
                    <p className="font-headline text-[40px] font-bold leading-none" style={{ color: OPTION_HEX[selectedOptIndex % OPTION_HEX.length] }}>
                      {selectedOpt.percent}%
                    </p>
                  </div>
                </div>

                {/* Call Yes / Call No tabs — underline style */}
                <div className="flex border-b border-border mb-6">
                  <button
                    onClick={() => setSelectedSide("yes")}
                    className={`flex-1 pb-3 text-sm font-semibold font-body transition-all relative ${
                      selectedSide === "yes" ? "text-yes" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Call Yes
                    {selectedSide === "yes" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yes rounded-full" />}
                  </button>
                  <button
                    onClick={() => setSelectedSide("no")}
                    className={`flex-1 pb-3 text-sm font-semibold font-body transition-all relative ${
                      selectedSide === "no" ? "text-no" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Call No
                    {selectedSide === "no" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-no rounded-full" />}
                  </button>
                </div>

                {/* Amount label + large display */}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-foreground font-body">Amount</p>
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-gold" />
                    <span className="font-headline text-[40px] font-bold text-foreground leading-none">
                      {stakeNum || "0"}
                    </span>
                  </div>
                </div>

                {/* Amount input */}
                <div className="relative mb-3">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold" />
                  <input
                    type="number"
                    min="10"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-3.5 text-base font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                {/* Quick add buttons — bigger */}
                <div className="flex gap-2 mb-5 flex-wrap">
                  {[50, 100, 500, 1000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setStakeAmount(String((parseFloat(stakeAmount) || 0) + amt))}
                      className="rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-muted-foreground hover:border-gold hover:text-gold transition-colors font-body"
                    >
                      +{amt}
                    </button>
                  ))}
                  <button
                    onClick={() => setStakeAmount(String(maxCall))}
                    className="rounded-lg border border-gold px-4 py-2 text-[13px] font-medium text-gold hover:bg-gold hover:text-primary-foreground transition-colors font-body"
                  >
                    Max
                  </button>
                </div>

                {/* Validation */}
                {isUnderMinimum && <p className="text-xs text-destructive font-body mb-2">Minimum call: 10 coins</p>}
                {isOverWhaleLimit && <p className="text-xs text-destructive font-body mb-2">Exceeds whale cap ({maxCall.toLocaleString()} max)</p>}

                {/* Return preview */}
                {stakeNum >= 10 && !isOverWhaleLimit && (
                  <div className="mb-5 space-y-1.5">
                    <p className="text-[12px] text-muted-foreground font-body">Potential win</p>
                    <p className="font-headline text-[28px] font-bold text-gold leading-none">
                      +{Math.round(netWin + stakeNum)} coins
                    </p>
                    <p className="text-[13px] font-medium text-yes font-body">Net profit: +{Math.round(netWin)} coins</p>
                    {earlyEntry && earlyEntry.multiplier > 1 && (
                      <p className="text-[11px] text-gold font-body">Early caller bonus: +{Math.round((earlyEntry.multiplier - 1) * 100)}%</p>
                    )}
                    {floorApplied && (
                      <p className="text-[11px] text-muted-foreground font-body">+3% minimum guaranteed</p>
                    )}
                    <p className="text-[11px] text-muted-foreground font-body">{crowdContext.label}</p>
                  </div>
                )}

                {/* Confirm button */}
                {isActive ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isOverWhaleLimit || isUnderMinimum || stakeNum < 10}
                      className="w-full rounded-lg bg-gold py-4 text-base font-semibold text-primary-foreground font-body hover:bg-gold-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed animate-gold-pulse"
                    >
                      Confirm Call
                    </motion.button>
                    <p className="text-[11px] text-muted-foreground text-center mt-2.5 font-body">Coins deducted immediately on call</p>

                    {earlyEntry && earlyEntry.multiplier > 1 && (
                      <div className="mt-3 text-center">
                        <span className="inline-block rounded-full bg-gold/10 px-3.5 py-1.5 text-[11px] font-medium text-gold font-body">
                          Early Caller · {earlyEntry.label} bonus active
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-lg bg-muted py-3 text-center text-sm font-medium text-muted-foreground font-body">
                    {status === "resolved" ? `${winner === "yes" ? "Yes" : "No"} Won` : "Draw — Calls Refunded"}
                  </div>
                )}

                {/* Void warning */}
                {(callerCount ?? 0) < 10 && isActive && (
                  <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-gold/10">
                    <AlertTriangle className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground font-body">
                      Needs {10 - (callerCount ?? 0)} more callers. Under 10 = void & full refund.
                    </p>
                  </div>
                )}

                {/* Countdown */}
                <div className="mt-5 pt-5 border-t border-border">
                  <p className="text-[12px] text-muted-foreground font-body mb-1.5">Time remaining</p>
                  <p className="text-base font-bold text-foreground font-body">{formatCountdown(secondsLeft)}</p>
                  <p className="text-[11px] text-muted-foreground font-body mt-1.5">
                    Resolved by: {resolutionType === "crowd" ? "Community Call" : resolutionType === "event" ? "Event Outcome" : "Metrics"}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpinionDetail;
