// src/pages/Index.tsx  ── FINAL
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import OpinionCard from "@/components/OpinionCard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { MobileStakeSheet } from "@/components/MobileStakeSheet";
import { QuestionIcon } from "@/components/QuestionIcon";
import { Zap, ChevronLeft, ChevronRight, Timer, Users, Plus, TrendingUp, Swords, Radio } from "lucide-react";
import { supabase } from "@/supabaseClient";
import { useApp } from "@/context/AppContext";

const SORT_OPTIONS = ["Trending", "Newest", "Most Called", "Ending Soon"];
const TOPIC_PILLS = [
  { label: "All", slug: null }, { label: "Kenya", slug: "politics-kenya" }, { label: "KPL", slug: "kpl" },
  { label: "Bitcoin", slug: "crypto-bitcoin" }, { label: "Ethereum", slug: "crypto-ethereum" },
  { label: "AI", slug: "tech-ai" }, { label: "EPL", slug: "epl" }, { label: "UCL", slug: "ucl" },
  { label: "NBA", slug: "nba" }, { label: "Elections", slug: "politics-elections" },
  { label: "Economy", slug: "business-kenya" }, { label: "Stocks", slug: "business-stocks" },
  { label: "Conflict", slug: "world-conflict" }, { label: "Ruto", slug: "ruto-presidency" },
  { label: "La Liga", slug: "la-liga" }, { label: "Bundesliga", slug: "bundesliga" },
  { label: "Serie A", slug: "serie-a" }, { label: "NFL", slug: "nfl" },
  { label: "Solana", slug: "crypto-solana" }, { label: "Altcoins", slug: "crypto-altcoins" },
  { label: "Music", slug: "entertainment-music" }, { label: "Film & TV", slug: "entertainment-film" },
  { label: "Climate", slug: "world-climate" }, { label: "Startups", slug: "tech-startups" },
  { label: "Social Media", slug: "tech-social" }, { label: "Space", slug: "tech-space" },
  { label: "DeFi", slug: "crypto-defi" }, { label: "Africa", slug: "world-africa" },
  { label: "USA", slug: "politics-usa" }, { label: "Middle East", slug: "politics-middle-east" },
  { label: "AFCON", slug: "afcon" }, { label: "World Cup", slug: "world-cup" },
  { label: "Parliament", slug: "kenya-parliament" }, { label: "Fuel", slug: "kenya-fuel" },
];

const isYNLabel = (l: string) => ["yes", "no", "agree", "disagree"].includes(l.toLowerCase().trim());
const isPureYN = (opts: string[]) => opts.length > 0 && opts.every(o => isYNLabel(o));
const optColor = (label: string, i: number): string => {
  const l = label.toLowerCase().trim();
  if (l === "yes" || l === "agree") return "#2563EB";
  if (l === "no" || l === "disagree") return "#DC2626";
  return ["#7C3AED", "#0891B2", "#059669", "#EA580C", "#F59E0B", "#EC4899"][i % 6];
};

// ── FeaturedCard ──────────────────────────────────────────────
const FeaturedCard = ({ opinion, onClick, onStakeTap }: {
  opinion: any;
  onClick: () => void;
  onStakeTap: (opt: string, stance?: "yes" | "no") => void;
}) => {
  const options: string[] = Array.isArray(opinion.options) ? opinion.options : ["Yes", "No"];
  const pureYN = isPureYN(options);
  const basePercent = Math.round(100 / options.length);
  const timeLeft = opinion.end_time
    ? new Date(opinion.end_time) > new Date()
      ? `${Math.ceil((new Date(opinion.end_time).getTime() - Date.now()) / 86400000)}d left`
      : "Ended"
    : "30d left";
  const isBreaking = (opinion.rising_score || 0) > 5 ||
    (opinion.created_at && Date.now() - new Date(opinion.created_at).getTime() < 21600000);

  return (
    <motion.div className="w-full cursor-pointer" onClick={onClick}
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.28 }}>
      <div className="bg-card border border-border rounded-2xl overflow-hidden hover:brightness-[1.03] transition-all">
        <div className="p-4 pb-3">
          <div className="flex items-start gap-3">
            <QuestionIcon iconUrl={opinion.icon_url} statement={opinion.statement} size={52} className="shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                {opinion.topics?.icon && <span className="text-xs">{opinion.topics.icon}</span>}
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {opinion.topics?.name || "General"}
                </span>
                {isBreaking && (
                  <span className="flex items-center gap-1 text-[9px] font-bold text-[#DC2626] bg-[#DC2626]/10 border border-[#DC2626]/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    <Radio className="h-2 w-2" /> Breaking
                  </span>
                )}
                <span className="text-[9px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">Featured</span>
              </div>
              <h2 className="text-[15px] font-bold text-foreground leading-snug line-clamp-3">{opinion.statement}</h2>
              {opinion.profiles?.username && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  by <span className="text-foreground/70 font-semibold">@{opinion.profiles.username}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Options — always vertical */}
        <div className="px-4 pb-4 space-y-2" onClick={e => e.stopPropagation()}>
          {pureYN ? (
            options.map((opt, i) => {
              const color = optColor(opt, i);
              return (
                <button key={opt} onClick={e => { e.stopPropagation(); onStakeTap(opt); }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all relative overflow-hidden group"
                  style={{ borderColor: color + "50", background: color + "0D" }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
                    style={{ background: `linear-gradient(135deg,${color}20 0%,${color}08 100%)` }} />
                  <div className="flex items-center gap-2.5 relative z-10">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                    <span className="text-sm font-bold" style={{ color }}>{opt}</span>
                  </div>
                  <span className="text-sm font-bold tabular-nums relative z-10" style={{ color }}>{basePercent}%</span>
                </button>
              );
            })
          ) : (
            options.slice(0, 6).map((opt, i) => {
              const color = optColor(opt, i);
              return (
                <div key={opt} className="rounded-xl border overflow-hidden" style={{ borderColor: color + "30" }}>
                  <div className="flex items-center gap-2 px-3 py-2" style={{ background: color + "0D" }}>
                    <div className="h-2 w-2 rounded-full" style={{ background: color }} />
                    <span className="text-sm font-bold flex-1" style={{ color }}>{opt}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{basePercent}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-px bg-border/20">
                    <button onClick={e => { e.stopPropagation(); onStakeTap(opt, "yes"); }}
                      className="flex items-center justify-center gap-1.5 py-2.5 bg-card hover:bg-[#2563EB]/08 transition-colors">
                      <div className="h-2 w-2 rounded-full bg-[#2563EB]" />
                      <span className="text-xs font-bold text-[#2563EB]">Yes</span>
                    </button>
                    <button onClick={e => { e.stopPropagation(); onStakeTap(opt, "no"); }}
                      className="flex items-center justify-center gap-1.5 py-2.5 bg-card hover:bg-[#DC2626]/08 transition-colors">
                      <div className="h-2 w-2 rounded-full bg-[#DC2626]" />
                      <span className="text-xs font-bold text-[#DC2626]">No</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
          <span className="text-[10px] text-muted-foreground flex items-center gap-2">
            <Users className="h-3 w-3" />{opinion.call_count || 0} callers
            <span className="opacity-40">·</span>
            <Timer className="h-3 w-3" />{timeLeft}
          </span>
          <span className="text-[10px] font-bold text-foreground/50">View details →</span>
        </div>
      </div>
    </motion.div>
  );
};

// ── TopicFilterBar ────────────────────────────────────────────
const TopicFilterBar = ({ active, onChange }: { active: string | null; onChange: (s: string | null) => void }) => (
  <div className="-mx-4 sm:-mx-6 mb-5">
    <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2.5 border-y border-border bg-background" style={{ scrollbarWidth: "none" }}>
      {TOPIC_PILLS.map(p => (
        <button key={p.slug ?? "all"} onClick={() => onChange(p.slug)}
          className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${active === p.slug ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
          {p.label}
        </button>
      ))}
    </div>
  </div>
);

// ── FeaturedTabs ──────────────────────────────────────────────
const FeaturedTabs = () => {
  const [tab, setTab] = useState<"debates" | "activity">("debates");
  const [debates, setDebates] = useState<any[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    if (tab !== "debates") return;
    supabase.from("debates").select("*, opinions(statement)").order("created_at", { ascending: false }).limit(5)
      .then(({ data }) => setDebates(data || []));
  }, [tab]);
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex border-b border-border">
        {(["debates", "activity"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors border-b-2 ${tab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t === "debates" ? <Swords className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === "debates" && (
        <div className="divide-y divide-border/50">
          {debates.length === 0 ? (
            <div className="p-6 text-center">
              <Swords className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">No active debates yet</p>
              <p className="text-xs text-muted-foreground mt-1">Challenge someone's stance to start one</p>
            </div>
          ) : debates.map((d, i) => (
            <motion.button key={d.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/opinion/${d.opinion_id}`)}
              className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-secondary/40 transition-colors text-left">
              <div className="h-7 w-7 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Swords className="h-3.5 w-3.5 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground font-semibold line-clamp-1">{d.opinions?.statement?.slice(0, 55)}...</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-[#22C55E] font-semibold">{d.challenger_alias}</span>
                  <span className="text-[10px] text-muted-foreground">vs</span>
                  <span className="text-[10px] text-[#DC2626] font-semibold">{d.defender_alias}</span>
                  <span className="text-[10px] text-foreground/50 ml-auto">{d.challenger_votes + d.defender_votes} votes</span>
                </div>
                <div className="mt-1.5 h-1 rounded-full bg-[#DC2626]/20 overflow-hidden">
                  <div className="h-full bg-[#22C55E] rounded-full transition-all"
                    style={{ width: `${(d.challenger_votes + d.defender_votes) > 0 ? Math.round((d.challenger_votes / (d.challenger_votes + d.defender_votes)) * 100) : 50}%` }} />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
      {tab === "activity" && <ActivityFeed />}
    </div>
  );
};

// ── Main Index ────────────────────────────────────────────────
const Index = () => {
  const navigate = useNavigate();
  const { hasSeenHero, setHasSeenHero, isLoggedIn, user } = useApp();
  const [opinions, setOpinions] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [breaking, setBreaking] = useState<any[]>([]);
  const [rising, setRising] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [activeSort, setActiveSort] = useState("Trending");
  const [page, setPage] = useState(0);
  const [stakeSheet, setStakeSheet] = useState<{ open: boolean; option?: string; stance?: "yes" | "no" }>({ open: false });
  const PAGE_SIZE = 6;

  useEffect(() => { if (hasSeenHero) { fetchData(); fetchRising(); } }, [hasSeenHero, activeTopic, activeSort, page]);
  useEffect(() => {
    if (featured.length < 2) return;
    const t = setInterval(() => setFeaturedIndex(i => (i + 1) % featured.length), 5000);
    return () => clearInterval(t);
  }, [featured.length]);

  const fetchRising = async () => {
    const { data } = await supabase.from("opinions")
      .select("id, statement, call_count, rising_score, topics!opinions_topic_id_fkey(name, icon)")
      .eq("status", "open").order("rising_score", { ascending: false }).limit(4);
    setRising(data || []);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase.from("opinions")
        .select("id, statement, status, options, end_time, call_count, rising_score, follower_count, created_at, icon_url, topics!opinions_topic_id_fkey(name, slug, icon, color), profiles(username, reputation_score)")
        .eq("status", "open").range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (activeTopic) {
        const { data: topicRow } = await supabase.from("topics").select("id").eq("slug", activeTopic).maybeSingle();
        if (topicRow?.id) query = query.eq("topic_id", topicRow.id);
      }
      if (activeSort === "Newest") query = query.order("created_at", { ascending: false });
      else if (activeSort === "Most Called") query = query.order("call_count", { ascending: false });
      else if (activeSort === "Ending Soon") query = query.order("end_time", { ascending: true });
      else query = query.order("call_count", { ascending: false });
      const { data } = await query;
      if (data) {
        if (page === 0) { setFeatured(data.slice(0, 12)); setOpinions(data.slice(12)); }
        else { setOpinions(prev => [...prev, ...data]); }
      }
      const { data: bd } = await supabase.from("opinions")
        .select("id, statement, call_count, created_at, topics!opinions_topic_id_fkey(name, icon)")
        .eq("status", "open").order("created_at", { ascending: false }).limit(8);
      if (bd) setBreaking(bd);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const mapToCard = (op: any) => ({
    id: op.id, question: op.statement, yesPercent: 50, noPercent: 50,
    coins: op.call_count || 0,
    timeLeft: op.end_time ? new Date(op.end_time) > new Date() ? `${Math.ceil((new Date(op.end_time).getTime() - Date.now()) / 86400000)}d left` : "Ended" : "30d left",
    genre: op.topics?.name || "General", topicIcon: op.topics?.icon, topicColor: op.topics?.color,
    topicSlug: op.topics?.slug || null, iconUrl: op.icon_url || null, status: op.status,
    creatorUsername: op.profiles?.username || null,
    creatorReputation: op.profiles?.reputation_score ? Math.round(op.profiles.reputation_score) : undefined,
    createdAt: op.created_at, followerCount: op.follower_count || 0, isRising: (op.rising_score || 0) > 10,
    options: Array.isArray(op.options) && op.options.length > 0
      ? op.options.map((o: any) => ({ label: typeof o === "string" ? o : String(o), percent: Math.round(100 / op.options.length) }))
      : undefined,
  });

  const currentFeatured = featured[featuredIndex];

  if (!hasSeenHero) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl space-y-8">
            <h1 className="text-6xl md:text-8xl font-black text-foreground leading-[1.0] tracking-tight">
              My opinion.<br />My call.<br />My validation.
            </h1>
            <p className="text-lg text-muted-foreground max-w-sm mx-auto leading-relaxed">The prediction market where your takes get tested.</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setHasSeenHero(true)} className="rounded-full bg-foreground text-background px-10 py-4 text-base font-bold hover:opacity-90 transition-all">Call It Now</button>
              <button onClick={() => navigate("/how-it-works")} className="rounded-full border border-border px-8 py-4 text-base font-semibold text-foreground hover:border-foreground/50 transition-all">How it works</button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 md:px-6 py-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-8">
          <div className="min-w-0">

            {/* Featured carousel — 12 cards */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Radio className="h-3 w-3 text-[#DC2626] animate-pulse" /> Breaking & Featured
                </span>
                {featured.length > 1 && (
                  <div className="flex items-center gap-1">
                    {featured.slice(0, 12).map((_, i) => (
                      <button key={i} onClick={() => setFeaturedIndex(i)}
                        className={`h-1.5 rounded-full transition-all ${i === featuredIndex ? "w-4 bg-foreground" : "w-1.5 bg-border"}`} />
                    ))}
                    <button onClick={() => setFeaturedIndex(i => (i - 1 + featured.length) % featured.length)} className="p-1.5 rounded-full border border-border hover:border-foreground/40 transition-all ml-1"><ChevronLeft className="h-3 w-3" /></button>
                    <button onClick={() => setFeaturedIndex(i => (i + 1) % featured.length)} className="p-1.5 rounded-full border border-border hover:border-foreground/40 transition-all"><ChevronRight className="h-3 w-3" /></button>
                  </div>
                )}
              </div>
              {featured.length > 0 && (
                <div className="text-[10px] text-muted-foreground mb-2 font-mono">{featuredIndex + 1} / {featured.length}</div>
              )}
              {loading && !featured.length ? (
                <div className="h-[300px] rounded-2xl bg-secondary animate-pulse" />
              ) : currentFeatured ? (
                <AnimatePresence mode="wait">
                  <FeaturedCard key={featuredIndex} opinion={currentFeatured}
                    onClick={() => navigate(`/opinion/${currentFeatured.id}`)}
                    onStakeTap={(opt, stance) => setStakeSheet({ open: true, option: opt, stance })} />
                </AnimatePresence>
              ) : null}
            </div>

            <div className="mb-8"><FeaturedTabs /></div>

            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-foreground">All Calls</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => navigate("/call-it")} className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-foreground text-background text-xs font-bold hover:opacity-90 transition-all">
                  <Plus className="h-3.5 w-3.5" /> Create
                </button>
                <select value={activeSort} onChange={e => { setActiveSort(e.target.value); setPage(0); setOpinions([]); }} className="bg-background border border-border text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-foreground/40 transition-colors">
                  {SORT_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <TopicFilterBar active={activeTopic} onChange={slug => { setActiveTopic(slug); setPage(0); setOpinions([]); }} />

            {loading && page === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => <div key={i} className="h-52 rounded-2xl bg-secondary animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {opinions.map((op, i) => <OpinionCard key={op.id} data={mapToCard(op)} index={i} />)}
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <button onClick={() => setPage(p => p + 1)} disabled={loading} className="py-3 px-8 text-sm font-bold border border-border rounded-xl hover:border-foreground/40 transition-colors disabled:opacity-50">
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          </div>

          <aside className="hidden lg:flex flex-col gap-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                <Radio className="h-3.5 w-3.5 text-[#DC2626]" /> Breaking
              </h3>
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {breaking.slice(0, 8).map((item, i) => (
                  <button key={item.id} onClick={() => navigate(`/opinion/${item.id}`)} className="flex items-start gap-3 w-full px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/40 transition-colors text-left group">
                    <span className="text-xs text-muted-foreground font-mono mt-0.5 w-4 shrink-0">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground group-hover:text-foreground/70 transition-colors line-clamp-2 leading-snug">{item.statement}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.topics?.icon} {item.topics?.name} · {item.call_count || 0} callers</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                <TrendingUp className="h-3.5 w-3.5 text-orange-500" /> Fast Rising
              </h3>
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {rising.length === 0 ? (
                  <div className="p-4 text-xs text-muted-foreground text-center">Loading...</div>
                ) : rising.map((item, i) => (
                  <button key={item.id} onClick={() => navigate(`/opinion/${item.id}`)} className="flex items-start gap-3 w-full px-4 py-3.5 border-b border-border last:border-0 hover:bg-secondary/40 transition-colors text-left group">
                    <div className="h-5 w-5 rounded-full bg-orange-500/10 flex items-center justify-center text-[10px] font-bold text-orange-500 shrink-0 mt-0.5">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground group-hover:text-foreground/70 transition-colors line-clamp-2 leading-snug">{item.statement}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.topics?.icon} {item.topics?.name} · {item.call_count || 0} callers</p>
                    </div>
                    <TrendingUp className="h-3 w-3 text-orange-500 shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {stakeSheet.open && currentFeatured && (
        <MobileStakeSheet
          opinion={{ id: currentFeatured.id, statement: currentFeatured.statement, call_count: currentFeatured.call_count || 0, follower_count: currentFeatured.follower_count || 0, end_time: currentFeatured.end_time || "", source_name: null, source_url: null }}
          options={Array.isArray(currentFeatured.options) ? currentFeatured.options : ["Yes", "No"]}
          userCall={null} isOpen={true} hasActivity={false} latestProbabilities={{}} countdown=""
          onCall={async () => navigate(`/opinion/${currentFeatured.id}`)}
          submitting={false} user={user} isLoggedIn={isLoggedIn}
          onClose={() => setStakeSheet({ open: false })} />
      )}
    </div>
  );
};

export default Index;
