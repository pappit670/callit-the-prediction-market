import { useState, useRef } from "react";
import { motion } from "framer-motion";

const genres = [
  "Trending",
  "Sports",
  "Music & Culture",
  "Entertainment",
  "Crypto & Money",
  "Politics & Society",
  "Random",
  "Local",
];

const GenreTabs = ({ active, onSelect }: { active: string; onSelect: (g: string) => void }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative border-b border-border">
      <div
        ref={scrollRef}
        className="flex gap-1 overflow-x-auto px-4 md:px-0 scrollbar-hide"
      >
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => onSelect(g)}
            className="relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors"
          >
            <span className={active === g ? "text-foreground" : "text-muted-foreground hover:text-foreground"}>
              {g}
            </span>
            {active === g && (
              <motion.div
                layoutId="genre-underline"
                className="absolute bottom-0 left-2 right-2 h-0.5 bg-gold rounded-full"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GenreTabs;
