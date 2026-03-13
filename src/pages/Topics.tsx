import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import OpinionCard from "@/components/OpinionCard";
import { sampleCards } from "@/data/sampleCards";
import { systemGeneratedCards } from "@/data/systemGeneratedCards";
import { Flame, Clock, BarChart3, TrendingUp, TrendingDown, LayoutGrid, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/supabaseClient";

const filters = [
  { id: "trending", label: "Trending", icon: <Flame className="h-4 w-4" /> },
  { id: "newest", label: "Newest", icon: <Clock className="h-4 w-4" /> },
  { id: "high-volume", label: "High Volume", icon: <TrendingUp className="h-4 w-4" /> },
  { id: "lowest", label: "Lowest", icon: <TrendingDown className="h-4 w-4" /> },
  { id: "closing-soon", label: "Closing Soon", icon: <BarChart3 className="h-4 w-4" /> },
];

interface Topic {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  type: string;
  sport: string | null;
  country: string | null;
  parent_id: string | null;
}

const Topics = () => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [expandedSports, setExpandedSports] = useState<Set<string>>(new Set(['Sports']));
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState("Trending");
  const [selectedFilter, setSelectedFilter] = useState("trending");

  const allCards = useMemo(() => [...sampleCards, ...systemGeneratedCards], []);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('active', true)
      .order('type', { ascending: true })
      .order('name', { ascending: true });

    if (data && !error) setTopics(data);
    setLoading(false);
  };

  const groupedTopics = useMemo(() => {
    const categories = topics.filter(t => t.type === 'category');
    const leagues = topics.filter(t => t.type === 'league' || t.type === 'competition');

    const sportGroups: Record<string, Topic[]> = {};
    for (const league of leagues) {
      const sport = league.sport || 'other';
      if (!sportGroups[sport]) sportGroups[sport] = [];
      sportGroups[sport].push(league);
    }

    return { categories, sportGroups };
  }, [topics]);

  const toggleSport = (sport: string) => {
    setExpandedSports(prev => {
      const next = new Set(prev);
      if (next.has(sport)) next.delete(sport);
      else next.add(sport);
      return next;
    });
  };

  const filteredCards = useMemo(() => {
    let filtered = allCards;

    if (selectedTopic !== "Trending") {
      const cleanTopic = selectedTopic.toLowerCase();
      filtered = filtered.filter(card =>
        card.genre.toLowerCase().includes(cleanTopic)
      );
    }

    if (selectedFilter === "newest") {
      filtered = [...filtered].sort((a, b) => b.id - a.id);
    } else if (selectedFilter === "high-volume") {
      filtered = [...filtered].sort((a, b) => b.coins - a.coins);
    } else if (selectedFilter === "lowest") {
      filtered = [...filtered].sort((a, b) => a.coins - b.coins);
    } else if (selectedFilter === "closing-soon") {
      filtered = filtered.filter(c => c.timeLeft.includes("hours") || c.timeLeft.includes("day"));
    }

    return filtered;
  }, [allCards, selectedTopic, selectedFilter]);

  const sportEmojis: Record<string, string> = {
    football: '⚽',
    basketball: '🏀',
    tennis: '🎾',
    cricket: '🏏',
    athletics: '🏅',
    esports: '🎮',
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8">

          {/* Sidebar */}
          <aside className="hidden md:flex flex-col gap-1 sticky top-24 self-start max-h-[calc(100vh-120px)] overflow-y-auto pr-2">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 px-3 flex items-center gap-2">
              <LayoutGrid className="h-3.5 w-3.5" /> Categories
            </h2>

            {/* Trending */}
            <button
              onClick={() => navigate(`/topic/trending`)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${selectedTopic === 'Trending'
                ? "bg-gold text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
            >
              <Flame className="h-4 w-4" /> Trending
            </button>

            {/* Main categories */}
            {!loading && groupedTopics.categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => navigate(`/topic/${cat.slug}`)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${selectedTopic === cat.name
                  ? "bg-gold text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
              >
                <span>{cat.icon}</span> {cat.name}
              </button>
            ))}

            {/* Sports leagues */}
            <div className="mt-3">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                Leagues & Competitions
              </h2>
              {Object.entries(groupedTopics.sportGroups).map(([sport, leagues]) => (
                <div key={sport}>
                  <button
                    onClick={() => toggleSport(sport)}
                    className="w-full text-left px-4 py-2 text-sm font-bold text-foreground flex items-center justify-between hover:bg-secondary rounded-xl transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <span>{sportEmojis[sport] || '🏆'}</span>
                      <span className="capitalize">{sport}</span>
                    </span>
                    {expandedSports.has(sport)
                      ? <ChevronDown className="h-3.5 w-3.5" />
                      : <ChevronRight className="h-3.5 w-3.5" />
                    }
                  </button>

                  {expandedSports.has(sport) && (
                    <div className="ml-4 flex flex-col gap-0.5 mb-1">
                      {leagues.map(league => (
                        <button
                          key={league.id}
                          onClick={() => navigate(`/topic/${league.slug}`)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${selectedTopic === league.name
                            ? "bg-gold text-primary-foreground"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: league.color || '#F5C518' }}
                          />
                          {league.name}
                          {league.country && (
                            <span className="ml-auto text-[10px] opacity-60">{league.country}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>

          {/* Content Area */}
          <div className="flex flex-col gap-6">

            {/* Mobile topic scroll */}
            <div className="flex md:hidden gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => navigate(`/topic/trending`)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${selectedTopic === 'Trending'
                  ? "bg-gold text-primary-foreground border-gold"
                  : "bg-secondary/30 text-muted-foreground border-border"
                  }`}
              >
                🔥 Trending
              </button>
              {topics.map(topic => (
                <button
                  key={topic.id}
                  onClick={() => navigate(`/topic/${topic.slug}`)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${selectedTopic === topic.name
                    ? "bg-gold text-primary-foreground border-gold"
                    : "bg-secondary/30 text-muted-foreground border-border"
                    }`}
                >
                  {topic.icon} {topic.name}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {filters.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border transition-all ${selectedFilter === filter.id
                    ? "bg-foreground text-background border-foreground"
                    : "bg-secondary/30 text-muted-foreground border-border hover:border-gold/50 hover:text-gold"
                    }`}
                >
                  {filter.icon}
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mt-4">
              <h1 className="font-headline text-3xl font-bold">{selectedTopic}</h1>
              <span className="text-sm font-medium text-muted-foreground px-3 py-1 bg-secondary/50 rounded-full border border-border">
                {filteredCards.length} {filteredCards.length === 1 ? 'opinion' : 'opinions'}
              </span>
            </div>

            {/* Opinion Grid */}
            {filteredCards.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCards.map((card, i) => (
                  <OpinionCard key={card.id} data={card} index={i} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center border border-dashed border-border rounded-2xl">
                <p className="text-muted-foreground text-2xl mb-2">
                  {topics.find(t => t.name === selectedTopic)?.icon || '🔍'}
                </p>
                <p className="text-muted-foreground">No opinions yet for {selectedTopic}.</p>
                <button
                  onClick={() => navigate("/call-it")}
                  className="mt-4 text-gold font-bold hover:underline"
                >
                  Be the first to call it →
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Topics;