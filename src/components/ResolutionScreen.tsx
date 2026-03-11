import { motion, AnimatePresence } from "framer-motion";
import { Coins, Share2, ArrowLeft, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { OpinionCardData } from "./OpinionCard";
import { DotPattern } from "./ui/dot-pattern";

interface ResolutionScreenProps {
  card: OpinionCardData;
  userWon: boolean;
  userPayout: number;
  onDismiss: () => void;
}

const CoinParticle = ({ delay, x }: { delay: number; x: number }) => (
  <motion.div
    className="absolute text-gold text-2xl pointer-events-none"
    initial={{ top: -40, left: `${x}%`, opacity: 1, rotate: 0 }}
    animate={{ top: "110%", opacity: 0, rotate: 360 }}
    transition={{ duration: 2.5, delay, ease: "easeOut" }}
  >
    <Coins className="h-6 w-6" />
  </motion.div>
);

const CountUpNumber = ({ target }: { target: number }) => {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const duration = 1500;
    const steps = 40;
    const increment = target / steps;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setCurrent(step >= steps ? target : Math.round(increment * step));
      if (step >= steps) clearInterval(interval);
    }, duration / steps);
    return () => clearInterval(interval);
  }, [target]);
  return <span>{current.toLocaleString()}</span>;
};

const coinParticles = Array.from({ length: 14 }, (_, i) => ({
  delay: i * 0.15,
  x: Math.random() * 90 + 5,
}));

const ResolutionScreen = ({ card, userWon, userPayout, onDismiss }: ResolutionScreenProps) => {
  const { question, coins, winner, callerCount } = card;
  const platformCut = Math.round(coins * 0.1);
  const distributed = Math.round(coins * 0.9);
  const isVoid = (callerCount ?? 0) < 10;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <DotPattern className="fill-[#F5C518]/15 [mask-image:radial-gradient(800px_circle_at_center,white,transparent)] z-0" width={20} height={20} cr={1.5} />
        {/* Coin rain for win */}
        {userWon && !isVoid && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {coinParticles.map((p, i) => (
              <CoinParticle key={i} delay={p.delay} x={p.x} />
            ))}
          </div>
        )}

        <div className="max-w-lg w-full px-6 text-center relative z-10">
          {/* Question */}
          <motion.h1
            className="font-headline text-2xl sm:text-3xl text-foreground mb-8 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            {question}
          </motion.h1>

          {isVoid ? (
            /* Void state */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="space-y-4"
            >
              <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto" />
              <h2 className="font-headline text-2xl text-muted-foreground">Void — Not enough callers</h2>
              <p className="text-sm text-muted-foreground font-body">
                This call needed at least 10 callers to resolve. Full refund issued.
              </p>
              <button
                onClick={onDismiss}
                className="mt-4 rounded-full border border-gold text-gold px-6 py-2.5 text-sm font-semibold font-body hover:bg-gold hover:text-primary-foreground transition-all duration-200"
              >
                Back to feed
              </button>
            </motion.div>
          ) : (
            <>
              {/* Winner reveal */}
              <motion.div
                className="mb-8"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5, type: "spring", stiffness: 200 }}
              >
                <span className={`font-headline text-6xl sm:text-7xl font-bold ${winner === "yes" ? "text-yes" : "text-no"}`}>
                  {winner === "yes" ? "Yes" : "No"}
                </span>
              </motion.div>

              {/* Pool breakdown */}
              <motion.div
                className="mb-8 space-y-1 text-sm text-muted-foreground font-body"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.4 }}
              >
                <p>Total pool: {coins.toLocaleString()} coins</p>
                <p>Callit cut (10%): {platformCut.toLocaleString()} coins</p>
                <p>Distributed to winners: {distributed.toLocaleString()} coins</p>
              </motion.div>

              {/* Win/Loss state */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.4 }}
              >
                {userWon ? (
                  <div className="space-y-4">
                    <h2 className="font-headline text-3xl sm:text-4xl text-gold">You called it.</h2>
                    <p className="font-headline text-4xl sm:text-5xl text-gold font-bold">
                      +<CountUpNumber target={userPayout} /> coins
                    </p>
                    {/* Min win floor label */}
                    <p className="text-[11px] text-muted-foreground font-body">
                      Minimum win guarantee applied
                    </p>
                    <button className="mt-4 rounded-full border border-gold text-gold px-6 py-2.5 text-sm font-semibold font-body hover:bg-gold hover:text-primary-foreground transition-all duration-200 inline-flex items-center gap-2">
                      <Share2 className="h-4 w-4" />
                      Show the world you called it
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h2 className="font-headline text-2xl text-muted-foreground">Tough call.</h2>
                    <p className="text-base text-muted-foreground font-body">
                      {userPayout.toLocaleString()} coins committed to this call
                    </p>
                    <p className="text-[13px] text-muted-foreground font-body">
                      Every call sharpens your instinct.
                    </p>
                    <button
                      onClick={onDismiss}
                      className="mt-2 rounded-full border border-gold text-gold px-6 py-2.5 text-sm font-semibold font-body hover:bg-gold hover:text-primary-foreground transition-all duration-200"
                    >
                      Make another call
                    </button>
                  </div>
                )}
              </motion.div>
            </>
          )}

          {/* Back to feed */}
          {!isVoid && (
            <motion.button
              onClick={onDismiss}
              className="mt-10 text-sm text-muted-foreground hover:text-foreground transition-colors font-body inline-flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.3 }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to feed
            </motion.button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ResolutionScreen;
