import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Coins } from "lucide-react";
import { calculateNetWin, getMaxCall } from "@/lib/callit";

interface StakeModalProps {
  side: "yes" | "no";
  optionLabel?: string;
  question: string;
  yesPercent: number;
  noPercent: number;
  poolCoins: number;
  onClose: () => void;
}

const quickAmounts = [50, 100, 500, 1000];

const StakeModal = ({ side, optionLabel, question, yesPercent, noPercent, poolCoins, onClose }: StakeModalProps) => {
  const [amount, setAmount] = useState(100);
  const sidePercent = side === "yes" ? yesPercent : noPercent;
  const { netWin, floorApplied } = calculateNetWin(amount, sidePercent);
  const maxCall = getMaxCall(poolCoins);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-sm mx-4 rounded-2xl border border-gold-border bg-card p-6 shadow-xl"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {optionLabel ? `${optionLabel} ·` : ""} Call {side === "yes" ? "Yes" : "No"}
              </p>
              <p className="text-sm font-semibold text-foreground font-body line-clamp-2">{question}</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Side tabs */}
          <div className="flex rounded-lg overflow-hidden border border-border mb-4">
            <div className={`flex-1 py-2 text-center text-sm font-semibold transition-colors ${side === "yes" ? "bg-yes text-white" : "bg-secondary text-muted-foreground"}`}>
              Call Yes · {yesPercent}%
            </div>
            <div className={`flex-1 py-2 text-center text-sm font-semibold transition-colors ${side === "no" ? "bg-no text-white" : "bg-secondary text-muted-foreground"}`}>
              Call No · {noPercent}%
            </div>
          </div>

          {/* Amount input */}
          <label className="text-sm font-semibold text-foreground mb-2 block font-body">Amount</label>
          <div className="relative mb-3">
            <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold" />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2.5 text-base font-body text-foreground focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
          </div>

          {/* Quick amounts */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {quickAmounts.map((q) => (
              <button
                key={q}
                onClick={() => setAmount((prev) => prev + q)}
                className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-gold hover:text-gold transition-colors"
              >
                +{q}
              </button>
            ))}
            <button
              onClick={() => setAmount(maxCall)}
              className="rounded-full border border-gold px-2.5 py-1 text-xs font-medium text-gold hover:bg-gold hover:text-primary-foreground transition-colors"
            >
              Max
            </button>
          </div>

          {/* Return preview */}
          <div className="space-y-1 mb-4">
            <p className="text-[13px] font-medium text-gold">
              Projected win: +{Math.round(netWin + amount)} coins
            </p>
            <p className="text-xs font-medium text-yes">
              Net profit: +{Math.round(netWin)} coins
            </p>
            {floorApplied && (
              <p className="text-[11px] text-muted-foreground">Minimum win guarantee applied</p>
            )}
          </div>

          {/* Confirm */}
          <button className="w-full rounded-xl bg-gold py-3 text-base font-semibold text-primary-foreground hover:bg-gold-hover transition-colors animate-gold-pulse">
            Confirm Call
          </button>
          <p className="text-[11px] text-muted-foreground text-center mt-2">Coins deducted immediately on call</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StakeModal;
