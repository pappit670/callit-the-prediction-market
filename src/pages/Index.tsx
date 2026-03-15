import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import OpinionCard from "@/components/OpinionCard";
import { Flame, Bookmark, TrendingUp, Zap } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/supabaseClient";

const Index = () => {
  const navigate = useNavigate();
  const { hasSeenHero, setHasSeenHero } = useApp();
  const [opinions, setOpinions] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any>(null);
  const [hotTopics, setHotTopics] = useState<any[]>([]);
  const [breakingNews, setBreakingNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("trending");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 9;

  useEffect(() => { fetchData(); }, [sort, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("opinions")
        .select(`*, topics(name, slug, icon, color)`)
        .eq("status", "open")
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (sort === "newest") query = query.order("created_at", { ascending: false });
      else query = query.order("call_count", { ascending: false });

      const { data } = await query;
      if (data) {
        if (page === 0) {
          setFeatured(data[0] || null);
          setOpinions(data.slice(1));
        } else {
          setOpinions(prev => [...prev, ...data]);
        }
      }

      const { data: topicsData } = await supabase
        .from("topics").select("name, slug, icon")
        .eq("type", "category").eq("active", true).limit(6);
      if (topicsData) setHotTopics(topicsData);

      const { data: newsData } = await supabase
        .from("opinions").select("id, statement, call_count, topics(name, icon)")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(5);
      if (newsData) setBreakingNews(newsData);

    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const mapOpinionToCard = (op: any) => ({
    id: op.id,
    question: op.statement,
    yesPercent: 50,
    noPercent: 50,
    coins: op.call_count * 100 || 100,
    timeLeft: op.end_time ? new Date(op.end_time) > new Date()
      ? `${Math.ceil((new Date(op.end_time).getTime() - Date.now()) / 86400000)} days left`
      : "Ended" : "30 days",
    genre: op.topics?.name || "General",
    status: op.status,
    imageUrl: op.image_url,
    options: Array.isArray(op.options)
      ? op.options.map((o: string, i: number) => ({ label: o, percent: Math.round(100 / op.options.length) }))
      : undefined,
  });

  return (
    <div className="w-full relative">
      <Navbar />

      {/* HERO */}
      {!hasSeenHero && (
        <div className="min-h-[calc(100vh-68px-45px)] w-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700 relative z-10 bg-background">
          <div className="max-w-3xl space-y-12 mb-10">
            <h1 className="font-headline text-6xl md:text-8xl lg:text-9xl font-bold text-foreground leading-[1.05] tracking-tight">
              My opinion.<br />My call.<br />My validation.
            </h1>
            <button
              onClick={() => { setHasSeenHero(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="rounded-full bg-gold px-10 py-4 text-lg font-bold text-primary-foreground hover:bg-gold-hover hover:scale-105 transition-all shadow-xl animate-gold-pulse"
            >
              Call It Now
            </button>
          </div>
        </div>
      )}

      {/* MAIN FEED */}
      {hasSeenHero && (
        <div className="w-full pt-8 pb-20 animate-in slide-in-from-bottom-10 fade-in duration-700 bg-background relative z-10">
          <main className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">

              {/* LEFT */}
              <div className="flex flex-col gap-10">
                {/* Featured */}
                {featured && (
                  <section>
                    <div className="mb-3">
                      <h2 className="text-sm font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
                        Featured Opinion
                      </h2>
                    </div>
                    <div
                      onClick={() => navigate(`/opinion/${featured.id}`)}
                      className="w-full bg-card border border-border group hover:border-gold/50 transition-all rounded-2xl overflow-hidden cursor-pointer"
                    >
                      {featured.image_url && (
                        <div className="w-full h-48 overflow-hidden">
                          <img src={featured.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      )}
                      <div className="p-6 flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                          <span className="text-xs font-bold uppercase tracking-widest text-gold bg-gold/10 px-2 py-1 rounded">
                            {featured.topics?.icon} {featured.topics?.name || "General"}
                          </span>
                          <button onClick={(e) => { e.stopPropagation(); toast.success("Added to bookmarks"); }}>
                            <Bookmark className="h-5 w-5 text-muted-foreground hover:text-gold transition-colors" />
                          </button>
                        </div>
                        <h3 className="font-headline text-3xl md:text-4xl font-bold text-foreground leading-tight group-hover:text-gold transition-colors">
                          {featured.statement}
                        </h3>
                        {Array.isArray(featured.options) && featured.options.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {featured.options.map((opt: string, i: number) => (
                              <span key={i} className="text-sm px-3 py-1.5 rounded-full border border-border bg-secondary text-foreground font-medium">
                                {opt}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between border-t border-border pt-4">
                          <span className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">{featured.call_count || 0}</span> callers
                          </span>
                          <span className="text-sm font-bold text-gold flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" /> Trending
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>
                )}
              </div>

              {/* SIDEBAR */}
              <div className="flex flex-col gap-6">

                {/* Breaking News */}
                <section>
                  <div className="mb-4">
                    <h2 className="text-sm font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
                      <Zap className="h-4 w-4 text-gold" /> Breaking
                    </h2>
                  </div>
                  <div className="bg-secondary/20 border border-border rounded-2xl p-4 flex flex-col gap-3">
                    {breakingNews.map((item, i) => (
                      <div key={item.id}
                        onClick={() => navigate(`/opinion/${item.id}`)}
                        className="flex items-start gap-3 pb-3 border-b border-border/50 last:border-0 last:pb-0 cursor-pointer group">
                        <span className="text-muted-foreground font-mono text-xs mt-0.5 shrink-0">{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground group-hover:text-gold transition-colors line-clamp-2 leading-snug">
                            {item.statement}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {item.topics?.icon} {item.topics?.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Hot Topics */}
                <section>
                  <div className="mb-4">
                    <h2 className="text-sm font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
                      <Flame className="h-4 w-4 text-gold" /> Hot Topics
                    </h2>
                  </div>
                  <div className="bg-secondary/20 border border-border rounded-2xl p-4 flex flex-col gap-2">
                    {hotTopics.map((topic, i) => (
                      <div key={topic.slug}
                        onClick={() => navigate(`/topic/${topic.slug}`)}
                        className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 cursor-pointer group hover:bg-secondary/30 -mx-2 px-2 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground font-mono text-xs">{i + 1}.</span>
                          <span className="font-semibold text-foreground group-hover:text-gold transition-colors text-sm">
                            {topic.icon} {topic.name}
                          </span>
                        </div>
                        <Flame className="h-3.5 w-3.5 text-gold fill-gold/20" />
                      </div>
                    ))}
                    <button onClick={() => navigate("/topics")}
                      className="mt-2 w-full py-2 text-sm font-bold text-foreground border border-border rounded-xl hover:border-gold hover:text-gold hover:bg-gold/5 transition-colors">
                      Explore All
                    </button>
                  </div>
                </section>
              </div>
            </div>

            {/* ALL CALLS GRID */}
            <section className="mt-16 pt-10 border-t border-border">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="font-headline text-3xl font-bold">All Calls</h2>
                <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(0); }}
                  className="bg-background border border-border text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:border-gold transition-colors">
                  <option value="trending">Trending</option>
                  <option value="newest">Newest</option>
                </select>
              </div>

              {loading && page === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-64 rounded-2xl bg-secondary animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {opinions.map((op, i) => (
                    <OpinionCard key={op.id} data={mapOpinionToCard(op)} index={i} />
                  ))}
                </div>
              )}

              <div className="mt-10 flex justify-center">
                <button onClick={() => setPage(p => p + 1)} disabled={loading}
                  className="py-3 px-8 text-sm font-bold border border-border rounded-xl hover:border-gold hover:text-gold hover:bg-gold/5 transition-colors disabled:opacity-50">
                  {loading ? "Loading..." : "Load More Calls"}
                </button>
              </div>
            </section>
          </main>
        </div>
      )}
    </div>
  );
};

export default Index;