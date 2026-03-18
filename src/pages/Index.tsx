import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import OpinionCard from "@/components/OpinionCard";
import { CallitPredictionCard } from "@/components/ui/callit-prediction-card";
import { FastRisingCalls } from "@/components/FastRisingCalls";
import {
  TrendingUp, MessageSquare, ChevronLeft, ChevronRight,
  Timer, Users, Plus, Newspaper, ArrowUpRight
} from "lucide-react";
import { supabase } from "@/supabaseClient";
import { useApp } from "@/context/AppContext";

const OPTION_HEX = ["#F5C518", "#22C55E", "#EF4444", "#A855F7", "#8B5CF6"];

// ─── Simulated news items ───────────────────────────────────────────────────
const SAMPLE_NEWS: Record<string, { source: string; headline: string; time: string }[]> = {
  default: [
    { source: "Reuters", headline: "Global markets respond to Fed rate decision signals", time: "2h ago" },
    { source: "BBC Sport", headline: "Key injury concerns ahead of this weekend's fixtures", time: "4h ago" },
    { source: "The Guardian", headline: "Poll shifts signal tighter race than expected", time: "6h ago" },
  ],
};

// ─── Simulated live arguments ──────────────────────────────────────────────
const SAMPLE_ARGS = [
  { user: "cryptoking", text: "The data clearly points to yes — look at the trend.", stance: "agree" },
  { user: "debater99", text: "Absolutely not, this contradicts everything we know.", stance: "disagree" },
  { user: "analyst_pro", text: "Historical precedent shows otherwise.", stance: "challenge" },
  { user: "truthseeker", text: "I've seen this pattern before — it always flips late.", stance: "agree" },
  { user: "statsguru", text: "The margin of error makes this a coin flip honestly.", stance: "challenge" },
  { user: "boldcaller", text: "Strong agree — fundamentals support this outcome.", stance: "agree" },
  { user: "realistX", text: "People are ignoring the wild card factors here.", stance: "disagree" },
  { user: "edge_finder", text: "Smart money is leaning the other way quietly.", stance: "challenge" },
];

const STANCE_COLORS: Record<string, string> = {
  agree: "#22C55E",
  disagree: "#EF4444",
  challenge: "#F5C518",
};

function generateChartData(percent: number, seed: number, points = 20) {
  const data: { time: string; probability: number }[] = [];
  const labels = [
    "Day 1","Day 3","Day 5","Day 7","Day 10","Day 14","Day 17","Day 20",
    "Day 24","Day 27","Day 30","Day 33","Day 36","Day 40","Day 44","Day 47",
    "Day 50","Day 54","Day 57","Now",
  ];
  let val = 40 + (seed % 20);
  for (let i = 0; i < points; i++) {
    const noise = Math.sin(seed * 13.37 + i * 2.1) * 8 + Math.cos(seed * 7.53 + i * 3.7) * 5;
    val = val + (percent - val) * 0.15 + noise * (1 - (i / points) * 0.7);
    val = Math.max(2, Math.min(98, val));
    if (i === points - 1) val = percent;
    data.push({ time: labels[i] || `Day ${i + 1}`, probability: Math.round(val) });
  }
  return data;
}

// ─── Side Intelligence Panel: Live Arguments ───────────────────────────────
const LiveArgumentsFeed = () => {
  const doubled = [...SAMPLE_ARGS, ...SAMPLE_ARGS];
  return (
    <div className="flex flex-col h-full overflow-hidden feed-fade-mask">
      <div className="animate-scroll-up flex flex-col gap-2">
        {doubled.map((arg, i) => (
          <div key={i} className="px-3 py-2 rounded-xl bg-secondary/50 border border-border/40">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="h-4 w-4 rounded-full bg-secondary flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                {arg.user[0].toUpperCase()}
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground">@{arg.user}</span>
              <span className="text-[9px] font-bold ml-auto" style={{ color: STANCE_COLORS[arg.stance] }}>
                {arg.stance.toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] text-foreground leading-relaxed">{arg.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Side Intelligence Panel: News ────────────────────────────────────────
const NewsFeed = ({ opinion }: { opinion: any }) => {
  const items = SAMPLE_NEWS.default;
  return (
    <div className="flex flex-col gap-2.5 h-full">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Newspaper className="h-3 w-3" /> Relevant Context
      </p>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/40 hover:border-gold/30 transition-colors cursor-pointer group">
          <div className="h-5 w-5 rounded bg-secondary flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-[9px] font-bold text-muted-foreground">{item.source[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-foreground leading-snug group-hover:text-gold transition-colors line-clamp-2">
              {item.headline}
            </p>
            <p className="text-[9px] text-muted-foreground mt-0.5">{item.source} · {item.time}</p>
          </div>
          <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-gold shrink-0 mt-0.5 transition-colors" />
        </div>
      ))}
    </div>
  );
};

// ─── Featured Card ─────────────────────────────────────────────────────────
type FeaturedType = "rising" | "debate";

const FeaturedCard = ({
  opinion, type, onClick,
}: {
  opinion: any; type: FeaturedType; onClick: () => void;
}) => {
  const options: string[] = Array.isArray(opinion.options) ? opinion.options : ["Yes", "No"];
  const basePercent = Math.round(100 / options.length);

  const optionSeries = options.map((o: string, i: number) => ({
    label: o,
    color: OPTION_HEX[i % OPTION_HEX.length],
    data: generateChartData(basePercent + (i * 7 % 20) - 10, i * 17 + 42, 20),
  }));

  const timeLeft = opinion.end_time
    ? new Date(opinion.end_time) > new Date()
      ? `${Math.ceil((new Date(opinion.end_time).getTime() - Date.now()) / 86400000)} days left`
      : "Ended"
    : "30 days left";

  const isDebate = type === "debate";
  const accentColor = isDebate ? "#EF4444" : "#F5C518";
  const label = isDebate ? "Debate Spotlight" : "Rising Calls";
  const labelIcon = isDebate ? <MessageSquare className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />;

  // Alternating side intelligence: Rising → News, Debate → Live Arguments
  const SidePanel = isDebate ? LiveArgumentsFeed : NewsFeed;

  return (
    <motion.div
      className="w-full cursor-pointer"
      onClick={onClick}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="bg-card border border-border rounded-2xl overflow-hidden transition-colors hover:border-border/80"
      >
        <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] divide-y md:divide-y-0 md:divide-x divide-border">

          {/* Left — main content */}
          <div className="p-5 flex flex-col gap-4">
            {/* Card type label */}
            <div className="flex items-center justify-between">
              <span
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{ background: accentColor + "0D", color: accentColor + "CC" }}
              >
                {labelIcon} {label}
              </span>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> {opinion.call_count || 0} callers
                </span>
                <span className="flex items-center gap-1">
                  <Timer className="h-3 w-3" /> {timeLeft}
                </span>
              </div>
            </div>

            {/* Topic */}
            <div className="flex items-center gap-2">
              {opinion.topics?.icon && (
                <span className="text-base">{opinion.topics.icon}</span>
              )}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {opinion.topics?.name || "General"}
                </p>
              </div>
            </div>

            {/* Question */}
            <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
              {opinion.statement}
            </h2>

            {/* Creator */}
            {opinion.profiles?.username && (
              <p className="text-xs text-muted-foreground">
                by <span className="font-semibold" style={{ color: accentColor }}>@{opinion.profiles.username}</span>
                {opinion.profiles?.reputation_score && (
                  <span className="ml-2 text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
                    {Math.round(opinion.profiles.reputation_score)}% accuracy
                  </span>
                )}
              </p>
            )}

            {/* Mini chart */}
            <div className="-mx-2">
              <CallitPredictionCard
                title={`${opinion.topics?.name || "Market"} Probability`}
                optionSeries={optionSeries}
                height={150}
              />
            </div>

            {/* Belief percentages row */}
            <div className="flex items-center gap-4 flex-wrap">
              {options.map((opt: string, i: number) => {
                const col = OPTION_HEX[i % OPTION_HEX.length];
                const delta = (i % 2 === 0 ? 1 : -1) * ((i * 3 + 2) % 7);
                return (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ background: col }} />
                    <span className="text-xs text-muted-foreground">{opt}</span>
                    <span className="text-xs font-bold" style={{ color: col }}>{basePercent}%</span>
                    <span className="text-[10px] font-bold" style={{ color: delta >= 0 ? "#22C55E" : "#EF4444" }}>
                      {delta >= 0 ? `↑ +${delta}` : `↓ ${delta}`}
                    </span>
                  </div>
                );
              })}
              <span className="ml-auto text-xs font-bold" style={{ color: accentColor }}>
                View Call →
              </span>
            </div>
          </div>

          {/* Right — side intelligence */}
          <div className="p-4 hidden md:flex flex-col overflow-hidden" style={{ maxHeight: "340px" }}>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              {isDebate ? (
                <><span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse inline-block" />Live Arguments</>
              ) : (
                <><Newspaper className="h-3 w-3" />Context</>
              )}
            </p>
            <div className="flex-1 overflow-hidden">
              <SidePanel opinion={opinion} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Topic Tabs (Nav Bar 2) ────────────────────────────────────────────────
const TOPIC_TABS = [
  { label: "Trending", slug: "trending", icon: "🔥" },
  { label: "Politics", slug: "politics", icon: "🏛️" },
  { label: "Sports", slug: "sports", icon: "⚽" },
  { label: "Culture", slug: "culture", icon: "🎭" },
  { label: "Crypto", slug: "crypto", icon: "₿" },
  { label: "Climate", slug: "climate", icon: "🌍" },
  { label: "Economics", slug: "economics", icon: "📈" },
  { label: "Companies", slug: "companies", icon: "🏢" },
  { label: "Tech & Science", slug: "tech", icon: "🔬" },
  { label: "Education", slug: "education", icon: "🎓" },
  { label: "Elections", slug: "elections", icon: "🗳️" },
  { label: "Geopolitics", slug: "geopolitics", icon: "🌐" },
];

const HomeTopicTabs = ({ activeSlug, onSelect }: { activeSlug: string; onSelect: (slug: string) => void }) => {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? TOPIC_TABS : TOPIC_TABS.slice(0, 8);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visible.map((tab) => (
        <button
          key={tab.slug}
          onClick={() => onSelect(tab.slug)}
          className={`whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${activeSlug === tab.slug
            ? "bg-gold text-primary-foreground"
            : "text-muted-foreground hover:text-gold hover:bg-gold/10 border border-border"
            }`}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
      <button
        onClick={() => setShowAll(!showAll)}
        className="whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full text-muted-foreground border border-border hover:border-gold hover:text-gold transition-all"
      >
        {showAll ? "← Less" : "More →"}
      </button>
    </div>
  );
};

// ─── Main Index ────────────────────────────────────────────────────────────
const Index = () => {
  const navigate = useNavigate();
  const { hasSeenHero, setHasSeenHero } = useApp();
  const [opinions, setOpinions] = useState<any[]>([]);
  const [allOpinions, setAllOpinions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [activeTopicSlug, setActiveTopicSlug] = useState("trending");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 9;

  useEffect(() => { if (hasSeenHero) fetchData(); }, [hasSeenHero, page]);

  // Auto-rotate featured cards every 7s
  useEffect(() => {
    if (opinions.length < 2) return;
    const t = setInterval(() => setFeaturedIndex(i => (i + 1) % 2), 7000);
    return () => clearInterval(t);
  }, [opinions.length]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("opinions")
        .select("*, topics(name, slug, icon, color), profiles(username, reputation_score)")
        .eq("status", "open")
        .order("call_count", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (data) {
        if (page === 0) {
          setOpinions(data);
          setAllOpinions(data.slice(2));
        } else {
          setAllOpinions(prev => [...prev, ...data]);
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleTopicSelect = (slug: string) => {
    setActiveTopicSlug(slug);
    if (slug !== "trending") navigate(`/topic/${slug}`);
  };

  const mapToCard = (op: any) => ({
    id: op.id,
    question: op.statement,
    yesPercent: 50,
    noPercent: 50,
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
    creatorReputation: op.profiles?.reputation_score
      ? Math.round(op.profiles.reputation_score) : undefined,
    createdAt: op.created_at,
    commentCount: 0,
    followerCount: op.follower_count || 0,
    risingScore: op.rising_score || 0,
    isRising: (op.rising_score || 0) > 10,
    options: Array.isArray(op.options)
      ? op.options.map((o: string) => ({ label: o, percent: Math.round(100 / op.options.length) }))
      : undefined,
  });

  // ── LANDING PAGE ──
  if (!hasSeenHero) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl space-y-10"
          >
            <h1 className="font-headline text-6xl md:text-8xl lg:text-9xl font-bold text-foreground leading-[1.05] tracking-tight">
              My opinion.<br />My call.<br />My validation.
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              The prediction market where your takes get tested. Call it. Own it.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button
                onClick={() => setHasSeenHero(true)}
                className="rounded-full bg-gold px-10 py-4 text-lg font-bold text-primary-foreground hover:bg-gold-hover hover:scale-105 transition-all"
              >
                Call It Now
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Rising = index 0, Debate Spotlight = index 1
  const risingOpinion = opinions[0] || null;
  const debateOpinion = opinions[1] || opinions[0] || null;
  const featuredItems: { opinion: any; type: "rising" | "debate" }[] = ([
    { opinion: risingOpinion, type: "rising" as const },
    { opinion: debateOpinion, type: "debate" as const },
  ] as { opinion: any; type: "rising" | "debate" }[]).filter(f => !!f.opinion);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 md:px-6 py-8 pb-24">

        {/* ── Featured Section ── */}
        {!loading && featuredItems.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-gold animate-pulse inline-block" />
                Featured
              </h2>
              {featuredItems.length > 1 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 mr-1">
                    {featuredItems.map((_, i) => (
                      <button key={i} onClick={() => setFeaturedIndex(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === featuredIndex ? "w-5 bg-gold" : "w-1.5 bg-border hover:bg-muted-foreground"}`} />
                    ))}
                  </div>
                  <button
                    onClick={() => setFeaturedIndex(i => (i - 1 + featuredItems.length) % featuredItems.length)}
                    className="p-1.5 rounded-full border border-border hover:border-gold hover:text-gold transition-all"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setFeaturedIndex(i => (i + 1) % featuredItems.length)}
                    className="p-1.5 rounded-full border border-border hover:border-gold hover:text-gold transition-all"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="h-80 rounded-2xl bg-secondary animate-pulse" />
            ) : (
              <AnimatePresence mode="wait">
                {featuredItems[featuredIndex] && (
                  <FeaturedCard
                    key={featuredIndex}
                    opinion={featuredItems[featuredIndex].opinion}
                    type={featuredItems[featuredIndex].type}
                    onClick={() => navigate(`/opinion/${featuredItems[featuredIndex].opinion.id}`)}
                  />
                )}
              </AnimatePresence>
            )}
          </section>
        )}

        {/* ── Nav Bar 2: Topic Tabs ── */}
        <section className="mb-8">
          <HomeTopicTabs activeSlug={activeTopicSlug} onSelect={handleTopicSelect} />
        </section>

        {/* ── Fast Rising Calls ── */}
        <FastRisingCalls />

        {/* ── Main Trending Feed ── */}
        <section>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <div>
              <h2 className="font-headline text-2xl font-bold text-foreground">Trending Calls</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Ranked by stakes · velocity · debate activity</p>
            </div>
            <button
              onClick={() => navigate("/call-it")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gold text-primary-foreground text-xs font-bold hover:bg-gold-hover transition-all"
            >
              <Plus className="h-3.5 w-3.5" /> Create Call
            </button>
          </div>

          {loading && page === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-52 rounded-2xl bg-secondary animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allOpinions.map((op, i) => (
                <OpinionCard key={op.id} data={mapToCard(op)} index={i} />
              ))}
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={loading}
              className="py-3 px-8 text-sm font-bold border border-border rounded-xl hover:border-gold hover:text-gold transition-colors disabled:opacity-50"
            >
              {loading ? "Loading..." : "Load More"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;