import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Share2, Send, ThumbsUp, MessageCircle,
  Info, Bookmark, Users, ChevronLeft, CheckCircle2
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { useApp } from "@/context/AppContext";
import { DebatePanel } from "@/components/debate/DebatePanel";
import { SlidingNumber } from "@/components/ui/sliding-number";
import { useMarketTimeline } from "@/hooks/useMarketTimeline";
import { LiveSignalFeed } from "@/components/LiveSignalFeed";
import { TopArguments } from "@/components/TopArguments";
import { MobileStakeSheet } from "@/components/MobileStakeSheet";
import {
  LineChart, Line, ResponsiveContainer, YAxis,
  Tooltip, CartesianGrid
} from "recharts";

const optColor = (label: string, i: number): string => {
  const l = label.toLowerCase().trim();
  if (l === "yes" || l === "agree") return "#2563EB";
  if (l === "no" || l === "disagree") return "#DC2626";
  const multi = ["#F5C518", "#2563EB", "#DC2626", "#7C3AED", "#0891B2", "#059669"];
  return multi[i % multi.length];
};

const STAKE_OPTS = [10, 25, 50, 100, 250];
const COMMENT_TABS = ["Comments", "Positions", "Activity"] as const;

function formatTimeLeft(endTime: string): string {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

// ── Compact graph ─────────────────────────────────────────────
const CompactGraph = ({
  optionSeries, height = 130
}: { optionSeries: { label: string; color: string; data: any[] }[]; height?: number }) => {
  const hasData = optionSeries.some(s => s.data.length > 1);
  if (!hasData) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-border" style={{ height }}>
        <p className="text-xs text-muted-foreground text-center px-2">No activity yet · Graph appears after first stake</p>
      </div>
    );
  }
  const allTimes = Array.from(new Set(optionSeries.flatMap(s => s.data.map((d: any) => d.time))));
  const merged = allTimes.map(time => {
    const pt: Record<string, any> = { time };
    optionSeries.forEach(s => { const m = s.data.find((d: any) => d.time === time); pt[s.label] = m?.probability ?? null; });
    return pt;
  });
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={merged} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" strokeOpacity={0.3} vertical={false} />
        <YAxis domain={[0, 100]} hide />
        <Tooltip
          contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "11px", padding: "4px 8px" }}
          formatter={(v: number, name: string) => [`${v}%`, name]}
          labelStyle={{ display: "none" }}
        />
        {optionSeries.map(s => (
          <Line key={s.label} type="monotone" dataKey={s.label}
            stroke={s.color} strokeWidth={1.5} dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }} connectNulls isAnimationActive={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

// ── Sliding comments ──────────────────────────────────────────
const SlidingComments = ({ comments }: { comments: any[] }) => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (comments.length < 2) return;
    const t = setInterval(() => setIdx(i => (i + 1) % comments.length), 3500);
    return () => clearInterval(t);
  }, [comments.length]);
  if (!comments.length) return null;
  return (
    <div className="h-8 overflow-hidden relative">
      <AnimatePresence mode="wait">
        <motion.div key={idx}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
          className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-5 w-5 rounded-full bg-secondary border border-border flex items-center justify-center text-[9px] font-bold shrink-0">
            {comments[idx]?.profiles?.username?.[0]?.toUpperCase() || "?"}
          </div>
          <span className="font-medium text-foreground/60 shrink-0">@{comments[idx]?.profiles?.username || "anon"}:</span>
          <span className="truncate">{comments[idx]?.content}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ── Two-step stake panel (desktop) ────────────────────────────
const StakePanel = ({
  opinion, options, userCall, isOpen,
  hasActivity, latestProbabilities, countdown,
  onCall, submitting, user, isLoggedIn, navigate,
}: any) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<string | null>(userCall?.chosen_option || null);
  const [stakeAmount, setStakeAmount] = useState(50);
  const potentialReturn = stakeAmount * 2;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Step bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/20">
        {step === 2 && (
          <button onClick={() => setStep(1)} className="text-muted-foreground hover:text-foreground transition-colors mr-1">
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        <div className="flex items-center gap-1.5 flex-1">
          <div className={`h-1 rounded-full flex-1 transition-colors ${step >= 1 ? "bg-foreground" : "bg-border"}`} />
          <div className={`h-1 rounded-full flex-1 transition-colors ${step >= 2 ? "bg-foreground" : "bg-border"}`} />
        </div>
        <span className="text-[10px] text-muted-foreground font-medium ml-2">
          {step === 1 ? "Pick a side" : "Confirm stake"}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1"
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}
            className="p-4 space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Make Your Call</p>
            <p className="text-sm font-semibold text-foreground leading-snug line-clamp-3">{opinion.statement}</p>
            {userCall && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" />
                <span className="text-xs text-muted-foreground">Your call:</span>
                <span className="text-xs font-bold text-foreground">{userCall.chosen_option}</span>
              </div>
            )}
            <div className="space-y-1.5">
              {options.map((opt: string, i: number) => {
                const pct = hasActivity ? latestProbabilities[opt] : null;
                const color = optColor(opt, i);
                return (
                  <button key={opt}
                    onClick={() => isOpen && (setSelected(opt), setStep(2))}
                    disabled={!isOpen}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all hover:bg-secondary/40 disabled:opacity-60 ${userCall?.chosen_option === opt ? "border-2 bg-secondary/30" : "border-border/60 bg-secondary/10"
                      }`}
                    style={userCall?.chosen_option === opt ? { borderColor: color } : {}}>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
                      <span style={{ color }}>{opt}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold tabular-nums" style={{ color: pct !== null ? color : undefined }}>
                        {pct !== null ? `${pct}%` : "—"}
                      </span>
                      {isOpen && <span className="text-[10px] text-muted-foreground">→</span>}
                    </div>
                  </button>
                );
              })}
            </div>
            {!isLoggedIn && (
              <button onClick={() => navigate("/auth")}
                className="w-full py-2.5 rounded-xl border border-gold text-gold text-xs font-bold hover:bg-gold hover:text-primary-foreground transition-all">
                Log in to call
              </button>
            )}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2"
            initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.15 }}
            className="p-4 space-y-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/40 border border-border">
              <div className="h-2 w-2 rounded-full shrink-0"
                style={{ background: optColor(selected || "", options.indexOf(selected)) }} />
              <span className="text-sm font-semibold flex-1"
                style={{ color: optColor(selected || "", options.indexOf(selected)) }}>{selected}</span>
              {hasActivity && selected && (
                <span className="text-xs font-bold tabular-nums"
                  style={{ color: optColor(selected, options.indexOf(selected)) }}>
                  {latestProbabilities[selected]}%
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Stake</span>
                <span className="text-xs text-muted-foreground">
                  Balance: <span className="text-foreground font-semibold">{(user?.balance || 0).toLocaleString()}</span> coins
                </span>
              </div>
              <div className="flex gap-1.5 mb-2 flex-wrap">
                {STAKE_OPTS.map(s => (
                  <button key={s} onClick={() => setStakeAmount(s)}
                    className={`flex-1 min-w-[40px] py-2 rounded-lg text-xs font-bold transition-all border ${stakeAmount === s ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/30"
                      }`}>{s}</button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">🪙</span>
                <input type="number" value={stakeAmount}
                  onChange={e => setStakeAmount(Math.max(1, Math.min(user?.balance || 0, parseInt(e.target.value) || 0)))}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-border bg-secondary/30 text-sm font-bold text-foreground focus:outline-none focus:border-gold transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-secondary/40 rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">You stake</p>
                <p className="text-base font-bold text-foreground">{stakeAmount}c</p>
              </div>
              <div className="rounded-xl p-3 text-center border border-[#22C55E]/20 bg-[#22C55E]/5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">If correct</p>
                <p className="text-base font-bold text-[#22C55E]">+{potentialReturn}c</p>
              </div>
            </div>

            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => { if (!isLoggedIn) { toast.error("Log in!"); navigate("/auth"); return; } onCall(selected, stakeAmount); }}
              disabled={!selected || submitting || (user?.balance || 0) < stakeAmount}
              className="w-full py-4 rounded-xl bg-gold text-primary-foreground text-base font-black hover:bg-gold-hover transition-all disabled:opacity-40">
              {submitting ? "Placing..." : userCall ? "Update Call" : "Call It →"}
            </motion.button>
            <p className="text-[10px] text-muted-foreground text-center">
              {userCall ? "Updating is free" : `${stakeAmount} coins deducted on confirm`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats footer */}
      <div className="grid grid-cols-3 border-t border-border">
        {[
          { val: <SlidingNumber value={opinion.call_count || 0} />, label: "Callers" },
          { val: countdown || formatTimeLeft(opinion.end_time), label: "Time left", small: true },
          { val: opinion.follower_count || 0, label: "Watching" },
        ].map((s, i) => (
          <div key={i} className={`text-center py-3 ${i === 1 ? "border-x border-border" : ""}`}>
            <p className={`font-bold text-foreground ${s.small ? "text-xs leading-tight" : "text-sm"}`}>{s.val}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {opinion.source_name && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-border">
          <span className="text-[11px] text-muted-foreground">Source</span>
          {opinion.source_url
            ? <a href={opinion.source_url} target="_blank" rel="noopener noreferrer"
              className="text-[11px] text-gold hover:underline">{opinion.source_name} ↗</a>
            : <span className="text-[11px] text-muted-foreground">{opinion.source_name}</span>}
        </div>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────
const OpinionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn, setUser } = useApp();

  const [opinion, setOpinion] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [userCall, setUserCall] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentInput, setCommentInput] = useState("");
  const [activeCommentTab, setActiveCommentTab] = useState<typeof COMMENT_TABS[number]>("Comments");
  const [countdown, setCountdown] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  useEffect(() => { if (id) fetchOpinion(); }, [id]);

  useEffect(() => {
    if (!opinion?.end_time) return;
    const t = setInterval(() => setCountdown(formatTimeLeft(opinion.end_time)), 1000);
    setCountdown(formatTimeLeft(opinion.end_time));
    return () => clearInterval(t);
  }, [opinion?.end_time]);

  const fetchOpinion = async () => {
    setLoading(true);
    try {
      const { data: op, error } = await supabase
        .from("opinions")
        .select(`*, topics!opinions_topic_id_fkey(name, slug, icon, color), profiles(username, avatar_url)`)
        .eq("id", id).single();
      if (error || !op) { setLoading(false); return; }
      setOpinion(op);

      const { data: cd } = await supabase
        .from("comments").select("*, profiles(username, avatar_url)")
        .eq("opinion_id", id).order("created_at", { ascending: false }).limit(20);
      setComments(cd || []);

      if (isLoggedIn) {
        const { data: { user: au } } = await supabase.auth.getUser();
        if (au) {
          const { data: callData } = await supabase.from("calls").select("*")
            .eq("opinion_id", id).eq("user_id", au.id).single();
          setUserCall(callData || null);
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCall = async (selectedOption: string, stakeAmount: number) => {
    if (!isLoggedIn) { toast.error("Log in to call!"); navigate("/auth"); return; }
    if (!selectedOption || submitting) return;
    setSubmitting(true);
    try {
      const { data: { user: au } } = await supabase.auth.getUser();
      if (!au) throw new Error("Not logged in");
      const isUpdate = !!userCall;
      const { error } = await supabase.from("calls").upsert(
        { opinion_id: id, user_id: au.id, chosen_option: selectedOption },
        { onConflict: "opinion_id,user_id" }
      );
      if (error) throw error;
      if (!isUpdate) {
        const newBal = Math.max(0, (user.balance || 0) - stakeAmount);
        await supabase.from("profiles").update({ balance: newBal }).eq("id", au.id);
        setUser({ ...user, balance: newBal });
      }
      setUserCall({ chosen_option: selectedOption });
      toast.success(`✅ Called: ${selectedOption}${!isUpdate ? ` · ${stakeAmount} coins staked` : " updated"}`);
      const { data: ref } = await supabase
        .from("opinions").select(`*, topics(name, slug, icon, color), profiles(username, avatar_url)`)
        .eq("id", id).single();
      if (ref) setOpinion(ref);
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  const handleComment = async () => {
    if (!isLoggedIn) { toast.error("Log in to comment!"); return; }
    if (!commentInput.trim()) return;
    try {
      const { data: { user: au } } = await supabase.auth.getUser();
      if (!au) return;
      const { data } = await supabase.from("comments").insert({
        opinion_id: id, user_id: au.id, content: commentInput.trim(),
      }).select("*, profiles(username, avatar_url)").single();
      if (data) { setComments(p => [data, ...p]); setCommentInput(""); toast.success("Posted!"); }
    } catch (e: any) { toast.error(e.message); }
  };

  const marketOptions: string[] = Array.isArray(opinion?.options) ? opinion.options : ["Yes", "No"];
  const { hasActivity, optionSeries: marketSeries, latestProbabilities } = useMarketTimeline({
    opinionId: id, options: marketOptions, maxPoints: 30, enabled: !!opinion,
  });
  const coloredSeries = marketSeries.map((s, i) => ({ ...s, color: optColor(s.label, i) }));

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!opinion) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground mb-4">Opinion not found.</p>
        <button onClick={() => navigate("/")} className="text-gold font-semibold">Go home →</button>
      </div>
    </div>
  );

  const options = Array.isArray(opinion.options) ? opinion.options : ["Yes", "No"];
  const isOpen = opinion.status === "open";
  const isBinary = options.length === 2;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="px-4 md:px-10 pt-6 pb-32">
        <div className="flex gap-8 max-w-7xl mx-auto">

          {/* ══ LEFT ══ */}
          <div className="flex-[62] min-w-0 space-y-6">

            <button onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            {/* Question head block */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/20">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {opinion.topics?.icon} {opinion.topics?.name || "General"}
                </span>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOpen ? "bg-[#22C55E]/15 text-[#22C55E]" : "bg-muted text-muted-foreground"
                    }`}>{isOpen ? "● Open" : "Closed"}</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> {opinion.call_count || 0}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <h1 className="font-headline text-2xl sm:text-3xl text-foreground leading-tight">
                  {opinion.statement}
                </h1>

                {/* Two-col: options LEFT, graph RIGHT */}
                <div className="grid grid-cols-2 gap-4 items-stretch min-h-[140px]">
                  <div className="flex flex-col justify-center gap-1.5">
                    {isBinary ? (
                      options.map((opt: string, i: number) => {
                        const pct = hasActivity ? latestProbabilities[opt] : null;
                        const color = optColor(opt, i);
                        return (
                          <div key={opt} className="relative rounded-lg border border-border/50 overflow-hidden">
                            {hasActivity && (
                              <div className="absolute inset-y-0 left-0 transition-all duration-700 opacity-[0.08]"
                                style={{ width: `${pct ?? 0}%`, background: color }} />
                            )}
                            <div className="relative flex items-center justify-between px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
                                <span className="text-sm font-bold" style={{ color }}>{opt}</span>
                              </div>
                              <span className="text-sm font-bold tabular-nums"
                                style={{ color: pct !== null ? color : undefined }}>
                                {pct !== null ? `${pct}%` : "—"}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      options.map((opt: string, i: number) => {
                        const pct = hasActivity ? latestProbabilities[opt] : null;
                        const color = optColor(opt, i);
                        return (
                          <div key={opt} className="relative rounded-lg border border-border/50 overflow-hidden">
                            {hasActivity && (
                              <div className="absolute inset-y-0 left-0 transition-all duration-700 opacity-[0.07]"
                                style={{ width: `${pct ?? 0}%`, background: color }} />
                            )}
                            <div className="relative flex items-center justify-between px-2.5 py-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: color }} />
                                <span className="text-xs font-medium text-foreground truncate">{opt}</span>
                              </div>
                              <span className="text-xs font-bold tabular-nums shrink-0 ml-2"
                                style={{ color: pct !== null ? color : undefined }}>
                                {pct !== null ? `${pct}%` : "—"}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {hasActivity
                        ? `${opinion.call_count || 0} callers · ${countdown || formatTimeLeft(opinion.end_time)} left`
                        : `${countdown || formatTimeLeft(opinion.end_time)} left · No stakes yet`}
                    </p>
                  </div>
                  <div className="flex flex-col justify-center">
                    <CompactGraph optionSeries={coloredSeries} height={140} />
                  </div>
                </div>

                {/* Sliding comments — full width */}
                <div className="border-t border-border/40 pt-3">
                  <SlidingComments comments={comments} />
                </div>
              </div>
            </div>

            {/* Context */}
            {opinion.description && opinion.description.length > 15 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-bold text-foreground">About this Call</span>
                </div>
                <p className="text-sm text-foreground/75 leading-relaxed">{opinion.description}</p>
                {(opinion.source_name || opinion.source_url) && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">Source:</span>
                    {opinion.source_url
                      ? <a href={opinion.source_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-gold hover:underline">{opinion.source_name || "View"} ↗</a>
                      : <span className="text-xs text-muted-foreground">{opinion.source_name}</span>}
                  </div>
                )}
              </div>
            )}

            {/* Live signals */}
            <LiveSignalFeed opinionId={id} />

            {/* Arguments */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Arguments</h3>
              <TopArguments opinionId={id!} />
            </div>

            {/* Debate */}
            <div className="rounded-2xl border border-border bg-card p-5" id="debate">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Take a Stand</h3>
              <DebatePanel opinionId={id!} opinionStatement={opinion.statement} defaultExpanded={true} />
            </div>

            {/* Comments */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex border-b border-border">
                {COMMENT_TABS.map(tab => (
                  <button key={tab} onClick={() => setActiveCommentTab(tab)}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeCommentTab === tab
                        ? "border-foreground text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}>
                    {tab === "Comments" ? `Comments (${comments.length})` : tab}
                  </button>
                ))}
              </div>
              <div className="p-5">
                {activeCommentTab === "Comments" && (
                  <>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                        {user?.initials || "?"}
                      </div>
                      <input value={commentInput}
                        onChange={e => setCommentInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleComment()}
                        placeholder={isLoggedIn ? "Drop your take..." : "Log in to comment"}
                        disabled={!isLoggedIn}
                        className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold transition-colors disabled:opacity-50"
                      />
                      <button onClick={handleComment} disabled={!isLoggedIn}
                        className="h-9 w-9 rounded-lg bg-gold flex items-center justify-center hover:bg-gold-hover transition-colors shrink-0 disabled:opacity-50">
                        <Send className="h-3.5 w-3.5 text-primary-foreground" />
                      </button>
                    </div>
                    {comments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">No comments yet — be the first!</p>
                    ) : (
                      <div className="space-y-3">
                        {comments.map((c, i) => (
                          <div key={i} className="flex items-start gap-3 py-3 border-b border-border/40 last:border-0">
                            <div className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0 mt-0.5">
                              {c.profiles?.username?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-foreground">@{c.profiles?.username || "anon"}</span>
                                <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                              </div>
                              <p className="text-sm text-foreground/80 leading-relaxed">{c.content}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <button className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-[11px]">
                                  <ThumbsUp className="h-3 w-3" /> Like
                                </button>
                                <button className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-[11px]">
                                  <MessageCircle className="h-3 w-3" /> Reply
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {activeCommentTab === "Positions" && (
                  <div className="space-y-2">
                    {options.map((opt: string, i: number) => {
                      const pct = hasActivity ? latestProbabilities[opt] : 0;
                      const color = optColor(opt, i);
                      return (
                        <div key={i} className="rounded-xl bg-secondary/40 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                              <span className="text-sm font-bold" style={{ color }}>{opt}</span>
                            </div>
                            <span className="text-sm font-bold tabular-nums" style={{ color }}>
                              {hasActivity ? `${pct}%` : "—"}
                            </span>
                          </div>
                          {hasActivity && (
                            <div className="h-1 rounded-full bg-border overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${pct}%`, background: color }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {activeCommentTab === "Activity" && <LiveSignalFeed opinionId={id} />}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
                className="rounded-xl border border-border text-muted-foreground text-sm font-semibold py-2.5 px-5 flex items-center gap-2 hover:border-foreground hover:text-foreground transition-all">
                <Share2 className="h-4 w-4" /> Share
              </button>
              <button onClick={() => toast.success("Saved!")}
                className="rounded-xl border border-border text-muted-foreground text-sm font-semibold py-2.5 px-5 flex items-center gap-2 hover:border-foreground hover:text-foreground transition-all">
                <Bookmark className="h-4 w-4" /> Save
              </button>
            </div>
          </div>

          {/* ══ RIGHT — desktop stake panel ══ */}
          <div className="hidden lg:block flex-[38] min-w-[300px] max-w-[360px]">
            <div className="sticky top-24">
              <StakePanel
                opinion={opinion} options={options} userCall={userCall}
                isOpen={isOpen} hasActivity={hasActivity}
                latestProbabilities={latestProbabilities} countdown={countdown}
                onCall={handleCall} submitting={submitting}
                user={user} isLoggedIn={isLoggedIn} navigate={navigate}
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── Mobile floating CTA ── */}
      {isOpen && (
        <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50">
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => setMobileSheetOpen(true)}
            className="w-full py-4 rounded-2xl bg-gold text-primary-foreground text-base font-black shadow-2xl">
            {userCall ? `Your call: ${userCall.chosen_option} — Update` : "Call It →"}
          </motion.button>
        </div>
      )}

      {/* ── Mobile stake sheet ── */}
      {mobileSheetOpen && (
        <MobileStakeSheet
          opinion={opinion} options={options} userCall={userCall}
          isOpen={isOpen} hasActivity={hasActivity}
          latestProbabilities={latestProbabilities} countdown={countdown}
          onCall={handleCall} submitting={submitting}
          user={user} isLoggedIn={isLoggedIn}
          onClose={() => setMobileSheetOpen(false)}
        />
      )}
    </div>
  );
};

export default OpinionDetail;