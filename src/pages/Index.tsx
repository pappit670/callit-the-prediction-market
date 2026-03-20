import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import OpinionCard from "@/components/OpinionCard";
import { CallitPredictionCard } from "@/components/ui/callit-prediction-card";
import { FastRisingCalls } from "@/components/FastRisingCalls";
import { ActivityFeed } from "@/components/ActivityFeed";
import {
  Zap, ChevronLeft, ChevronRight, Timer, Users, Plus,
  TrendingUp, Swords, MessageSquare, Filter
} from "lucide-react";
import { supabase } from "@/supabaseClient";
import { useApp } from "@/context/AppContext";

const OPTION_HEX = ["#F5C518", "#22C55E", "#EF4444", "#A855F7", "#8B5CF6"];
const SORT_OPTIONS = ["Trending", "Newest", "Most Called", "Ending Soon"];

function generateFeaturedChartData(percent: number, seed: number, points = 20) {
  const data: { time: string; probability: number }[] = [];
  const labels = ["Day 1","Day 3","Day 5","Day 7","Day 10","Day 14","Day 17","Day 20","Day 24","Day 27","Day 30","Day 33","Day 36","Day 40","Day 44","Day 47","Day 50","Day 54","Day 57","Now"];
  let val = 40 + (seed % 20);
  for (let i = 0; i < points; i++) {
    const noise = Math.sin(seed * 13.37 + i * 2.1) * 8 + Math.cos(seed * 7.53 + i * 3.7) * 5;
    val = val + (percent - val) * 0.15 + noise * (1 - (i / points) * 0.7);
    val = Math.max(2, Math.min(98, val));
    if (i === points - 1) val = percent;
    data.push({ time: labels[i] || `Day ${i+1}`, probability: Math.round(val) });
  }
  return data;
}

const FeaturedCard = ({ opinion, onClick }: { opinion: any; onClick: () => void }) => {
  const options: string[] = Array.isArray(opinion.options) ? opinion.options : ["Yes", "No"];
  const basePercent = Math.round(100 / options.length);
  const optionSeries = options.map((o: string, i: number) => ({
    label: o, color: OPTION_HEX[i % OPTION_HEX.length],
    data: generateFeaturedChartData(basePercent + (i * 7 % 20) - 10, i * 17 + 42, 20),
  }));
  const timeLeft = opinion.end_time
    ? new Date(opinion.end_time) > new Date()
      ? `${Math.ceil((new Date(opinion.end_time).getTime() - Date.now()) / 86400000)} days left`
      : "Ended"
    : "30 days left";

  return (
    <motion.div className="w-full cursor-pointer" onClick={onClick}
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
      <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-gold/40 transition-all">
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gold uppercase tracking-wider">
                {opinion.topics?.icon} {opinion.topics?.name || "General"}
              </span>
              <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">Featured</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{opinion.call_count || 0}</span>
              <span className="flex items-center gap-1"><Timer className="h-3 w-3" />{timeLeft}</span>
            </div>
          </div>
          <h2 className="text-xl font-bold text-foreground leading-snug mb-1">
            {opinion.statement}
          </h2>
          {opinion.profiles?.username && (
            <p className="text-xs text-muted-foreground">
              by <span className="text-gold font-semibold">@{opinion.profiles.username}</span>
            </p>
          )}
        </div>
        <div className="px-3">
          <CallitPredictionCard title="Market Probability" optionSeries={optionSeries} height={180} />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <div className="flex items-center gap-3">
            {options.slice(0, 3).map((opt, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ background: OPTION_HEX[i % OPTION_HEX.length] }} />
                <span className="text-xs text-muted-foreground">{opt}</span>
                <span className="text-xs font-bold" style={{ color: OPTION_HEX[i % OPTION_HEX.length] }}>{basePercent}%</span>
              </div>
            ))}
          </div>
          <span className="text-xs font-bold text-gold">View →</span>
        </div>
      </div>
    </motion.div>
  );
};

// ── BOTTOM NAV ───────────────────────────────────────────────
const CATEGORIES = ["All", "Sports", "Crypto", "Politics", "Tech", "Business", "World", "Entertainment"];

const BottomNav = ({ active, onChange }: { active: string; onChange: (c: string) => void }) => (
  <div className="w-full bg-card border-y border-border sticky top-[57px] z-30">
    <div className="max-w-7xl mx-auto px-4 md:px-6">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={`flex-shrink-0 px-4 py-3 text-sm font-semibold transition-all border-b-2 ${
              active === cat
                ? "border-gold text-gold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ── FEATURED TABS ─────────────────────────────────────────────
const FeaturedTabs = ({ opinions }: { opinions: any[] }) => {
  const [tab, setTab] = useState<"debates" | "activity">("debates");
  const [debates, setDebates] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (tab === "debates") fetchDebates();
  }, [tab]);

  const fetchDebates = async () => {
    const { data } = await supabase
      .from("debates")
      .select("*, opinions(statement)")
      .order("created_at", { ascending: false })
      .limit(5);
    setDebates(data || []);
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Tab headers */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setTab("debates")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors border-b-2 ${
            tab === "debates" ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Swords className="h-4 w-4" /> Debates
        </button>
        <button
          onClick={() => setTab("activity")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors border-b-2 ${
            tab === "activity" ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Zap className="h-4 w-4" /> Activity
        </button>
      </div>

      {/* Debates tab */}
      {tab === "debates" && (
        <div className="divide-y divide-border/50">
          {debates.length === 0 ? (
            <div className="p-6 text-center">
              <Swords className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">No active debates yet</p>
              <p className="text-xs text-muted-foreground mt-1">Challenge someone's stance to start one</p>
            </div>
          ) : debates.map((d, i) => (
            <motion.button
              key={d.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/opinion/${d.opinion_id}`)}
              className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-secondary/40 transition-colors text-left"
            >
              <div className="h-7 w-7 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Swords className="h-3.5 w-3.5 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground font-semibold line-clamp-1">
                  {(d as any).opinions?.statement?.slice(0, 55)}...
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-[#00C278] font-semibold">{d.challenger_alias}</span>
                  <span className="text-[10px] text-muted-foreground">vs</span>
                  <span className="text-[10px] text-[#EF4444] font-semibold">{d.defender_alias}</span>
                  <span className="text-[10px] text-gold ml-auto">{d.challenger_votes + d.defender_votes} votes</span>
                </div>
                {/* Mini vote bar */}
                <div className="mt-1.5 h-1 rounded-full bg-[#EF4444]/20 overflow-hidden">
                  <div
                    className="h-full bg-[#00C278] rounded-full transition-all"
                    style={{
                      width: `${(d.challenger_votes + d.defender_votes) > 0
                        ? Math.round((d.challenger_votes / (d.challenger_votes + d.defender_votes)) * 100)
                        : 50}%`
                    }}
                  />
                </div>
              </div>
            </motion.button>
          ))}
          {debates.length > 0 && (
            <button className="w-full py-2.5 text-xs text-gold hover:text-gold-hover font-semibold transition-colors">
              View all debates →
            </button>
          )}
        </div>
      )}

      {/* Activity tab */}
      {tab === "activity" && <ActivityFeed />}
    </div>
  );
};

// ── MAIN INDEX ────────────────────────────────────────────────
const Index = () => {
  const navigate = useNavigate();
  const { hasSeenHero, setHasSeenHero } = useApp();
  const [opinions, setOpinions]     = useState<any[]>([]);
  const [featured, setFeatured]     = useState<any[]>([]);
  const [breaking, setBreaking]     = useState<any[]>([]);
  const [rising, setRising]         = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSort, setActiveSort] = useState("Trending");
  const [page, setPage]             = useState(0);
  const PAGE_SIZE = 9;

  useEffect(() => {
    if (hasSeenHero) {
      fetchData();
      fetchRising();
    }
  }, [hasSeenHero, activeCategory, activeSort, page]);

  useEffect(() => {
    if (featured.length < 2) return;
    const t = setInterval(() => setFeaturedIndex(i => (i + 1) % featured.length), 7000);
    return () => clearInterval(t);
  }, [featured.length]);

  const fetchRising = async () => {
    const { data } = await supabase
      .from("opinions")
      .select("id, statement, call_count, rising_score, topics!opinions_topic_id_fkey(name, icon)")
      .eq("status", "open")
      .order("rising_score", { ascending: false })
      .limit(6);
    setRising(data || []);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("opinions")
        .select("*, topics!opinions_topic_id_fkey(name, slug, icon, color), profiles(username, reputation_score)")
        .eq("status", "open")
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      // Category filter
      if (activeCategory !== "All") {
        const { data: topicData } = await supabase
          .from("topics")
          .select("id")
          .ilike("name", `%${activeCategory}%`);
        if (topicData?.length) {
          query = query.in("topic_id", topicData.map(t => t.id));
        }
      }

      // Sort
      if (activeSort === "Newest") query = query.order("created_at", { ascending: false });
      else if (activeSort === "Most Called") query = query.order("call_count", { ascending: false });
      else if (activeSort === "Ending Soon") query = query.order("end_time", { ascending: true });
      else query = query.order("call_count", { ascending: false });

      const { data } = await query;
      if (data) {
        if (page === 0) {
          setFeatured(data.slice(0, 5));
          setOpinions(data.slice(5));
        } else {
          setOpinions(prev => [...prev, ...data]);
        }
      }

      const { data: breakingData } = await supabase
        .from("opinions")
        .select("id, statement, call_count, topics!opinions_topic_id_fkey(name, icon)")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(8);
      if (breakingData) setBreaking(breakingData);

    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const mapToCard = (op: any) => ({
    id: op.id,
    question: op.statement,
    yesPercent: 50, noPercent: 50,
    coins: op.call_count || 0,
    timeLeft: op.end_time
      ? new Date(op.end_time) > new Date()
        ? `${Math.ceil((new Date(op.end_time).getTime() - Date.now()) / 86400000)}d left`
        : "Ended"
      : "30d left",
    genre: op.topics?.name || "General",
    topicIcon: op.topics?.icon,
    topicColor: op.topics?.color,
    status: op.status,
    creatorUsername: op.profiles?.username || null,
    creatorReputation: op.profiles?.reputation_score ? Math.round(op.profiles.reputation_score) : undefined,
    createdAt: op.created_at,
    followerCount: op.follower_count || 0,
    isRising: (op.rising_score || 0) > 10,
    // Safe options handling
    options: Array.isArray(op.options) && op.options.length > 0
      ? op.options.map((o: any) => ({
          label: typeof o === "string" ? o : String(o),
          percent: Math.round(100 / op.options.length),
        }))
      : undefined,
  });

  // ── LANDING ──────────────────────────────────────────────
  if (!hasSeenHero) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }} className="max-w-3xl space-y-8">
            <h1 className="text-6xl md:text-8xl font-black text-foreground leading-[1.0] tracking-tight">
              My opinion.<br />My call.<br />My validation.
            </h1>
            <p className="text-lg text-muted-foreground max-w-sm mx-auto leading-relaxed">
              The prediction market where your takes get tested.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setHasSeenHero(true)}
                className="rounded-full bg-gold px-10 py-4 text-base font-bold text-primary-foreground hover:bg-gold-hover transition-all">
                Call It Now
              </button>
              <button onClick={() => navigate("/how-it-works")}
                className="rounded-full border border-border px-8 py-4 text-base font-semibold text-foreground hover:border-gold hover:text-gold transition-all">
                How it works
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── HOME FEED ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Top Navbar */}
      <Navbar />

      {/* Bottom Category Navbar */}
      <BottomNav active={activeCategory} onChange={(c) => { setActiveCategory(c); setPage(0); setOpinions([]); }} />


      <main className="mx-auto max-w-7xl px-4 md:px-6 py-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">

          {/* LEFT — main feed */}
          <div>
            {/* Featured Carousel */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-gold animate-pulse" /> Featured
                </span>
                {featured.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    {featured.map((_, i) => (
                      <button key={i} onClick={() => setFeaturedIndex(i)}
                        className={`h-1.5 rounded-full transition-all ${i === featuredIndex ? "w-5 bg-gold" : "w-1.5 bg-border"}`} />
                    ))}
                    <button onClick={() => setFeaturedIndex(i => (i-1+featured.length)%featured.length)}
                      className="p-1.5 rounded-full border border-border hover:border-gold hover:text-gold transition-all ml-1">
                      <ChevronLeft className="h-3 w-3" />
                    </button>
                    <button onClick={() => setFeaturedIndex(i => (i+1)%featured.length)}
                      className="p-1.5 rounded-full border border-border hover:border-gold hover:text-gold transition-all">
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {loading && !featured.length ? (
                <div className="h-[380px] rounded-2xl bg-secondary animate-pulse" />
              ) : featured.length > 0 ? (
                <AnimatePresence mode="wait">
                  <FeaturedCard key={featuredIndex} opinion={featured[featuredIndex]}
                    onClick={() => navigate(`/opinion/${featured[featuredIndex].id}`)} />
                </AnimatePresence>
              ) : null}
            </div>

            {/* Debates + Activity tabs */}
            <div className="mb-8">
              <FeaturedTabs opinions={featured} />
            </div>

            {/* All Calls header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">All Calls</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => navigate("/call-it")}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gold text-primary-foreground text-xs font-bold hover:bg-gold-hover transition-all">
                  <Plus className="h-3.5 w-3.5" /> Create Call
                </button>
                <select value={activeSort}
                  onChange={e => { setActiveSort(e.target.value); setPage(0); setOpinions([]); }}
                  className="bg-background border border-border text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-gold transition-colors">
                  {SORT_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Cards grid */}
            {loading && page === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => <div key={i} className="h-52 rounded-2xl bg-secondary animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {opinions.map((op, i) => (
                  <OpinionCard key={op.id} data={mapToCard(op)} index={i} />
                ))}
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <button onClick={() => setPage(p => p + 1)} disabled={loading}
                className="py-3 px-8 text-sm font-bold border border-border rounded-xl hover:border-gold hover:text-gold transition-colors disabled:opacity-50">
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          </div>

          {/* RIGHT column */}
          <aside className="hidden lg:flex flex-col gap-6">

            {/* Breaking / Latest */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                <Zap className="h-3.5 w-3.5 text-gold" /> Breaking
              </h3>
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {breaking.slice(0, 6).map((item, i) => (
                  <button key={item.id} onClick={() => navigate(`/opinion/${item.id}`)}
                    className="flex items-start gap-3 w-full px-4 py-3.5 border-b border-border last:border-0 hover:bg-secondary/40 transition-colors text-left group">
                    <span className="text-xs text-muted-foreground font-mono mt-0.5 w-4 shrink-0">{i+1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground group-hover:text-gold transition-colors line-clamp-2 leading-snug">
                        {item.statement}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {item.topics?.icon} {item.topics?.name} · {item.call_count || 0} callers
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Fast Rising */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                <TrendingUp className="h-3.5 w-3.5 text-orange-500" /> Fast Rising
              </h3>
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {rising.length === 0 ? (
                  <div className="p-4 text-xs text-muted-foreground text-center">Loading rising calls...</div>
                ) : rising.map((item, i) => (
                  <button key={item.id} onClick={() => navigate(`/opinion/${item.id}`)}
                    className="flex items-start gap-3 w-full px-4 py-3.5 border-b border-border last:border-0 hover:bg-secondary/40 transition-colors text-left group">
                    <div className="h-5 w-5 rounded-full bg-orange-500/10 flex items-center justify-center text-[10px] font-bold text-orange-500 shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground group-hover:text-gold transition-colors line-clamp-2 leading-snug">
                        {item.statement}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {item.topics?.icon} {item.topics?.name} · {item.call_count || 0} callers
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 text-orange-500 text-[10px] font-bold shrink-0">
                      <TrendingUp className="h-3 w-3" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </aside>
        </div>
      </main>
    </div>
  );
};

export default Index;