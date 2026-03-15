import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import OpinionCard from "@/components/OpinionCard";
import MiniGraph from "@/components/MiniGraph";
import { Flame, Zap, ChevronLeft, ChevronRight, Timer, Users } from "lucide-react";
import { supabase } from "@/supabaseClient";

const FeaturedCard = ({ opinion, onClick }: { opinion: any; onClick: () => void }) => {
  const options: string[] = Array.isArray(opinion.options) ? opinion.options : ["Yes", "No"];
  const basePercent = Math.round(100 / options.length);
  const displayOptions = options.map((o: string) => ({ label: o, percent: basePercent }));
  const seed = opinion.id?.toString().charCodeAt(0) || 3;
  const timeLeft = opinion.end_time
    ? new Date(opinion.end_time) > new Date()
      ? `${Math.ceil((new Date(opinion.end_time).getTime() - Date.now()) / 86400000)} days left`
      : "Ended"
    : "30 days left";

  return (
    <motion.div
      className="w-full bg-card border border-border rounded-2xl p-6 cursor-pointer hover:border-gold/50 transition-all"
      onClick={onClick}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-lg shrink-0">
            {opinion.topics?.icon || "📰"}
          </div>
          <div>
            <p className="text-xs font-bold text-gold uppercase tracking-wider">
              {opinion.topics?.name || "General"}
            </p>
            <p className="text-[10px] text-muted-foreground">Featured Opinion</p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Users className="h-3 w-3" /> {opinion.call_count || 0} callers
        </span>
      </div>

      <h2 className="font-headline text-3xl md:text-4xl font-bold text-foreground leading-tight mb-6">
        {opinion.statement}
      </h2>

      <MiniGraph options={displayOptions} seed={seed} />

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Timer className="h-3.5 w-3.5" /> {timeLeft}
        </span>
        <span className="text-sm font-bold text-gold">View Opinion →</span>
      </div>
    </motion.div>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const [opinions, setOpinions] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [hotTopics, setHotTopics] = useState<any[]>([]);
  const [breaking, setBreaking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [sort, setSort] = useState("trending");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 6;

  useEffect(() => { fetchData(); }, [sort, page]);

  useEffect(() => {
    if (featured.length < 2) return;
    const t = setInterval(() => setFeaturedIndex(i => (i + 1) % featured.length), 6000);
    return () => clearInterval(t);
  }, [featured.length]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("opinions")
        .select("*, topics(name, slug, icon, color)")
        .eq("status", "open")
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (sort === "newest") query = query.order("created_at", { ascending: false });
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

      const { data: topicsData } = await supabase
        .from("topics").select("name, slug, icon")
        .eq("type", "category").eq("active", true).limit(8);
      if (topicsData) setHotTopics(topicsData);

      const { data: breakingData } = await supabase
        .from("opinions").select("id, statement, call_count, topics(name, icon)")
        .eq("status", "open")
        .order("created_at", { ascending: false }).limit(8);
      if (breakingData) setBreaking(breakingData);

    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const mapToCard = (op: any) => ({
    id: op.id,
    question: op.statement,
    yesPercent: 50, noPercent: 50,
    coins: (op.call_count || 0) * 100 || 100,
    timeLeft: op.end_time
      ? new Date(op.end_time) > new Date()
        ? `${Math.ceil((new Date(op.end_time).getTime() - Date.now()) / 86400000)}d left`
        : "Ended"
      : "30d left",
    genre: op.topics?.name || "General",
    status: op.status,
    options: Array.isArray(op.options)
      ? op.options.map((o: string) => ({ label: o, percent: Math.round(100 / op.options.length) }))
      : undefined,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 md:px-6 py-8 pb-24">

        {/* ── TOP SECTION: Carousel LEFT + Sidebar RIGHT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 mb-14">

          {/* ── LEFT: Featured Carousel ── */}
          <div>
            {featured.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-gold animate-pulse inline-block" />
                    Featured
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 mr-1">
                      {featured.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setFeaturedIndex(i)}
                          className={`h-1.5 rounded-full transition-all duration-300 ${i === featuredIndex ? "w-5 bg-gold" : "w-1.5 bg-border hover:bg-muted-foreground"
                            }`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => setFeaturedIndex(i => (i - 1 + featured.length) % featured.length)}
                      className="p-1.5 rounded-full border border-border hover:border-gold hover:text-gold transition-all"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setFeaturedIndex(i => (i + 1) % featured.length)}
                      className="p-1.5 rounded-full border border-border hover:border-gold hover:text-gold transition-all"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <FeaturedCard
                    key={featuredIndex}
                    opinion={featured[featuredIndex]}
                    onClick={() => navigate(`/opinion/${featured[featuredIndex].id}`)}
                  />
                </AnimatePresence>
              </section>
            )}

            {loading && featured.length === 0 && (
              <div className="h-80 rounded-2xl bg-secondary animate-pulse" />
            )}
          </div>

          {/* ── RIGHT: Breaking News + Hot Topics ── */}
          <aside className="hidden lg:flex flex-col gap-6">

            {/* Breaking News */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                <Zap className="h-3.5 w-3.5 text-gold" /> Breaking
              </h2>
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {breaking.map((item, i) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(`/opinion/${item.id}`)}
                    className="flex items-start gap-3 w-full px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors text-left group"
                  >
                    <span className="text-xs text-muted-foreground font-mono mt-0.5 shrink-0 w-4">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground group-hover:text-gold transition-colors line-clamp-2 leading-snug">
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

            {/* Hot Topics */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                <Flame className="h-3.5 w-3.5 text-gold" /> Hot Topics
              </h2>
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {hotTopics.map((topic, i) => (
                  <button
                    key={topic.slug}
                    onClick={() => navigate(`/topic/${topic.slug}`)}
                    className="flex items-center justify-between w-full px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                      <span className="text-sm font-semibold text-foreground group-hover:text-gold transition-colors">
                        {topic.icon} {topic.name}
                      </span>
                    </div>
                    <Flame className="h-3 w-3 text-gold opacity-60 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
                <button
                  onClick={() => navigate("/topics")}
                  className="w-full py-3 text-xs font-bold text-muted-foreground hover:text-gold transition-colors"
                >
                  All Topics →
                </button>
              </div>
            </div>

          </aside>
        </div>

        {/* ── BOTTOM: All Calls Grid ── */}
        <section>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <h2 className="font-headline text-2xl font-bold text-foreground">All Calls</h2>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(0); setOpinions([]); }}
              className="bg-background border border-border text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:border-gold transition-colors"
            >
              <option value="trending">Trending</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          {loading && page === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-52 rounded-2xl bg-secondary animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {opinions.map((op, i) => (
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