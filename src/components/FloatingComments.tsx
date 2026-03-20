import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const sampleComments = [
  { user: "wave_ke", text: "Called it weeks ago 🔥" },
  { user: "nai_guru", text: "No way this happens" },
  { user: "caller99", text: "Easy call Yes on this one" },
  { user: "contrarian", text: "The crowd is wrong here" },
  { user: "big_brain", text: "Contrarian play 👀" },
  { user: "ke_oracle", text: "Already called No" },
  { user: "mzalendo", text: "This one's obvious" },
];

const FloatingComments = ({ delayOffset = 0 }: { delayOffset?: number }) => {
  const [index, setIndex] = useState(-1);

  useEffect(() => {
    const startDelay = setTimeout(() => {
      setIndex(0);
    }, delayOffset);

    return () => clearTimeout(startDelay);
  }, [delayOffset]);

  useEffect(() => {
    if (index < 0) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % sampleComments.length);
    }, 4000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [index]);

  if (index < 0) return null;

  const comment = sampleComments[index];

  return (
    <div className="relative h-12 flex items-center justify-center overflow-visible">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1.5"
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: -20, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 3, ease: "easeOut" }}
        >
          <div className="h-5 w-5 rounded-full bg-secondary border border-border flex items-center justify-center text-[8px] font-bold text-muted-foreground shrink-0">
            {comment.user[0].toUpperCase()}
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground">
            {comment.user}
          </span>
          <span className="text-[11px] text-foreground">
            {comment.text.length > 40 ? comment.text.slice(0, 40) + "…" : comment.text}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default FloatingComments;
