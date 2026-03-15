import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Flame, LayoutGrid } from "lucide-react";
import { supabase } from "@/supabaseClient";

const Topics = () => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("topics")
      .select("*")
      .eq("type", "category")
      .eq("active", true)
      .order("name")
      .then(({ data }) => {
        setTopics(data || []);
        setLoading(false);
      });
  }, []);

  const topicDescriptions: Record<string, string> = {
    politics: "Elections, leaders, policy and global governance",
    sports: "Football, basketball, tennis, cricket and more",
    crypto: "Bitcoin, Ethereum, DeFi, NFTs and Web3",
    tech: "AI, startups, Apple, Google, Space and gaming",
    entertainment: "Music, film, hip hop, Afrobeats and celebrity",
    business: "Stocks, forex, real estate and African markets",
    world: "Conflict, climate, Africa, Asia and diplomacy",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 md:px-6 py-12">

        <div className="mb-10">
          <h1 className="font-headline text-4xl font-bold text-foreground mb-2">Topics</h1>
          <p className="text-muted-foreground">Pick a topic to explore all opinions and subtopics within it.</p>
        </div>

        {/* Trending first */}
        <div
          onClick={() => navigate("/topic/trending")}
          className="mb-6 p-6 bg-gold/10 border border-gold/30 rounded-2xl cursor-pointer hover:bg-gold/20 transition-all flex items-center gap-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-gold flex items-center justify-center text-2xl">
            <Flame className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Trending</h2>
            <p className="text-sm text-muted-foreground">The hottest opinions across all categories right now</p>
          </div>
        </div>

        {/* All categories grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-36 rounded-2xl bg-secondary animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((topic) => (
              <div
                key={topic.id}
                onClick={() => navigate(`/topic/${topic.slug}`)}
                className="p-6 bg-card border border-border rounded-2xl cursor-pointer hover:border-gold/50 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border border-border flex-shrink-0"
                    style={{ background: (topic.color || "#F5C518") + "20" }}
                  >
                    {topic.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-foreground group-hover:text-gold transition-colors">
                      {topic.name}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {topicDescriptions[topic.slug] || topic.description || "Explore opinions in this category"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Tap to explore</span>
                  <span className="text-xs font-semibold text-gold">→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Topics;