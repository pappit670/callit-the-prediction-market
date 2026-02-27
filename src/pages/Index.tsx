import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import GenreTabs from "@/components/GenreTabs";
import OpinionCard from "@/components/OpinionCard";
import { sampleCards } from "@/data/sampleCards";

const Index = () => {
  const [activeGenre, setActiveGenre] = useState("Trending");
  const [mode, setMode] = useState<"overrated" | "underrated">("overrated");

  const filteredCards =
  activeGenre === "Trending" ?
  sampleCards :
  sampleCards.filter((c) => c.genre === activeGenre);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 md:px-6">
        {/* Genre Tabs */}
        <GenreTabs active={activeGenre} onSelect={setActiveGenre} />

        {/* Overrated / Underrated toggle */}
        <div className="flex items-center gap-1 py-4 bg-secondary text-primary-foreground">
          {(["overrated", "underrated"] as const).map((m) =>
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`relative rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
            mode === m ? "text-foreground" : "text-muted-foreground"}`
            }>

              {mode === m &&
            <motion.div
              layoutId="mode-pill"
              className="absolute inset-0 rounded-full bg-secondary"
              transition={{ type: "spring", stiffness: 400, damping: 30 }} />

            }
              <span className="relative z-10">{m}</span>
            </button>
          )}
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-5 pb-16">
          {filteredCards.length > 0 ?
          filteredCards.map((card, i) =>
          <OpinionCard key={card.id} data={card} index={i} />
          ) :

          <motion.p
            className="py-20 text-center text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}>

              No calls yet in this category. Be the first to call it.
            </motion.p>
          }
        </div>
      </main>
    </div>);

};

export default Index;