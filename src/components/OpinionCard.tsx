import { useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, Activity, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StakeModal from "./StakeModal";

export interface OpinionCardData {
  id: number;
  question: string;
  yesPercent: number;
  noPercent: number;
  coins: number;
  timeLeft: string;
  genre: string;
  status?: "open" | "locked" | "resolved" | "draw";
  winner?: "yes" | "no";
  isSystemGenerated?: boolean;
}

const getTopicIcon = (genre: string) => {
  // Simple emoji mapping for topic icons as requested "Top left: Icon representing the topic."
  const map: Record<string, string> = {
    "Local": "🇰🇪",
    "Sports": "⚽",
    "Crypto": "₿",
    "Tech": "💻",
    "Politics": "⚖️",
    "Culture": "🎭",
    "Economy": "📈",
    "Science": "🔬",
    "Markets": "📊",
    "Trending": "🔥",
    "News": "🚨",
  };
  
  // Extract base word if it has emojis currently
  const cleanGenre = genre.replace(/\s*[\u{1F000}-\u{1FFFF}]/u, "").trim();
  return map[cleanGenre] || "📰";
};

const OpinionCard = ({ data, index }: { data: OpinionCardData; index: number }) => {
  const { question, yesPercent, noPercent, coins, timeLeft, genre, status = "open" } = data;
  const navigate = useNavigate();
  const [stakeModal, setStakeModal] = useState<{ side: "yes" | "no"; optionLabel?: string } | null>(null);

  const isActive = status === "open" || status === "locked";
  const isLive = timeLeft.includes("hours") || timeLeft.includes("min") || timeLeft === "Live";

  const openStake = (side: "yes" | "no", optionLabel?: string) => {
    setStakeModal({ side, optionLabel });
  };

  return (
    <>
      <motion.div
        className="compact-card bg-card aspect-square flex flex-col justify-between cursor-pointer group hover:bg-secondary/10"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        onClick={() => navigate(`/opinion/${data.id}`)}
      >
        {/* TOP AREA */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-sm border border-border">
              {getTopicIcon(genre)}
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {genre.replace(/\s*[\u{1F000}-\u{1FFFF}]/u, "").trim()}
            </span>
          </div>
          <button 
            className="text-muted-foreground hover:text-gold opacity-0 group-hover:opacity-100 transition-all"
            onClick={(e) => { e.stopPropagation(); /* Bookmark action */ }}
          >
            <Bookmark className="h-4 w-4" />
          </button>
        </div>

        {/* CENTER AREA: Question */}
        <div className="flex-1 overflow-hidden flex flex-col justify-center">
          <h3 className="text-xl md:text-2xl font-headline font-bold text-foreground leading-tight line-clamp-4">
            {question}
          </h3>
        </div>

        {/* BOTTOM AREA */}
        <div className="mt-4 pt-4 border-t border-border flex flex-col gap-3">
          
          {/* Stats Bar */}
          <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
            <span className="font-semibold text-foreground flex items-center gap-1.5 uppercase">
              Vol ${(coins / 100).toFixed(1)}K
            </span>
            {isLive ? (
              <span className="flex items-center gap-1 text-gold">
                <Activity className="h-3 w-3" /> Live
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Timer className="h-3 w-3" /> {timeLeft}
              </span>
            )}
          </div>

          {/* Yes/No Interaction */}
          <div className="flex items-center gap-2 w-full">
            <button
              className="flex-1 flex items-center justify-between px-3 py-2 bg-secondary border border-border hover:border-yes hover:bg-yes/10 transition-colors"
              onClick={(e) => { e.stopPropagation(); openStake("yes"); }}
            >
              <span className="text-xs font-bold uppercase text-yes">Yes</span>
              <span className="font-mono text-sm font-bold text-foreground">{yesPercent}%</span>
            </button>
            
            <button
              className="flex-1 flex items-center justify-between px-3 py-2 bg-secondary border border-border hover:border-no hover:bg-no/10 transition-colors"
              onClick={(e) => { e.stopPropagation(); openStake("no"); }}
            >
              <span className="text-xs font-bold uppercase text-no">No</span>
              <span className="font-mono text-sm font-bold text-foreground">{noPercent}%</span>
            </button>
          </div>

        </div>
      </motion.div>

      {/* STAKE MODAL */}
      {stakeModal && (
        <StakeModal
          side={stakeModal.side}
          optionLabel={stakeModal.optionLabel}
          question={question}
          yesPercent={yesPercent}
          noPercent={noPercent}
          poolCoins={coins}
          onClose={() => setStakeModal(null)}
        />
      )}
    </>
  );
};

export default OpinionCard;
