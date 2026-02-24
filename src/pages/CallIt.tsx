import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins } from "lucide-react";
import Navbar from "@/components/Navbar";
import OpinionCard from "@/components/OpinionCard";

const categories = [
  "Trending", "Sports", "Music & Culture", "Entertainment",
  "Crypto & Money", "Politics & Society", "Random", "Local",
];

const durations = ["24 Hours", "3 Days", "7 Days", "14 Days"];

const durationToTimeLeft: Record<string, string> = {
  "24 Hours": "24 hours left",
  "3 Days": "3 days left",
  "7 Days": "7 days left",
  "14 Days": "14 days left",
};

const fakeSuggestions = [
  { question: "Will Drake drop a new album this year?", yesPercent: 62, noPercent: 38, coins: 980 },
  { question: "Is hip hop the biggest genre right now?", yesPercent: 74, noPercent: 26, coins: 1540 },
];

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const CallIt = () => {
  const [question, setQuestion] = useState("");
  const [declared, setDeclared] = useState<"yes" | "no" | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [stake, setStake] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState(false);

  const shouldShowSuggestions = question.length > 10 && showSuggestions && !dismissedSuggestions;

  const previewData = useMemo(() => ({
    id: 0,
    question: question || "Your question will appear here...",
    yesPercent: declared === "yes" ? 100 : declared === "no" ? 0 : 50,
    noPercent: declared === "no" ? 100 : declared === "yes" ? 0 : 50,
    coins: Number(stake) || 0,
    timeLeft: duration ? durationToTimeLeft[duration] : "—",
    genre: category || "Category",
    creator: "you",
  }), [question, declared, category, duration, stake]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-[600px] px-4 md:px-6 py-10 pb-20">
        {/* Page title */}
        <motion.div
          custom={0}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="mb-10 text-center"
        >
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-foreground mb-2">
            Call It
          </h1>
          <p className="text-sm text-muted-foreground">
            Put something real out there. Back it with conviction.
          </p>
        </motion.div>

        {/* SECTION 1 — Question Input */}
        <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="visible" className="mb-6">
          <input
            type="text"
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              if (e.target.value.length > 10) setShowSuggestions(true);
            }}
            placeholder="What's your call? Ask it as a question..."
            className="w-full rounded-lg border border-border bg-secondary px-4 py-4 text-base font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 focus:shadow-[0_0_16px_hsl(var(--gold)/0.15)] transition-all duration-200"
          />
        </motion.div>

        {/* SECTION 2 — AI Suggestion Strip */}
        <AnimatePresence>
          {shouldShowSuggestions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="mb-6 overflow-hidden"
            >
              <p className="text-xs font-medium text-muted-foreground mb-3">
                Similar opinions already live:
              </p>
              <div className="flex flex-col gap-3">
                {fakeSuggestions.map((s, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.question}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-bold text-yes">Yes {s.yesPercent}%</span>
                        <span className="text-xs font-bold text-no">No {s.noPercent}%</span>
                        <span className="text-xs text-gold font-semibold">{s.coins} coins</span>
                      </div>
                    </div>
                    <button className="shrink-0 rounded-full border border-gold text-gold px-3 py-1 text-xs font-semibold hover:bg-gold hover:text-primary-foreground transition-all duration-200">
                      Join this one
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setDismissedSuggestions(true)}
                className="mt-3 text-xs font-medium text-gold hover:text-gold-hover transition-colors"
              >
                Mine is different, continue →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SECTION 3 — Declare Your Answer */}
        <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible" className="mb-8">
          <p className="text-base font-semibold text-foreground mb-4">I'm calling it...</p>
          <div className="grid grid-cols-2 gap-4">
            {(["yes", "no"] as const).map((side) => {
              const isYes = side === "yes";
              const selected = declared === side;
              const otherSelected = declared !== null && declared !== side;
              return (
                <motion.button
                  key={side}
                  onClick={() => setDeclared(side)}
                  whileTap={{ scale: 0.98 }}
                  animate={selected ? { scale: 1.02 } : { scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`rounded-xl border-2 py-8 text-center font-bold text-2xl transition-all duration-200 ${
                    selected
                      ? isYes
                        ? "border-yes bg-yes text-primary-foreground shadow-lg"
                        : "border-no bg-no text-primary-foreground shadow-lg"
                      : otherSelected
                        ? isYes
                          ? "border-yes/30 bg-yes-faded text-yes/40"
                          : "border-no/30 bg-no-faded text-no/40"
                        : isYes
                          ? "border-yes bg-yes-faded text-yes hover:bg-yes/20"
                          : "border-no bg-no-faded text-no hover:bg-no/20"
                  }`}
                >
                  {isYes ? "Yes" : "No"}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* SECTION 4 — Category Selector */}
        <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible" className="mb-8">
          <p className="text-base font-semibold text-foreground mb-4">Pick a category</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                  category === c
                    ? "bg-gold text-primary-foreground"
                    : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </motion.div>

        {/* SECTION 5 — Time Limit */}
        <motion.div custom={4} variants={sectionVariants} initial="hidden" animate="visible" className="mb-8">
          <p className="text-base font-semibold text-foreground mb-4">How long should this run?</p>
          <div className="flex flex-wrap gap-2">
            {durations.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                  duration === d
                    ? "bg-gold text-primary-foreground"
                    : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </motion.div>

        {/* SECTION 6 — Founding Stake */}
        <motion.div custom={5} variants={sectionVariants} initial="hidden" animate="visible" className="mb-8">
          <p className="text-base font-semibold text-foreground mb-4">Back your opinion with coins</p>
          <div className="relative">
            <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold" />
            <input
              type="number"
              min={0}
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-border bg-secondary pl-10 pr-4 py-3 text-base font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 focus:shadow-[0_0_16px_hsl(var(--gold)/0.15)] transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          {stake && declared && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-sm text-muted-foreground"
            >
              You're staking <span className="text-gold font-semibold">{Number(stake).toLocaleString()}</span> coins on{" "}
              <span className={declared === "yes" ? "text-yes font-semibold" : "text-no font-semibold"}>
                {declared === "yes" ? "Yes" : "No"}
              </span>
            </motion.p>
          )}
        </motion.div>

        {/* SECTION 7 — Live Preview Card */}
        <motion.div custom={6} variants={sectionVariants} initial="hidden" animate="visible" className="mb-8">
          <p className="text-xs font-medium text-muted-foreground mb-3">Your call will look like this:</p>
          <div className="transition-all duration-150">
            <OpinionCard data={previewData} index={0} />
          </div>
        </motion.div>

        {/* SECTION 8 — Post It Button */}
        <motion.div custom={7} variants={sectionVariants} initial="hidden" animate="visible">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-full bg-gold py-4 text-base font-semibold text-primary-foreground hover:bg-gold-hover transition-colors duration-200 animate-gold-pulse"
          >
            Post It
          </motion.button>
        </motion.div>
      </main>
    </div>
  );
};

export default CallIt;
