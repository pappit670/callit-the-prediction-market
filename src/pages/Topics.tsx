import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import OpinionCard from "@/components/OpinionCard";
import { sampleCards } from "@/data/sampleCards";
import { systemGeneratedCards } from "@/data/systemGeneratedCards";
import { Flame, Clock, BarChart3, TrendingUp, TrendingDown, LayoutGrid } from "lucide-react";

const allTopics = [
  "Local (Trending)", "Breaking", "Sports", "Crypto", "Tech",
  "Politics", "Culture", "Economy", "Science", "Markets"
];

const filters = [
  { id: "trending", label: "Trending", icon: <Flame className="h-4 w-4" /> },
  { id: "newest", label: "Newest", icon: <Clock className="h-4 w-4" /> },
  { id: "high-volume", label: "High Volume", icon: <TrendingUp className="h-4 w-4" /> },
  { id: "lowest", label: "Lowest", icon: <TrendingDown className="h-4 w-4" /> },
  { id: "closing-soon", label: "Closing Soon", icon: <BarChart3 className="h-4 w-4" /> },
];

const Topics = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedTopic = searchParams.get("topic") || "Local (Trending)";
  const selectedFilter = searchParams.get("filter") || "trending";

  const allCards = useMemo(() => [...sampleCards, ...systemGeneratedCards], []);

  const filteredCards = useMemo(() => {
    let filtered = allCards;
    
    // Filter by topic
    if (selectedTopic !== "Local (Trending)") {
      const cleanTopic = selectedTopic.replace(/\s*\(.*?\)/, "").trim();
      filtered = filtered.filter(card => 
        card.genre.toLowerCase().includes(cleanTopic.toLowerCase())
      );
    }

    // Sort by filter
    if (selectedFilter === "newest") {
      filtered = [...filtered].sort((a, b) => (b.id) - (a.id));
    } else if (selectedFilter === "high-volume") {
      filtered = [...filtered].sort((a, b) => b.coins - a.coins);
    } else if (selectedFilter === "lowest") {
      filtered = [...filtered].sort((a, b) => a.coins - b.coins);
    } else if (selectedFilter === "closing-soon") {
      filtered = [...filtered].filter(c => c.timeLeft.includes("hours") || c.timeLeft.includes("day"));
    }

    return filtered;
  }, [allCards, selectedTopic, selectedFilter]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
          
          {/* Sidebar */}
          <aside className="hidden md:flex flex-col gap-2 sticky top-24 self-start">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 px-3 flex items-center gap-2">
              <LayoutGrid className="h-3.5 w-3.5" /> Topics
            </h2>
            {allTopics.map(topic => (
              <button
                key={topic}
                onClick={() => setSearchParams({ topic, filter: selectedFilter })}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  selectedTopic === topic 
                    ? "bg-gold text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {topic}
              </button>
            ))}
          </aside>

          {/* Content Area */}
          <div className="flex flex-col gap-6">
            
            {/* Horizontal Filter Sub-nav */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {filters.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setSearchParams({ topic: selectedTopic, filter: filter.id })}
                  className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                    selectedFilter === filter.id
                      ? "bg-foreground text-background border-foreground"
                      : "bg-secondary/30 text-muted-foreground border-border hover:border-gold/50 hover:text-gold"
                  }`}
                >
                  {filter.icon}
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Grid Header */}
            <div className="flex items-center justify-between mt-4">
              <h1 className="font-headline text-3xl font-bold">
                {selectedTopic}
              </h1>
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
                <p className="text-muted-foreground">No opinions found for this category yet.</p>
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
