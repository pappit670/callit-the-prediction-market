import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, ArrowUpRight, ArrowDownLeft, Trophy, Star, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/* ── Coin rain particle (from ResolutionScreen pattern) ── */
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

const coinParticles = Array.from({ length: 18 }, (_, i) => ({
  delay: i * 0.12,
  x: Math.random() * 90 + 5,
}));

/* ── Count-up number ── */
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

/* ── Transaction data ── */
type TxType = "won" | "called" | "lost" | "refunded";

interface Transaction {
  id: number;
  type: TxType;
  label: string;
  timestamp: string;
  amount: number;
}

const transactions: Transaction[] = [
  { id: 1, type: "won", label: "Won: Will BTC hit 100k?", timestamp: "2h ago", amount: 480 },
  { id: 2, type: "called", label: "Called Yes: AI passes bar exam", timestamp: "4h ago", amount: -200 },
  { id: 3, type: "won", label: "Won: SpaceX lands Starship", timestamp: "1d ago", amount: 320 },
  { id: 4, type: "lost", label: "Lost: Lakers win finals", timestamp: "1d ago", amount: -150 },
  { id: 5, type: "refunded", label: "Refunded: Election voided", timestamp: "2d ago", amount: 100 },
  { id: 6, type: "called", label: "Called No: Gas drops below $3", timestamp: "2d ago", amount: -300 },
  { id: 7, type: "won", label: "Won: Tesla recall happens", timestamp: "3d ago", amount: 560 },
  { id: 8, type: "lost", label: "Lost: Fed cuts rates", timestamp: "4d ago", amount: -250 },
  { id: 9, type: "refunded", label: "Refunded: Cancelled event", timestamp: "5d ago", amount: 180 },
  { id: 10, type: "called", label: "Called Yes: iPhone price hike", timestamp: "6d ago", amount: -100 },
];

const txFilters: Array<{ key: TxType | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "called", label: "Called" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
  { key: "refunded", label: "Refunded" },
];

const txIcon: Record<TxType, React.ReactNode> = {
  won: <Trophy className="h-4 w-4" />,
  called: <ArrowUpRight className="h-4 w-4" />,
  lost: <Clock className="h-4 w-4" />,
  refunded: <Star className="h-4 w-4" />,
};

const txAmountClass: Record<TxType, string> = {
  won: "text-yes font-semibold",
  called: "text-muted-foreground",
  lost: "text-muted-foreground",
  refunded: "text-no font-semibold",
};

/* ── Stagger animation helpers ── */
const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
});

/* ── Main Wallet component ── */
const Wallet = () => {
  const navigate = useNavigate();
  const [showGift, setShowGift] = useState(false);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [txFilter, setTxFilter] = useState<TxType | "all">("all");

  const filtered = txFilter === "all" ? transactions : transactions.filter((t) => t.type === txFilter);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-2xl px-4 py-10 space-y-10">
        {/* ── Header ── */}
        <motion.div className="text-center" {...fadeUp(0)}>
          <h1 className="font-headline text-3xl sm:text-4xl text-foreground">Wallet</h1>
          <p className="mt-1 text-sm text-muted-foreground font-body">Your coins, your calls</p>
        </motion.div>

        {/* ── Balance Card ── */}
        <motion.div
          className="bg-card border border-gold-border rounded-[20px] p-10 text-center space-y-4"
          {...fadeUp(0.1)}
        >
          <Coins className="h-10 w-10 text-gold mx-auto" />
          <p className="text-sm text-muted-foreground font-body font-medium">Available Coins</p>
          <p className="font-headline text-[56px] leading-none font-bold text-gold">2,500</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <span className="bg-secondary rounded-full px-4 py-1.5 text-xs text-muted-foreground font-body">
              In active calls: 1,240
            </span>
            <span className="bg-secondary rounded-full px-4 py-1.5 text-xs text-muted-foreground font-body">
              Total won: 3,420
            </span>
          </div>
        </motion.div>

        {/* ── Action Buttons ── */}
        <motion.div className="flex gap-4 justify-center" {...fadeUp(0.2)}>
          {/* Deposit */}
          <div className="relative flex flex-col items-center">
            <span className="mb-1.5 rounded-full bg-gold/15 text-gold px-2.5 py-0.5 text-[10px] font-semibold">
              Coming Soon
            </span>
            <button
              onClick={() => setComingSoonOpen(true)}
              className="flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-gold-hover transition-colors"
            >
              <ArrowDownLeft className="h-4 w-4" />
              Deposit
            </button>
          </div>

          {/* Withdraw */}
          <div className="relative flex flex-col items-center">
            <span className="mb-1.5 rounded-full bg-gold/15 text-gold px-2.5 py-0.5 text-[10px] font-semibold">
              Coming Soon
            </span>
            <button
              onClick={() => setComingSoonOpen(true)}
              className="flex items-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowUpRight className="h-4 w-4" />
              Withdraw
            </button>
          </div>
        </motion.div>

        {/* ── Demo gift trigger (dev helper — remove in prod) ── */}
        <motion.div className="flex justify-center" {...fadeUp(0.25)}>
          <button
            onClick={() => setShowGift(true)}
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Preview signup gift
          </button>
        </motion.div>

        {/* ── Transaction History ── */}
        <motion.div className="space-y-4" {...fadeUp(0.3)}>
          <h2 className="font-headline text-lg text-foreground">History</h2>

          {/* Filter pills */}
          <div className="flex gap-2 flex-wrap">
            {txFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setTxFilter(f.key)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  txFilter === f.key
                    ? "bg-gold text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {filtered.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 rounded-xl bg-card border border-border p-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                  {txIcon[tx.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{tx.label}</p>
                  <p className="text-xs text-muted-foreground">{tx.timestamp}</p>
                </div>
                <span className={`text-sm whitespace-nowrap ${txAmountClass[tx.type]}`}>
                  {tx.amount > 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()} coins
                </span>
              </div>
            ))}
          </div>

          {/* Load more */}
          <div className="flex justify-center pt-2">
            <button className="rounded-full border border-gold text-gold px-6 py-2 text-sm font-semibold hover:bg-gold hover:text-primary-foreground transition-colors">
              Load more
            </button>
          </div>
        </motion.div>
      </main>

      {/* ── Coming Soon Dialog ── */}
      <Dialog open={comingSoonOpen} onOpenChange={setComingSoonOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-gold-border">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">Coming Soon</DialogTitle>
            <DialogDescription className="text-muted-foreground font-body">
              Real money deposits coming soon. Enjoy your free coins and keep calling.
            </DialogDescription>
          </DialogHeader>
          <button
            onClick={() => setComingSoonOpen(false)}
            className="mt-2 w-full rounded-full bg-gold py-2.5 text-sm font-semibold text-primary-foreground hover:bg-gold-hover transition-colors"
          >
            Got it
          </button>
        </DialogContent>
      </Dialog>

      {/* ── Signup Coin Gift Overlay ── */}
      <AnimatePresence>
        {showGift && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Coin rain */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {coinParticles.map((p, i) => (
                <CoinParticle key={i} delay={p.delay} x={p.x} />
              ))}
            </div>

            <div className="relative z-10 text-center space-y-6 px-6 max-w-md w-full">
              <motion.h1
                className="font-headline text-4xl sm:text-5xl text-foreground"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                You're in.
              </motion.h1>

              <motion.p
                className="font-headline text-5xl sm:text-6xl font-bold text-gold"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
              >
                +<CountUpNumber target={1000} /> coins
              </motion.p>

              <motion.button
                onClick={() => {
                  setShowGift(false);
                  navigate("/call-it");
                }}
                className="w-full rounded-full bg-gold py-3.5 text-base font-semibold text-primary-foreground hover:bg-gold-hover transition-colors animate-gold-pulse"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                Make My First Call
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Wallet;
