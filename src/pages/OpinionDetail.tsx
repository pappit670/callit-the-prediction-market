// src/pages/OpinionDetail.tsx  ── REDESIGN
// Inspired by Kalshi (live match header, live graph) + Polymarket (multi-option layout)
//
// Layout:
//   MOBILE:  Header → [LIVE banner if sports] → [Team duel or question icon] →
//            Question → Chart → Options (vertical, floating YES/NO) → Comments/Activity
//   DESKTOP: Left column (all above) + Right sticky stake panel
//
// Key features:
//   • Sports match: team logos side-by-side like Kalshi, LIVE dot, score-style layout
//   • Chart: area chart with multiple coloured series (Polymarket style)
//   • Options: each option is a full row with % bar, colour, floating Buy Yes / Buy No
//   • Multi-answer: all options listed vertically like Polymarket detail page
//   • Floating stake bar on mobile (bottom) — rises on tap

import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Share2, Bookmark, Users, Timer,
  TrendingUp, MessageCircle, Radio,
  ChevronLeft, CheckCircle2, X,
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { useApp } from "@/context/AppContext";
import { MobileStakeSheet } from "@/components/MobileStakeSheet";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ── Colours ───────────────────────────────────────────────────
const optColor = (label: string, i: number): string => {
  const l = label.toLowerCase().trim();
  if (l === "yes" || l === "agree") return "#2563EB";
  if (l === "no" || l === "disagree") return "#DC2626";
  const multi = ["#7C3AED", "#0891B2", "#059669", "#EA580C", "#F59E0B", "#EC4899"];
  return multi[i % multi.length];
};
const isYN = (l: string) => ["yes", "no", "agree", "disagree"].includes(l.toLowerCase().trim());
const isPureYN = (opts: string[]) => opts.length > 0 && opts.every(o => isYN(o));

// ── Time helpers ──────────────────────────────────────────────
function timeLeft(end: string): string {
  const diff = new Date(end).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

// ── Custom chart tooltip ──────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-foreground font-semibold">{p.name}</span>
          <span className="font-bold ml-auto pl-4" style={{ color: p.color }}>{p.value}%</span>
        </div>
      ))}
    </div>
  );
};

// ── Sports match header (Kalshi style) ────────────────────────
const MatchHeader = ({ opinion, probabilities }: { opinion: any; probabilities: Record<string, number> }) => {
  const homeTeam = opinion.home_team_name || opinion.options?.[0] || "Home";
  const awayTeam = opinion.away_team_name || opinion.options?.[1] || "Away";
  const homeLogo = opinion.home_team_logo;
  const awayLogo = opinion.away_team_logo;
  const homeProb = probabilities[homeTeam] ?? probabilities["Yes"] ?? 50;
  const awayProb = probabilities[awayTeam] ?? probabilities["No"] ?? 50;
  const isLive = opinion.status === "open";

  return (
    <div className="px-4 pt-4 pb-3">
      {/* LIVE banner */}
      {isLive && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-px flex-1 bg-border/40" />
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#DC2626]">
            <Radio className="h-3 w-3 animate-pulse" />
            LIVE
          </div>
          <div className="h-px flex-1 bg-border/40" />
        </div>
      )}

      {/* Teams */}
      <div className="flex items-center justify-between gap-4">
        {/* Home */}
        <div className="flex flex-col items-center gap-2 flex-1">
          {homeLogo ? (
            <img src={homeLogo} className="h-14 w-14 object-contain rounded-xl bg-secondary/30 p-1" alt={homeTeam} />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-[#2563EB]/15 border border-[#2563EB]/30 flex items-center justify-center">
              <span className="text-xl font-black text-[#2563EB]">{homeTeam[0]}</span>
            </div>
          )}
          <span className="text-sm font-bold text-foreground text-center leading-tight">{homeTeam}</span>
          <span className="text-2xl font-black text-[#2563EB]">{homeProb}%</span>
        </div>

        {/* VS divider */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-muted-foreground font-bold">VS</span>
          {opinion.league_name && (
            <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              {opinion.league_name}
            </span>
          )}
        </div>

        {/* Away */}
        <div className="flex flex-col items-center gap-2 flex-1">
          {awayLogo ? (
            <img src={awayLogo} className="h-14 w-14 object-contain rounded-xl bg-secondary/30 p-1" alt={awayTeam} />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-[#DC2626]/15 border border-[#DC2626]/30 flex items-center justify-center">
              <span className="text-xl font-black text-[#DC2626]">{awayTeam[0]}</span>
            </div>
          )}
          <span className="text-sm font-bold text-foreground text-center leading-tight">{awayTeam}</span>
          <span className="text-2xl font-black text-[#DC2626]">{awayProb}%</span>
        </div>
      </div>

      {/* Probability bar */}
      <div className="mt-4 h-2 rounded-full overflow-hidden flex">
        <div className="h-full bg-[#2563EB] transition-all duration-700" style={{ width: `${homeProb}%` }} />
        <div className="h-full bg-[#DC2626] transition-all duration-700" style={{ width: `${awayProb}%` }} />
      </div>
    </div>
  );
};

// ── Polymarket-style area chart ───────────────────────────────
const ProbabilityChart = ({
  chartData, options, period, onPeriod,
}: {
  chartData: any[];
  options: string[];
  period: string;
  onPeriod: (p: string) => void;
}) => {
  const PERIODS = ["1H", "6H", "1D", "1W", "1M", "MAX"];

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">
        No chart data yet
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            {options.map((opt, i) => {
              const color = optColor(opt, i);
              return (
                <linearGradient key={opt} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip content={<ChartTooltip />} />
          {options.map((opt, i) => {
            const color = optColor(opt, i);
            return (
              <Area key={opt} type="monotone" dataKey={opt}
                stroke={color} strokeWidth={2}
                fill={`url(#grad-${i})`}
                dot={false} activeDot={{ r: 4, fill: color, strokeWidth: 0 }} />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>

      {/* Period selector */}
      <div className="flex items-center justify-center gap-1 mt-2">
        {PERIODS.map(p => (
          <button key={p} onClick={() => onPeriod(p)}
            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${period === p
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
              }`}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Option row — Polymarket style ─────────────────────────────
// Shows label, % bar, probability, floating YES/NO buttons
const OptionRow = ({
  opt, i, pct, isUserPick, isOpen,
  onBuyYes, onBuyNo, pureYN,
}: {
  opt: string; i: number; pct: number; isUserPick: boolean; isOpen: boolean;
  onBuyYes: () => void; onBuyNo: () => void; pureYN: boolean;
}) => {
  const color = optColor(opt, i);
  const odds = Math.round((100 / Math.max(pct, 1)) * 10) / 10;

  return (
    <div className={`rounded-2xl border transition-all ${isUserPick ? "border-2" : "border"}`}
      style={{ borderColor: isUserPick ? color : "var(--border)" }}>

      {/* Top row: label + probability */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="h-3 w-3 rounded-full shrink-0" style={{ background: color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-bold text-foreground">{opt}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#F5C518] font-semibold">{odds}x</span>
              <span className="text-base font-black" style={{ color }}>{pct}%</span>
            </div>
          </div>
          {/* Probability bar */}
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: color }} />
          </div>
        </div>
      </div>

      {/* Bottom: Buy YES / Buy NO buttons */}
      {isOpen && (
        <div className="grid grid-cols-2 gap-px border-t border-border/40 overflow-hidden rounded-b-2xl">
          {pureYN ? (
            // For pure YES/NO — full-width single Buy button
            <button onClick={onBuyYes}
              className="col-span-2 py-3 text-sm font-bold transition-colors hover:opacity-90"
              style={{ background: color + "18", color }}>
              Buy · {pct}%
            </button>
          ) : (
            <>
              <button onClick={onBuyYes}
                className="flex items-center justify-center gap-2 py-3 bg-[#2563EB]/08 hover:bg-[#2563EB]/15 transition-colors">
                <div className="h-2 w-2 rounded-full bg-[#2563EB]" />
                <span className="text-xs font-bold text-[#2563EB]">Yes · {pct}%</span>
              </button>
              <button onClick={onBuyNo}
                className="flex items-center justify-center gap-2 py-3 bg-[#DC2626]/08 hover:bg-[#DC2626]/15 transition-colors">
                <div className="h-2 w-2 rounded-full bg-[#DC2626]" />
                <span className="text-xs font-bold text-[#DC2626]">No · {100 - pct}%</span>
              </button>
            </>
          )}
        </div>
      )}

      {isUserPick && (
        <div className="flex items-center gap-1.5 px-4 py-1.5 border-t border-border/20">
          <CheckCircle2 className="h-3 w-3" style={{ color }} />
          <span className="text-[10px] font-semibold" style={{ color }}>Your call</span>
        </div>
      )}
    </div>
  );
};

// ── Desktop stake panel ───────────────────────────────────────
const StakePanel = ({
  opinion, options, userCall, isOpen, probabilities,
  countdown, onCall, submitting, user, isLoggedIn, navigate,
}: any) => {
  const [selected, setSelected] = useState<string | null>(userCall?.chosen_option || null);
  const [stance, setStance] = useState<"yes" | "no" | null>(null);
  const [amount, setAmount] = useState(50);
  const STAKE_OPTS = [10, 25, 50, 100, 250];

  const pureYN = isPureYN(options);
  const pct = selected ? (probabilities[selected] ?? 50) : 50;
  const odds = Math.round((100 / Math.max(pct, 1)) * 10) / 10;
  const ret = Math.round(amount * odds * 0.95);

  const handleCall = async () => {
    if (!isLoggedIn) { toast.error("Log in first"); navigate("/auth"); return; }
    if (!selected) { toast.error("Pick an option"); return; }
    await onCall(selected, amount, stance ?? undefined);
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden sticky top-24">
      <div className="px-4 py-3 border-b border-border bg-secondary/20">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Make Your Call</p>
      </div>

      <div className="p-4 space-y-3">
        {/* Options */}
        <div className="space-y-2">
          {options.map((opt: string, i: number) => {
            const color = optColor(opt, i);
            const p = probabilities[opt] ?? Math.round(100 / options.length);
            return (
              <div key={opt}>
                <button
                  onClick={() => isOpen && (setSelected(opt), setStance(null))}
                  disabled={!isOpen}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left"
                  style={{
                    borderColor: selected === opt ? color : "var(--border)",
                    background: selected === opt ? color + "12" : "transparent",
                    borderWidth: selected === opt ? 2 : 1,
                  }}>
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-sm font-bold flex-1" style={{ color: selected === opt ? color : "var(--foreground)" }}>
                    {opt}
                  </span>
                  <span className="text-sm font-bold" style={{ color }}>{p}%</span>
                  {!pureYN && selected !== opt && (
                    <span className="text-xs text-[#F5C518]">{Math.round((100 / Math.max(p, 1)) * 10) / 10}x</span>
                  )}
                </button>

                {/* YES/NO sub-buttons for name options */}
                {!pureYN && selected === opt && (
                  <div className="grid grid-cols-2 gap-1 mt-1 px-1">
                    {(["yes", "no"] as const).map(s => (
                      <button key={s} onClick={() => setStance(s)}
                        className="py-2 rounded-lg text-xs font-bold border transition-all"
                        style={{
                          borderColor: stance === s ? (s === "yes" ? "#2563EB" : "#DC2626") : "var(--border)",
                          background: stance === s ? (s === "yes" ? "#2563EB18" : "#DC262618") : "transparent",
                          color: s === "yes" ? "#2563EB" : "#DC2626",
                        }}>
                        {s === "yes" ? "Yes" : "No"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Amount */}
        {selected && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Stake</span>
              <span className="text-xs text-muted-foreground">
                Balance: <span className="text-foreground font-bold">{(user?.balance || 0).toLocaleString()}</span>c
              </span>
            </div>
            <div className="flex gap-1.5 mb-2">
              {STAKE_OPTS.map(s => (
                <button key={s} onClick={() => setAmount(s)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${amount === s ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/30"
                    }`}>{s}</button>
              ))}
            </div>

            {/* Return preview */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-secondary/40 rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5">Stake</p>
                <p className="text-lg font-black">{amount}c</p>
              </div>
              <div className="bg-[#22C55E]/08 border border-[#22C55E]/20 rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5">If correct</p>
                <p className="text-lg font-black text-[#22C55E]">+{ret}c</p>
                <p className="text-[10px] text-[#F5C518] font-bold">{odds}x</p>
              </div>
            </div>

            <button onClick={handleCall} disabled={submitting}
              className="w-full py-4 rounded-2xl text-base font-black transition-all disabled:opacity-40"
              style={{ background: "#F5C518", color: "#0a0a0a" }}>
              {submitting ? "Placing..." : userCall ? "Update Call →" : "Call It →"}
            </button>
          </motion.div>
        )}

        {!selected && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Pick an option above to stake
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 border-t border-border">
        {[
          { label: "Callers", val: opinion.call_count || 0 },
          { label: "Time left", val: opinion.end_time ? timeLeft(opinion.end_time) : "—" },
          { label: "Watching", val: opinion.follower_count || 0 },
        ].map((s, i) => (
          <div key={i} className={`text-center py-3 ${i === 1 ? "border-x border-border" : ""}`}>
            <p className="text-sm font-bold">{s.val}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function OpinionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useApp();

  const [opinion, setOpinion] = useState<any>(null);
  const [userCall, setUserCall] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentTab, setCommentTab] = useState<"comments" | "activity">("comments");
  const [period, setPeriod] = useState("1D");
  const [rawHistory, setRawHistory] = useState<any[]>([]);
  const [probabilities, setProbabilities] = useState<Record<string, number>>({});
  const [stakeSheet, setStakeSheet] = useState<{ open: boolean; option?: string; stance?: "yes" | "no" }>({ open: false });
  const [countdown, setCountdown] = useState("");
  const [bookmarked, setBookmarked] = useState(false);

  // Countdown tick
  useEffect(() => {
    if (!opinion?.end_time) return;
    const tick = () => setCountdown(timeLeft(opinion.end_time));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [opinion?.end_time]);

  // Fetch opinion
  useEffect(() => {
    if (!id) return;
    supabase
      .from("opinions")
      .select("*, topics!opinions_topic_id_fkey(name,icon,slug,color), profiles(username,reputation_score)")
      .eq("id", id)
      .single()
      .then(({ data }) => { if (data) setOpinion(data); });
  }, [id]);

  // Fetch price history
  useEffect(() => {
    if (!id) return;
    supabase
      .from("option_price_history")
      .select("option_label, percent, recorded_at")
      .eq("opinion_id", id)
      .order("recorded_at", { ascending: true })
      .limit(500)
      .then(({ data }) => setRawHistory(data || []));
  }, [id]);

  // Fetch user call
  useEffect(() => {
    if (!id || !user) return;
    supabase
      .from("calls")
      .select("*")
      .eq("opinion_id", id)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setUserCall(data));
  }, [id, user]);

  // Fetch comments
  useEffect(() => {
    if (!id) return;
    supabase
      .from("comments")
      .select("*, profiles(username)")
      .eq("opinion_id", id)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => setComments(data || []));
  }, [id]);

  // Latest probabilities from most recent history entries per option
  useEffect(() => {
    if (!rawHistory.length || !opinion) return;
    const latest: Record<string, number> = {};
    // Walk backwards — first occurrence per option is latest
    for (let i = rawHistory.length - 1; i >= 0; i--) {
      const { option_label, percent } = rawHistory[i];
      if (latest[option_label] === undefined) {
        latest[option_label] = Math.round(Number(percent));
      }
    }
    // Fill missing options with equal split
    const options = opinion.options || ["Yes", "No"];
    const known = options.filter((o: string) => latest[o] !== undefined);
    if (!known.length) {
      const split = Math.round(100 / options.length);
      options.forEach((o: string) => { latest[o] = split; });
    }
    setProbabilities(latest);
  }, [rawHistory, opinion]);

  // Build chart data bucketed by period
  const chartData = useMemo(() => {
    if (!rawHistory.length || !opinion) return [];
    const options = opinion.options || ["Yes", "No"];

    // Filter by period
    const now = Date.now();
    const cutoff: Record<string, number> = {
      "1H": now - 3600000,
      "6H": now - 21600000,
      "1D": now - 86400000,
      "1W": now - 604800000,
      "1M": now - 2592000000,
      "MAX": 0,
    };
    const filtered = rawHistory.filter(r =>
      new Date(r.recorded_at).getTime() >= (cutoff[period] || 0)
    );
    if (!filtered.length) return [];

    // Group by time bucket (every 30min for short, every 6h for long)
    const bucketMs = period === "1H" ? 300000 : period === "6H" ? 900000 :
      period === "1D" ? 3600000 : period === "1W" ? 21600000 : 86400000;

    const buckets: Record<string, Record<string, number[]>> = {};
    filtered.forEach(r => {
      const t = new Date(r.recorded_at).getTime();
      const key = String(Math.floor(t / bucketMs) * bucketMs);
      if (!buckets[key]) buckets[key] = {};
      if (!buckets[key][r.option_label]) buckets[key][r.option_label] = [];
      buckets[key][r.option_label].push(Number(r.percent));
    });

    return Object.entries(buckets)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([ts, vals]) => {
        const point: Record<string, unknown> = {
          time: fmtTime(new Date(Number(ts)).toISOString()),
        };
        options.forEach((o: string) => {
          const arr = vals[o] || [];
          point[o] = arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
        });
        return point;
      })
      .filter(p => options.some((o: string) => p[o] !== null));
  }, [rawHistory, period, opinion]);

  const handleCall = async (optionLabel: string, amount: number, stance?: "yes" | "no") => {
    if (!isLoggedIn) { toast.error("Log in to call"); navigate("/auth"); return; }
    setSubmitting(true);
    try {
      const effectiveOption = stance ? `${optionLabel}:${stance}` : optionLabel;
      const { error } = await supabase.from("calls").upsert({
        opinion_id: id,
        user_id: user?.id,
        chosen_option: effectiveOption,
        amount,
      }, { onConflict: "opinion_id,user_id" });
      if (error) throw error;
      toast.success("Call placed!");
      setUserCall({ chosen_option: effectiveOption, amount });
      setStakeSheet({ open: false });
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    if (!isLoggedIn) { toast.error("Log in first"); return; }
    const { error } = await supabase.from("comments").insert({
      opinion_id: id, user_id: user?.id, content: comment.trim(),
    });
    if (!error) { setComment(""); toast.success("Comment posted"); }
  };

  if (!opinion) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12 space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-secondary animate-pulse" />)}
        </div>
      </div>
    );
  }

  const options = Array.isArray(opinion.options) ? opinion.options : ["Yes", "No"];
  const hasActivity = Object.keys(probabilities).length > 0;
  const pureYN_q = isPureYN(options);
  const isSports = opinion.is_sports_match || (opinion.home_team_name && opinion.away_team_name);
  const isOpen = opinion.status === "open";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 md:px-6 py-4 pb-32 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8">

          {/* ── LEFT COLUMN ───────────────────────────────────── */}
          <div className="min-w-0 space-y-4">

            {/* Back + actions */}
            <div className="flex items-center justify-between">
              <button onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => setBookmarked(b => !b)}
                  className={`p-2 rounded-xl border transition-colors ${bookmarked ? "border-[#F5C518] text-[#F5C518]" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  <Bookmark className="h-4 w-4" fill={bookmarked ? "#F5C518" : "none"} />
                </button>
                <button onClick={() => navigator.share?.({ url: location.href, title: opinion.statement })}
                  className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Card: header + chart + options */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">

              {/* Sports match header OR standard question header */}
              {isSports ? (
                <MatchHeader opinion={opinion} probabilities={probabilities} />
              ) : (
                <div className="p-4 pb-3">
                  <div className="flex items-start gap-3">
                    {opinion.icon_url && (
                      <img src={opinion.icon_url} className="h-12 w-12 rounded-xl object-cover shrink-0" alt="" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {opinion.topics?.icon && <span>{opinion.topics.icon}</span>}
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          {opinion.topics?.name || "General"}
                        </span>
                        {isOpen && (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-1.5 py-0.5 rounded-full">
                            <Radio className="h-2 w-2 animate-pulse" /> Live
                          </span>
                        )}
                      </div>
                      <h1 className="text-lg font-bold text-foreground leading-snug">{opinion.statement}</h1>
                      {opinion.profiles?.username && (
                        <p className="text-xs text-muted-foreground mt-1">
                          by <span className="font-semibold text-foreground/70">@{opinion.profiles.username}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-4 px-4 py-2 border-t border-b border-border/40 bg-secondary/10">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span className="font-semibold text-foreground">{(opinion.call_count || 0).toLocaleString()}</span> callers
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Timer className="h-3.5 w-3.5" />
                  {countdown || "—"}
                </span>
                {opinion.coins_staked > 0 && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span className="font-semibold text-foreground">{(opinion.coins_staked || 0).toLocaleString()}</span>c staked
                  </span>
                )}
              </div>

              {/* Chart */}
              <div className="px-4 py-4">
                <ProbabilityChart
                  chartData={chartData}
                  options={options}
                  period={period}
                  onPeriod={setPeriod}
                />
              </div>
            </div>

            {/* Options list — Polymarket style */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                Options · {options.length} {options.length === 1 ? "outcome" : "outcomes"}
              </p>
              {options.map((opt: string, i: number) => {
                const pct = probabilities[opt] ?? Math.round(100 / options.length);
                const isUserP = userCall?.chosen_option === opt ||
                  userCall?.chosen_option === `${opt}:yes` ||
                  userCall?.chosen_option === `${opt}:no`;
                return (
                  <OptionRow key={opt} opt={opt} i={i} pct={pct}
                    isUserPick={isUserP} isOpen={isOpen}
                    pureYN={pureYN_q}
                    onBuyYes={() => {
                      if (!isLoggedIn) { navigate("/auth"); return; }
                      setStakeSheet({ open: true, option: opt, stance: pureYN_q ? undefined : "yes" });
                    }}
                    onBuyNo={() => {
                      if (!isLoggedIn) { navigate("/auth"); return; }
                      setStakeSheet({ open: true, option: opt, stance: "no" });
                    }}
                  />
                );
              })}
            </div>

            {/* Context / source */}
            {(opinion.description || opinion.source_url) && (
              <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Context</p>
                {opinion.description && (
                  <p className="text-sm text-foreground/80 leading-relaxed">{opinion.description}</p>
                )}
                {opinion.source_url && (
                  <a href={opinion.source_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[#2563EB] hover:underline flex items-center gap-1">
                    Source ↗
                  </a>
                )}
              </div>
            )}

            {/* Comments */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex border-b border-border">
                {(["comments", "activity"] as const).map(t => (
                  <button key={t} onClick={() => setCommentTab(t)}
                    className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${commentTab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}>
                    <MessageCircle className="h-4 w-4" />
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              {commentTab === "comments" && (
                <div>
                  {/* Comment input */}
                  {isLoggedIn && (
                    <div className="flex gap-2 p-3 border-b border-border">
                      <input value={comment} onChange={e => setComment(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleComment()}
                        placeholder="Add your take..."
                        className="flex-1 bg-secondary/40 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-foreground/30 transition-colors" />
                      <button onClick={handleComment}
                        className="px-4 py-2 rounded-xl bg-foreground text-background text-sm font-bold hover:opacity-90 transition-all">
                        Post
                      </button>
                    </div>
                  )}
                  <div className="divide-y divide-border/40">
                    {comments.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        No comments yet — be first
                      </div>
                    ) : comments.map((c, i) => (
                      <div key={c.id || i} className="px-4 py-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-6 w-6 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-bold">
                            {c.profiles?.username?.[0]?.toUpperCase() || "?"}
                          </div>
                          <span className="text-xs font-semibold text-foreground">@{c.profiles?.username || "anon"}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {new Date(c.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed pl-8">{c.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {commentTab === "activity" && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Activity feed coming soon
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN — desktop stake panel ───────────── */}
          <aside className="hidden lg:block">
            <StakePanel
              opinion={opinion}
              options={options}
              userCall={userCall}
              isOpen={isOpen}
              probabilities={probabilities}
              countdown={countdown}
              onCall={handleCall}
              submitting={submitting}
              user={user}
              isLoggedIn={isLoggedIn}
              navigate={navigate}
            />
          </aside>
        </div>
      </main>

      {/* ── Mobile floating bottom bar ─────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border px-4 py-3">
        {userCall ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
              <span className="text-sm text-muted-foreground">Your call:</span>
              <span className="text-sm font-bold text-foreground">{userCall.chosen_option}</span>
            </div>
            <button onClick={() => setStakeSheet({ open: true })}
              className="px-4 py-2.5 rounded-xl border border-[#F5C518] text-[#F5C518] text-sm font-bold">
              Update
            </button>
          </div>
        ) : (
          <button onClick={() => setStakeSheet({ open: true })}
            disabled={!isOpen}
            className="w-full py-4 rounded-2xl text-base font-black transition-all disabled:opacity-40"
            style={{ background: "#F5C518", color: "#0a0a0a" }}>
            {isOpen ? "Call It →" : "Market Closed"}
          </button>
        )}
      </div>

      {/* Mobile stake sheet */}
      {stakeSheet.open && (
        <MobileStakeSheet
          opinion={opinion}
          options={options}
          userCall={userCall}
          isOpen={isOpen}
          hasActivity={hasActivity}
          latestProbabilities={probabilities}
          countdown={countdown}
          onCall={handleCall}
          submitting={submitting}
          user={user}
          isLoggedIn={isLoggedIn}
          onClose={() => setStakeSheet({ open: false })}
        />
      )}
    </div>
  );
}
