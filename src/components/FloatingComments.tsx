import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COMMENTS = [
  { user: "@KipS", text: "Called it weeks ago 🔥" },
  { user: "@NairobiWhale", text: "No way this happens" },
  { user: "@AlphaTrader", text: "Easy call Yes on this one" },
  { user: "@JaneX", text: "This is a trap, watch out" },
  { user: "@SatoshiN", text: "I'm all in on NO" },
  { user: "@Ochieng99", text: "Odds are too good to pass" },
  { user: "@CryptoKing", text: "Volume spike incoming 🚀" },
];

interface FloatingCommentsProps {
  delayOffset?: number;
}

export function FloatingComments({ delayOffset = 0 }: FloatingCommentsProps) {
  const [index, setIndex] = useState(-1);

  useEffect(() => {
    // Start with a delay
    const initialDelay = setTimeout(() => {
      setIndex(Math.floor(Math.random() * COMMENTS.length));
    }, delayOffset * 1000);

    return () => clearTimeout(initialDelay);
  }, [delayOffset]);

  useEffect(() => {
    if (index === -1) return;

    // Cycle every 5 seconds
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % COMMENTS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [index]);

  return (
    <div className="h-14 w-full flex justify-center items-center pointer-events-none -my-2 relative z-10">
      <AnimatePresence mode="wait">
        {index !== -1 && (
          <motion.div
            key={index}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: [20, -10], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 4, ease: "easeOut", times: [0, 0.1, 0.8, 1] }}
            className="bg-card border border-[#F5C518]/50 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-lg"
          >
            <div className="h-5 w-5 rounded-full bg-secondary flex items-center justify-center text-[9px] font-bold overflow-hidden border border-border shrink-0">
              {COMMENTS[index].user.charAt(1)}
            </div>
            <span className="text-[11px] font-bold text-[#F5C518]">{COMMENTS[index].user}</span>
            <span className="text-[11px] text-foreground truncate max-w-[200px]">
              {COMMENTS[index].text}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
