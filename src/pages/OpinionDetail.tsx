import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Share2, Send, ThumbsUp, MessageCircle, Info, Bookmark } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { useApp } from "@/context/AppContext";
import { SlidingNumber } from "@/components/ui/sliding-number";

const TIME_FILTERS = ["1H", "6H", "1D", "1W", "1M", "ALL"] as const;
const COMMENT_TABS = ["Comments", "Top Callers", "Positions", "Activity"] as const;
const CHART_W = 800;
const CHART_H = 220;
const CHART_PAD = 32;
const OPTION_HEX = ["#F5C518", "#22C55E", "#EF4444", "#A855F7", "#8B5CF6"];

function formatTimeLeft(endTime: string): string {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function generateChartData(percent: number, seed: number, points = 30) {
  const data: { x: number; y: number }[] = [];
  let val = 40 + (seed % 20);
  for (let i = 0; i < points; i++) {
    const noise = Math.sin(seed * 13.37 + i * 2.1) * 8 + Math.cos(seed * 7.53 + i * 3.7) * 5;
    val = val + (percent - val) * 0.15 + noise * (1 - (i / points) * 0.7);
    val = Math.max(2, Math.min(98, val));
    if (i === points - 1) val = percent;
    data.push({ x: i, y: Math.round(val * 10) / 10 });
  }
  return data;
}

function dataToSmoothPath(data: { x: number; y: number }[], w: number, h: number, pad: number): string {
  if (data.length < 2) return "";
  const xs = (i: number) => pad + (i / (data.length - 1)) * (w - pad * 2);
  const ys = (v: number) => h - pad - (v / 100) * (h - pad * 2);
  let path = `M ${xs(0)} ${ys(data[0].y)}`;
  for (let i = 1; i < data.length; i++) {
    const cp1x = xs(i - 1) + (xs(i) - xs(i - 1)) * 0.4;
    const cp2x = xs(i) - (xs(i) - xs(i - 1)) * 0.4;
    path += ` C ${cp1x} ${ys(data[i - 1].y)}, ${cp2x} ${ys(data[i].y)}, ${xs(i)} ${ys(data[i].y)}`;
  }
  return path;
}

function dataToAreaPath(data: { x: number; y: number }[], w: number, h: number, pad: number): string {
  const line = dataToSmoothPath(data, w, h, pad);
  const xs = (i: number) => pad + (i / (data.length - 1)) * (w - pad * 2);
  return `${line} L ${xs(data.length - 1)} ${h - pad} L ${xs(0)} ${h - pad} Z`;
}

function getValueAtX(data: { x: number; y: number }[], xPos: number, w: number, pad: number): number {
  const idx = ((xPos - pad) / (w - pad * 2)) * (data.length - 1);
  const i = Math.max(0, Math.min(data.length - 2, Math.floor(idx)));
  const t = idx - i;
  return Math.round((data[i].y * (1 - t) + data[i + 1].y * t) * 10) / 10;
}

function generateDateLabels(count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.now() - (count - 1 - i) * 86400000);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });
}

const OpinionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useApp();

  const [opinion, setOpinion] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [userCall, setUserCall] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentInput, setCommentInput] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [activeTimeFilter, setActiveTimeFilter] = useState<typeof TIME_FILTERS[number]>("1W");
  const [activeCommentTab, setActiveCommentTab] = useState<typeof COMMENT_TABS[number]>("Comments");
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [countdown, setCountdown] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const chartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (id) fetchOpinion();
  }, [id]);

  useEffect(() => {
    if (!opinion?.end_time) return;
    const timer = setInterval(() => {
      setCountdown(formatTimeLeft(opinion.end_time));
    }, 1000);
    setCountdown(formatTimeLeft(opinion.end_time));
    return () => clearInterval(timer);
  }, [opinion?.end_time]);

  const fetchOpinion = async () => {
    setLoading(true);
    try {
      const { data: op, error } = await supabase
        .from("opinions")
        .select(`*, topics(name, slug, icon, color), profiles(username, avatar_url)`)
        .eq("id", id)
        .single();

      if (error || !op) { setLoading(false); return; }
      setOpinion(op);

      if (Array.isArray(op.options) && op.options.length > 0) {
        setSelectedOption(op.options[0]);
      }

      const { data: commentsData } = await supabase
        .from("comments")
        .select("*, profiles(username, avatar_url)")
        .eq("opinion_id", id)
        .order("created_at", { ascending: false })
        .limit(20);
      setComments(commentsData || []);

      if (isLoggedIn) {
        const { data: callData } = await supabase
          .from("calls").select("*")
          .eq("opinion_id", id)
          .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
          .single();
        setUserCall(callData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = async () => {
    if (!isLoggedIn) { toast.error("Log in to make a call!"); navigate("/auth"); return; }
    if (!selectedOption) { toast.error("Pick an option first"); return; }
    setSubmitting(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Not logged in");

      const { error } = await supabase.from("calls").upsert({
        opinion_id: id,
        user_id: authUser.id,
        chosen_option: selectedOption,
      }, { onConflict: "opinion_id,user_id" });

      if (error) throw error;

      await supabase.from("opinions")
        .update({ call_count: (opinion.call_count || 0) + 1 })
        .eq("id", id);

      setUserCall({ chosen_option: selectedOption });
      toast.success(`Called: ${selectedOption}`);
      fetchOpinion();
    } catch (e: any) {
      toast.error(e.message || "Failed to place call");
    } finally {
      setSubmitting(false);
    }
  };

  const handleComment = async () => {
    if (!isLoggedIn) { toast.error("Log in to comment!"); return; }
    if (!commentInput.trim()) return;
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data } = await supabase.from("comments").insert({
        opinion_id: id,
        user_id: authUser.id,
        content: commentInput.trim(),
      }).select("*, profiles(username, avatar_url)").single();

      if (data) {
        setComments(prev => [data, ...prev]);
        setCommentInput("");
        toast.success("Comment posted!");
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!");
  };

  const handleChartMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CHART_W;
    setHoverX(Math.max(CHART_PAD, Math.min(CHART_W - CHART_PAD, x)));
  }, []);

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

  const options: string[] = Array.isArray(opinion.options) ? opinion.options : ["Yes", "No"];
  const isOpen = opinion.status === "open";
  const optionCount = options.length;
  const basePercent = Math.round(100 / optionCount);
  const dateLabels = generateDateLabels(7);
  const allChartData = options.map((_, i) => generateChartData(basePercent + (i * 7 % 20) - 10, i * 17 + 42, 30));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="px-4 md:px-12 pt-8 pb-24">
        <div className="flex gap-10 max-w-7xl mx-auto">

          {/* LEFT COLUMN */}
          <div className="flex-[65] min-w-0">

            <div className="flex items-center gap-2 mb-5">
              <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-gold transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-muted-foreground">
                Feed › {opinion.topics?.name || "General"} › Opinion
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className="rounded-full bg-gold/10 px-3.5 py-1 text-xs font-semibold text-gold">
                {opinion.topics?.icon} {opinion.topics?.name || "General"}
              </span>
              {opinion.ai_generated && (
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">AI Generated</span>
              )}
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${isOpen ? "bg-yes/15 text-yes" : "bg-muted text-muted-foreground"}`}>
                {isOpen ? "Open" : "Closed"}
              </span>
            </div>

            <h1 className="font-headline text-3xl sm:text-4xl text-foreground leading-tight mb-4">
              {opinion.statement}
            </h1>

            {opinion.description && (
              <div className="flex items-start gap-2 mb-4">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">{opinion.description}</p>
              </div>
            )}

            {opinion.profiles && (
              <Link to={`/user/${opinion.profiles.username}`} className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity mb-8">
                <div className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                  {opinion.profiles.username?.[0]?.toUpperCase() || "C"}
                </div>
                <span className="text-sm text-muted-foreground">@{opinion.profiles.username}</span>
              </Link>
            )}

            {/* CHART */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
              <div className="flex items-center gap-5 flex-wrap mb-4">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: OPTION_HEX[i % OPTION_HEX.length] }} />
                    <span className="text-sm text-foreground">{opt}</span>
                    <div className="text-sm font-semibold flex items-center" style={{ color: OPTION_HEX[i % OPTION_HEX.length] }}>
                      <SlidingNumber value={basePercent} /><span>%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="w-full relative rounded-xl bg-card border border-border" style={{ height: CHART_H + 40 }}>
                <svg
                  ref={chartRef}
                  viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                  className="w-full"
                  style={{ height: CHART_H }}
                  preserveAspectRatio="none"
                  onMouseMove={handleChartMouseMove}
                  onMouseLeave={() => setHoverX(null)}
                >
                  {[0, 25, 50, 75, 100].map(v => {
                    const y = CHART_H - CHART_PAD - (v / 100) * (CHART_H - CHART_PAD * 2);
                    return <line key={v} x1={CHART_PAD} y1={y} x2={CHART_W - CHART_PAD} y2={y} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4 4" />;
                  })}

                  {allChartData.map((chartData, i) => (
                    <g key={i}>
                      <path d={dataToAreaPath(chartData, CHART_W, CHART_H, CHART_PAD)} fill={OPTION_HEX[i % OPTION_HEX.length]} opacity={0.08} />
                      <motion.path
                        d={dataToSmoothPath(chartData, CHART_W, CHART_H, CHART_PAD)}
                        fill="none"
                        stroke={OPTION_HEX[i % OPTION_HEX.length]}
                        strokeWidth="2.5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                      />
                    </g>
                  ))}

                  {hoverX !== null && (
                    <line x1={hoverX} y1={CHART_PAD} x2={hoverX} y2={CHART_H - CHART_PAD}
                      stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeDasharray="4 3" opacity={0.5} />
                  )}
                </svg>

                <div className="absolute right-3 top-0 flex flex-col justify-between py-[32px] pointer-events-none" style={{ height: CHART_H }}>
                  {[100, 75, 50, 25, 0].map(v => (
                    <span key={v} className="text-[11px] text-muted-foreground">{v}%</span>
                  ))}
                </div>

                <AnimatePresence>
                  {hoverX !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="absolute top-2 rounded-lg border border-border bg-card px-3 py-2.5 pointer-events-none z-10"
                      style={{ left: Math.min(hoverX / CHART_W * 100, 70) + "%", minWidth: 140 }}
                    >
                      {allChartData.map((chartData, i) => (
                        <div key={i} className="flex items-center gap-2 mb-0.5">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: OPTION_HEX[i % OPTION_HEX.length] }} />
                          <span className="text-xs text-foreground">{options[i]}</span>
                          <span className="text-xs font-bold ml-auto" style={{ color: OPTION_HEX[i % OPTION_HEX.length] }}>
                            {getValueAtX(chartData, hoverX, CHART_W, CHART_PAD)}%
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-between px-8 pt-2">
                  {dateLabels.map((label, i) => (
                    <span key={i} className="text-[11px] text-muted-foreground">{label}</span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1 mt-4">
                {TIME_FILTERS.map(tf => (
                  <button key={tf} onClick={() => setActiveTimeFilter(tf)}
                    className={`px-3 py-1.5 text-[13px] font-medium rounded transition-all ${activeTimeFilter === tf ? "text-gold border-b-2 border-gold" : "text-muted-foreground hover:text-foreground"
                      }`}>{tf}</button>
                ))}
              </div>
            </motion.div>

            {/* OPTIONS LIST */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mb-10">
              <div className="divide-y divide-border">
                {options.map((opt, i) => (
                  <div key={i} onClick={() => setSelectedOption(opt)}
                    className={`flex items-center gap-5 py-5 cursor-pointer transition-colors hover:bg-secondary/40 px-2 -mx-2 rounded-lg ${selectedOption === opt ? "bg-secondary/30" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-foreground">{opt}</p>
                      <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                        <SlidingNumber value={opinion.call_count || 0} /> callers
                      </p>
                    </div>
                    <div className="text-2xl font-bold flex items-center" style={{ color: OPTION_HEX[i % OPTION_HEX.length] }}>
                      <SlidingNumber value={basePercent} /><span>%</span>
                    </div>
                    {isOpen && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedOption(opt); }}
                        className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-all ${selectedOption === opt
                            ? "bg-gold text-primary-foreground"
                            : "border border-border text-muted-foreground hover:border-gold hover:text-gold"
                          }`}>
                        {selectedOption === opt ? "Selected" : "Pick"}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-8 mt-5 flex-wrap">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <SlidingNumber value={opinion.call_count || 0} /> callers
                </span>
                <span className="text-sm text-muted-foreground">Ends {countdown || formatTimeLeft(opinion.end_time)}</span>
                {opinion.source_url && (
                  <a href={opinion.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-gold hover:underline">
                    View source →
                  </a>
                )}
              </div>
            </motion.div>

            {/* COMMENTS */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-10">
              <h3 className="font-headline text-2xl mb-5">The Conversation</h3>

              <div className="flex items-center gap-6 border-b border-border mb-6">
                {COMMENT_TABS.map(tab => (
                  <button key={tab} onClick={() => setActiveCommentTab(tab)}
                    className={`pb-3 text-sm font-semibold transition-colors relative ${activeCommentTab === tab ? "text-gold" : "text-muted-foreground hover:text-foreground"
                      }`}>
                    {tab === "Comments" ? `Comments (${comments.length})` : tab}
                    {activeCommentTab === tab && (
                      <motion.div layoutId="commentTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {activeCommentTab === "Comments" && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                      {user?.initials || "?"}
                    </div>
                    <input value={commentInput} onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleComment()}
                      placeholder={isLoggedIn ? "Drop your take..." : "Log in to comment"}
                      disabled={!isLoggedIn}
                      className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors disabled:opacity-50"
                    />
                    <button onClick={handleComment} disabled={!isLoggedIn}
                      className="h-10 w-10 rounded-lg bg-gold flex items-center justify-center hover:bg-gold-hover transition-colors shrink-0 disabled:opacity-50">
                      <Send className="h-4 w-4 text-primary-foreground" />
                    </button>
                  </div>

                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No comments yet — be the first!</p>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((c, i) => (
                        <div key={i} className="rounded-xl bg-secondary p-5 border-l-2 border-gold">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                              {c.profiles?.username?.[0]?.toUpperCase() || "?"}
                            </div>
                            <span className="text-sm font-semibold text-foreground">@{c.profiles?.username || "anon"}</span>
                            <span className="text-xs text-muted-foreground">· {new Date(c.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-foreground mb-3">{c.content}</p>
                          <div className="flex items-center gap-4">
                            <button className="text-muted-foreground hover:text-gold transition-colors flex items-center gap-1 text-xs">
                              <ThumbsUp className="h-3.5 w-3.5" /> Like
                            </button>
                            <button className="text-muted-foreground hover:text-gold transition-colors flex items-center gap-1 text-xs">
                              <MessageCircle className="h-3.5 w-3.5" /> Reply
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeCommentTab === "Positions" && (
                <div className="space-y-4">
                  {options.map((opt, i) => (
                    <div key={i} className="rounded-xl bg-secondary p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: OPTION_HEX[i % OPTION_HEX.length] }} />
                        <span className="text-sm font-semibold text-foreground">{opt}</span>
                        <div className="text-sm font-bold ml-auto flex items-center" style={{ color: OPTION_HEX[i % OPTION_HEX.length] }}>
                          <SlidingNumber value={basePercent} /><span>%</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <SlidingNumber value={opinion.call_count || 0} /> callers total
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <div className="flex items-center gap-3">
              <button onClick={handleShare}
                className="rounded-xl border border-gold text-gold text-sm font-semibold py-3 px-6 flex items-center gap-2 hover:bg-gold hover:text-primary-foreground transition-all">
                <Share2 className="h-4 w-4" /> Share
              </button>
              <button onClick={() => toast.success("Saved!")}
                className="rounded-xl border border-border text-muted-foreground text-sm font-semibold py-3 px-6 flex items-center gap-2 hover:border-gold hover:text-gold transition-all">
                <Bookmark className="h-4 w-4" /> Save
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="hidden lg:block flex-[35] min-w-[320px]">
            <div className="sticky top-24">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                className="rounded-2xl border border-gold/30 bg-card p-6">
                <h3 className="font-headline text-xl mb-2 text-foreground">Make Your Call</h3>
                <p className="text-sm text-muted-foreground mb-5 line-clamp-2">{opinion.statement}</p>

                {userCall && (
                  <div className="mb-4 p-3 rounded-xl bg-gold/10 border border-gold/30">
                    <p className="text-xs text-muted-foreground mb-0.5">Your call</p>
                    <p className="text-sm font-bold text-gold">{userCall.chosen_option}</p>
                  </div>
                )}

                <div className="flex flex-col gap-2 mb-5">
                  {options.map((opt, i) => (
                    <button key={i} onClick={() => setSelectedOption(opt)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${selectedOption === opt
                          ? "border-gold bg-gold/10 text-foreground"
                          : "border-border bg-secondary text-muted-foreground hover:border-gold/50 hover:text-foreground"
                        }`}>
                      <span>{opt}</span>
                      <div className="flex items-center" style={{ color: OPTION_HEX[i % OPTION_HEX.length] }}>
                        <SlidingNumber value={basePercent} /><span>%</span>
                      </div>
                    </button>
                  ))}
                </div>

                {isOpen ? (
                  <>
                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                      disabled={!selectedOption || submitting}
                      onClick={handleCall}
                      className="w-full rounded-xl bg-gold py-4 text-base font-semibold text-primary-foreground hover:bg-gold-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed animate-gold-pulse">
                      {submitting ? "Placing call..." : userCall ? "Update Call" : "Confirm Call"}
                    </motion.button>
                    {!isLoggedIn && (
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        <button onClick={() => navigate("/auth")} className="text-gold hover:underline">Log in</button> to make a call
                      </p>
                    )}
                  </>
                ) : (
                  <div className="rounded-xl bg-muted py-3 text-center text-sm font-medium text-muted-foreground">
                    {opinion.winning_option ? `${opinion.winning_option} Won` : "Opinion Closed"}
                  </div>
                )}

                <div className="mt-5 pt-5 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Time remaining</p>
                  <p className="text-base font-bold text-foreground">{countdown || formatTimeLeft(opinion.end_time)}</p>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <SlidingNumber value={opinion.call_count || 0} /> people have called
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