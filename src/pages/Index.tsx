import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import GenreTabs from "@/components/GenreTabs";
import FeaturedStrip from "@/components/FeaturedStrip";
import OpinionCard from "@/components/OpinionCard";
import FloatingComments from "@/components/FloatingComments";
import { sampleCards } from "@/data/sampleCards";
import { systemGeneratedCards, getTopPicks } from "@/data/systemGeneratedCards";

const Index = () => {
  const [activeGenre, setActiveGenre] = useState("Local 🇰🇪");
  const [mode, setMode] = useState<"overrated" | "underrated">("overrated");
  const navigate = useNavigate();

  const allCards = useMemo(() => [...sampleCards, ...systemGeneratedCards], []);
  const topPicks = useMemo(() => getTopPicks(5), []);

  const filteredCards = (() => {
    if (activeGenre === "Trending 🔥") return allCards;
    if (activeGenre === "Local 🇰🇪") return allCards.filter((c) => c.genre === "Local");
    const genreName = activeGenre.replace(/\s*[\u{1F000}-\u{1FFFF}]/u, "").trim();
    return allCards.filter((c) => c.genre === genreName);
  })();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <FeaturedStrip cards={topPicks} />
      <FeaturedStrip cards={topPicks} />

      <main className="mx-auto max-w-3xl px-4 md:px-6">
        <GenreTabs active={activeGenre} onSelect={setActiveGenre} />

        {/* Overrated / Underrated toggle */}
        <div className="flex items-center gap-1 py-4 bg-secondary text-primary-foreground">
          {(["overrated", "underrated"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`relative rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                mode === m ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {mode === m && (
                <motion.div
                  layoutId="mode-pill"
                  className="absolute inset-0 rounded-full bg-secondary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{m}</span>
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-2 pb-16">
          {filteredCards.length > 0 ? (
            filteredCards.map((card, i) => (
              <div key={card.id}>
                <OpinionCard data={card} index={i} />
                {(i === 1 || i === 3 || i === 5) && (
                  <FloatingComments delayOffset={i * 1500} />
                )}
              </div>
            ))
          ) : activeGenre === "Local 🇰🇪" ? (
            <motion.div
              className="py-20 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h3 className="font-heading text-xl text-muted-foreground mb-4">
                Nothing local yet — be first to call it
              </h3>
              <button
                onClick={() => navigate("/call-it")}
                className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-white hover:bg-gold/90 transition-colors"
              >
                Make a Local Call
              </button>
            </motion.div>
          ) : (
            <motion.p
              className="py-20 text-center text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              No calls yet in this category. Be the first to call it.
            </motion.p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
