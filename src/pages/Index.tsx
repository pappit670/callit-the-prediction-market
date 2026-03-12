import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import OpinionCard from "@/components/OpinionCard";
import { Flame, Bookmark, BarChart2 } from "lucide-react";
import { sampleCards } from "@/data/sampleCards";
import { systemGeneratedCards } from "@/data/systemGeneratedCards";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import FloatingComments from "@/components/FloatingComments";

const Index = () => {
  const navigate = useNavigate();
  const { hasSeenHero, setHasSeenHero } = useApp();
  
  const allCards = useMemo(() => [...sampleCards, ...systemGeneratedCards], []);
  
  // Featured Opinion Mock Data
  const featuredEvent = {
    id: 1, // linked to a valid id for routing
    topic: "Politics",
    question: "Will the US Federal Reserve lower interest rates in the next meeting?",
    yesProb: 65,
    volume: "1.2M",
    comments: 342,
  };

  // Breaking News (Quick Yes/No) Mock Data
  const breakingNews = [
    { id: 2, question: "Apple announces new AR headset next week?", yes: 45, no: 55 },
    { id: 3, question: "Bitcoin reaches $100K before EOY?", yes: 72, no: 28 },
    { id: 4, question: "SpaceX successfully lands Starship?", yes: 88, no: 12 }
  ];

  // Hot Topics Mock Data
  const hotTopics = [
    { id: 1, name: "CPI", volume: "$240K" },
    { id: 2, name: "Elon", volume: "$42M" },
    { id: 3, name: "Maxx", volume: "$70K" },
    { id: 4, name: "Georgia", volume: "$3M" },
    { id: 5, name: "Barcelona", volume: "$15M" }
  ];

  return (
    <div className="w-full relative">
      <Navbar />
      
      {/* ── LANDING HERO SCREEN ── */}
      {!hasSeenHero && (
        <div className="min-h-[calc(100vh-68px-45px)] w-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700 relative z-10 bg-background">
          <div className="max-w-3xl space-y-12 mb-10">
            <h1 className="font-headline text-6xl md:text-8xl lg:text-9xl font-bold text-foreground leading-[1.05] tracking-tight">
              My opinion.<br/>My call.<br/>My validation.
            </h1>
            <div>
              <button 
                onClick={() => {
                  setHasSeenHero(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="rounded-full bg-gold px-10 py-4 text-lg font-bold text-primary-foreground hover:bg-gold-hover hover:scale-105 transition-all shadow-xl animate-gold-pulse"
              >
                Call It Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN HOME FEED PAGE ── */}
      {hasSeenHero && (
        <div className="w-full pt-8 pb-20 animate-in slide-in-from-bottom-10 fade-in duration-700 bg-background relative z-10">
          <main className="mx-auto max-w-7xl px-4 md:px-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
              
              {/* PRIMARY CONTENT COLUMN */}
              <div className="flex flex-col gap-10">
                
                {/* 1. Featured Opinion Tab */}
                <section>
                  <div className="mb-3">
                    <h2 className="text-sm font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
                       <span className="h-2 w-2 rounded-full bg-gold animate-pulse"></span>
                       Featured Opinion
                    </h2>
                  </div>
                  <div 
                    onClick={() => navigate(`/opinion/${featuredEvent.id}`)}
                    className="w-full bg-card border border-border shadow-sm group hover:border-gold/50 transition-all p-6 relative overflow-hidden flex flex-col gap-6 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-bold uppercase tracking-widest text-gold bg-gold/10 px-2 py-1">{featuredEvent.topic}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toast.success("Added to bookmarks"); }}
                        className="text-muted-foreground hover:text-gold transition-colors"
                      >
                         <Bookmark className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <h3 className="font-headline text-3xl md:text-4xl font-bold text-foreground leading-tight group-hover:text-gold transition-colors">
                      {featuredEvent.question}
                    </h3>
                    
                    {/* Graph Mockup */}
                    <div className="w-full h-[140px] bg-secondary/30 rounded flex items-center justify-center border border-border relative overflow-hidden">
                       <BarChart2 className="h-10 w-10 text-muted-foreground/30" />
                       <span className="ml-2 text-sm text-muted-foreground font-medium">Live Probability Graph</span>
                       <div className="absolute inset-0 bg-gradient-to-t from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-4">
                      <div className="flex items-center gap-6">
                        <span className="text-sm font-semibold text-foreground flex items-center gap-1.5"><span className="text-muted-foreground font-normal">Vol</span> {featuredEvent.volume}</span>
                        <span className="text-sm font-semibold text-foreground flex items-center gap-1.5"><span className="text-muted-foreground font-normal">Comments</span> {featuredEvent.comments}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-sm font-bold text-yes">{featuredEvent.yesProb}% Yes</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. Breaking News Panel - Removed because it's now in the Navbar */}
                
              </div>

              {/* SECONDARY SIDEBAR COLUMN */}
              <div className="flex flex-col gap-8">
                
                {/* 3. Hot Topics Panel */}
                <section>
                  <div className="mb-4">
                    <h2 className="text-sm font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
                      <Flame className="h-4 w-4 text-gold" /> Hot Topics
                    </h2>
                  </div>
                  <div className="bg-secondary/20 border border-border p-5 flex flex-col gap-4">
                    {hotTopics.map((topic, i) => (
                      <div 
                        key={topic.id} 
                        onClick={() => navigate(`/topics?topic=${encodeURIComponent(topic.name)}`)}
                        className="flex items-center justify-between pb-3 border-b border-border/50 last:border-0 last:pb-0 cursor-pointer group hover:bg-secondary/30 -mx-2 px-2 transition-colors rounded"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground font-mono text-xs">{i + 1}.</span>
                          <span className="font-semibold text-foreground group-hover:text-gold transition-colors">{topic.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-muted-foreground group-hover:text-foreground transition-colors">{topic.volume} Today</span>
                          <Flame className="h-3.5 w-3.5 text-gold fill-gold/20" />
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => navigate("/topics")}
                      className="mt-2 w-full py-2.5 text-sm font-bold text-foreground border border-border hover:border-gold hover:text-gold hover:bg-gold/5 transition-colors"
                    >
                      Explore All
                    </button>
                  </div>
                </section>

              </div>
              
            </div>

            {/* 4. All Calls Grid */}
            <section className="mt-16 pt-10 border-t border-border">
               {/* Same header... */}
               <div className="mb-8 flex items-center justify-between">
                <h2 className="font-headline text-3xl font-bold flex items-center gap-3">
                  All Calls
                </h2>
                <div className="flex gap-2">
                   <select className="bg-background border border-border text-sm px-3 py-1.5 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors">
                     <option>Trending</option>
                     <option>High Volume</option>
                     <option>Ending Soon</option>
                   </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {allCards.map((card, i) => (
                  <div key={card.id}>
                    <OpinionCard data={card} index={i} />
                    {/* Add FloatingComments between some cards */}
                    {(i === 1 || i === 4 || i === 7) && (
                      <div className="col-span-1 md:col-span-2 lg:col-span-3 py-4">
                        <FloatingComments delayOffset={i * 500} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-10 flex justify-center">
                <button 
                  onClick={() => toast("Loading more calls...")}
                  className="py-3 px-8 text-sm font-bold border border-border hover:border-gold hover:text-gold hover:bg-gold/5 transition-colors"
                >
                  Load More Calls
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
