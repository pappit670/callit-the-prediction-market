import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import OpinionCard from "@/components/OpinionCard";
import MiniGraph from "@/components/MiniGraph";
import { Flame, Zap, ChevronLeft, ChevronRight, Clock, Users } from "lucide-react";
import { supabase } from "@/supabaseClient";

const Index = () => {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<any[]>([]);
  const [opinions, setOpinions] = useState<any[]>([]);
  const [hotTopics, setHotTopics] = useState<any[]>([]);
  const [breakingNews, setBreakingNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [sort, setSort] = useState("trending");
  const [page, setPage] = useState(0);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const PAGE_SIZE = 9;

  useEffect(() => { fetchData(); }, [sort, page]);

  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setFeaturedIndex(i => (i + 1) % Math.max(featured.length, 1));
    }, 5000);
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [featured.length]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Featured — top 5 by call count
      const { data: featuredData } = await supabase
        .from("opinions")
        .select("*, topics(name, slug, icon, color)")
        .eq("status", "open")
        .order("call_count", { ascending: false })
        .limit(5);
      if (featuredData) setFeatured(featuredData);

      // Feed
      let query = supabase
        .from("opinions")
        .select("*, topics(name, slug, icon, color)")
        .eq("status", "open")
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (sort === "newest") query = query.order("created_at", { ascending: false });
      else query = query.order("call_count", { ascending: false });
      const { data: feedData } = await query;
      if (feedData) {
        if (page === 0) setOpinions(feedData);
        else setOpinions(prev => [...prev, ...feedData]);
      }

      // Hot topics
      const { data: topicsData } = await supabase
        .from("topics").select("name, slug, icon")
        .eq("type", "category").eq("active", true).limit(6);
      if (topicsData) setHotTopics(topicsData);

      // Breaking news — newest opinions
      const { data: newsData } = await supabase
        .from("opinions").select("id, statement, call_count, created_at, topics(name, icon)")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(6);
      if (newsData) setBreakingNews(newsData);

    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const mapToCard = (op: any) => ({
    id: op.id,
    question: op.statement,
    yesPercent: 50,
    noPercent: 50,
    coins: op.call_count * 100 || 100,
    timeLeft: op.end_time
      ? new Date(op.end_time) > new Date()
        ? `${Math.ceil((new Date(op.end_time).getTime() - Date.now()) / 86400000)}d left`
        : "Ended"
      : "30 days",
    genre: op.topics?.name || "General",
    topicIcon: op.topics?.icon || "📰",
    topicColor: op.topics?.color || "#F5C518",
    status: op.status,
    options: Array.isArray(op.options)
      ? op.options.map((o: string) => ({ label: o, percent: Math.round(100 / op.options.length) }))
      : undefined,
  });

  const currentFeatured = featured[featuredIndex];
  const featuredOptions = currentFeatured && Array.isArray(currentFeatured.options)
    ? currentFeatured.options.map((o: string, i: number) => ({
      label: o,
      percent: Math.round(100 / currentFeatured.options.length),
    }))
    : [{ label: "Yes", percent: 50 }, { label: "No", percent: 50 }];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 md:px-6 py-8 pb-24">

        {/* THREE COLUMN TOP SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_300px] gap-6 mb-16">

          {/* LEFT — Hot Topics */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
              <Flame className="h-3.5 w-3.5 text-gold" /> Hot Topics
            </h2>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {hotTopics.map((topic, i) => (
                <button key={topic.slug}
                  onClick={() => navigate(`/topic/${topic.slug}`)}
                  className="flex items-center justify-between w-full px-4 py-3.5 hover:bg-secondary transition-colors border-b border-border last:border-0 group">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs font-mono">{i + 1}</span>
                    <span className="text-sm font-semibold text-foreground group-hover:text-gold transition-colors">
                      {topic.icon} {topic.name}
                    </span>
                  </div>
                  <Flame className="h-3 w-3 text-gold opacity-60 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
              <button onClick={() => navigate("/topics")}
                className="w-full py-3 text-xs font-bold text-muted-foreground hover:text-gold transition-colors border-t border-border bg-secondary/30">
                All Topics →
              </button>
            </div>
          </div>

          {/* CENTER — Featured rotating carousel */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-gold animate-pulse" /> Featured
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setFeaturedIndex(i => (i - 1 + featured.length) % featured.length)}
                  className="h-7 w-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-gold hover:border-gold transition-all">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1">
                  {featured.map((_, i) => (
                    <button key={i} onClick={() => setFeaturedIndex(i)}
                      className={`rounded-full transition-all ${i === featuredIndex ? "w-4 h-1.5 bg-gold" : "w-1.5 h-1.5 bg-border hover:bg-gold/50"}`} />
                  ))}
                </div>
                <button onClick={() => setFeaturedIndex(i => (i + 1) % featured.length)}
                  className="h-7 w-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-gold hover:border-gold transition-all">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {currentFeatured && (
                <motion.div key={currentFeatured.id}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35 }}
                  onClick={() => navigate(`/opinion/${currentFeatured.id}`)}
                  className="bg-card border border-border rounded-2xl p-6 cursor-pointer hover:border-gold/40 transition-all group"
                >
                  {/* Topic pill */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-7 w-7 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-sm">
                      {currentFeatured.topics?.icon || "📰"}
                    </div>
                    <span className="text-xs font-semibold text-gold uppercase tracking-wide">
                      {currentFeatured.topics?.name || "General"}
                    </span>
                    <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Users className="h-3 w-3" /> {currentFeatured.call_count || 0} callers
                    </span>
                  </div>

                  {/* Question */}
                  <h2 className="font-headline text-2xl md:text-3xl font-bold text-foreground leading-tight mb-5 group-hover:text-gold/90 transition-colors">
                    {currentFeatured.statement}
                  </h2>

                  {/* Graph */}
                  <MiniGraph options={featuredOptions} seed={currentFeatured.id} />

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {currentFeatured.end_time
                        ? new Date(currentFeatured.end_time) > new Date()
                          ? `${Math.ceil((new Date(currentFeatured.end_time).getTime() - Date.now()) / 86400000)} days left`
                          : "Ended"
                        : "30 days left"}
                    </div>
                    <span className="text-xs font-bold text-gold">Trending →</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT — Breaking News */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-gold" /> Breaking
            </h2>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {breakingNews.map((item, i) => (
                <button key={item.id}
                  onClick={() => navigate(`/opinion/${item.id}`)}
                  className="flex items-start gap-3 w-full px-4 py-3.5 hover:bg-secondary transition-colors border-b border-border last:border-0 text-left group">
                  <span className="text-muted-foreground font-mono text-xs mt-0.5 shrink-0">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground group-hover:text-gold transition-colors line-clamp-2 leading-snug">
                      {item.statement}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {item.topics?.icon} {item.topics?.name} · {item.call_count || 0} callers
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ALL CALLS GRID */}
        <div className="border-t border-border pt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline text-2xl font-bold flex items-center gap-2">
              <Flame className="h-5 w-5 text-gold" /> All Calls
            </h2>
            <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(0); }}
              className="bg-background border border-border text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:border-gold transition-colors">
              <option value="trending">Trending</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          {loading && page === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-56 rounded-2xl bg-secondary animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {opinions.map((op, i) => (
                <OpinionCard key={op.id} data={mapToCard(op)} index={i} />
              ))}
            </div>
          )}

          <div className="mt-10 flex justify-center">
            <button onClick={() => setPage(p => p + 1)} disabled={loading}
              className="py-3 px-8 text-sm font-bold border border-border rounded-xl hover:border-gold hover:text-gold hover:bg-gold/5 transition-colors disabled:opacity-50">
              {loading ? "Loading..." : "Load More"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;