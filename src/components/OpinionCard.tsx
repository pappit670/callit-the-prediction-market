import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Activity, Timer, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import StakeModal from "./StakeModal";
import MiniGraph from "./MiniGraph";

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
  const { isLoggedIn } = useApp();
  const [stakeModal, setStakeModal] = useState<{ side: "yes" | "no"; optionLabel?: string } | null>(null);
  const [currentCommentIndex, setCurrentCommentIndex] = useState(0);

  const sampleComments = [
    "Called it! 🔥", "No way this happens", "Easy Yes", "Crowd is wrong",
    "Smart money is on Yes", "Wait for the dip", "Big if true", "Calling it now"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCommentIndex((prev) => (prev + 1) % sampleComments.length);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  const isActive = status === "open" || status === "locked";
  const isLive = timeLeft.includes("hours") || timeLeft.includes("min") || timeLeft === "Live";

  const openStake = (side: "yes" | "no", optionLabel?: string) => {
    if (!isLoggedIn) {
      toast.error("Please log in to stake your coins!");
      navigate("/auth");
      return;
    }
    setStakeModal({ side, optionLabel });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.origin + "/opinion/" + data.id);
    toast.success("Link copied to clipboard!");
  };

  return (
    <>
      <motion.div
        className="compact-card bg-card aspect-square flex flex-col justify-between cursor-pointer group hover:bg-secondary/10 relative overflow-hidden"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        onClick={() => navigate(`/opinion/${data.id}`)}
      >
        {/* Internal Floating Comment */}
        <div className="absolute top-2 right-12 z-20 pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCommentIndex}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="bg-gold/10 backdrop-blur-sm border border-gold/20 rounded-full px-2 py-0.5 text-[9px] font-bold text-gold"
            >
              {sampleComments[currentCommentIndex]}
            </motion.div>
          </AnimatePresence>
        </div>

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
          <div className="flex items-center gap-2 z-10">
            <button 
              className="text-muted-foreground hover:text-gold transition-all"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button 
              className="text-muted-foreground hover:text-gold transition-all"
              onClick={(e) => { e.stopPropagation(); toast.success("Added to bookmarks"); }}
            >
              <Bookmark className="h-4 w-4 fill-current" />
            </button>
          </div>
        </div>

        {/* CENTER AREA: Question + Image */}
        <div className="flex-1 overflow-hidden flex flex-col justify-center">
          <div className="flex items-start gap-3 mb-4">
             <div className="h-12 w-12 rounded-lg bg-secondary/50 shrink-0 flex items-center justify-center text-2xl border border-border/50">
               {getTopicIcon(genre)}
             </div>
             <h3 className="text-lg md:text-xl font-headline font-bold text-foreground leading-tight line-clamp-3">
              {question}
            </h3>
          </div>
          
          <MiniGraph yesPercent={yesPercent} noPercent={noPercent} seed={data.id} />
        </div>

        {/* BOTTOM AREA */}
        <div className="mt-2 pt-4 border-t border-border flex flex-col gap-3">
          
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
