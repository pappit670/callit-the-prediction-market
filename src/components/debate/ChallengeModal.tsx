import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Swords, ChevronLeft } from "lucide-react";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";

interface Props {
  opinionId: string;
  opinionStatement: string;
  defenderUserId?: string;
  defenderAlias?: string;
  onClose: () => void;
}

const STAKE_AMOUNTS = [10, 25, 50, 100, 200];

export function ChallengeModal({
  opinionId, opinionStatement, defenderUserId, defenderAlias, onClose
}: Props) {
  const { user, isLoggedIn } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [argument, setArgument] = useState("");
  const [stake, setStake] = useState(50);
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleSubmit = async () => {
    if (!isLoggedIn) { toast.error("Log in first!"); navigate("/auth"); onClose(); return; }
    if (!argument.trim()) { toast.error("Add your argument!"); return; }
    if ((user?.balance || 0) < stake) { toast.error("Not enough coins!"); return; }

    setSubmitting(true);
    try {
      const { data: { user: au } } = await supabase.auth.getUser();
      if (!au) throw new Error("Not logged in");

      const alias = anonymous
        ? `Eagle ${Math.floor(Math.random() * 900 + 100)}`
        : (user?.username || "Challenger");

      const { error } = await supabase.from("debates").insert({
        opinion_id: opinionId,
        challenger_id: au.id,
        defender_id: defenderUserId || null,
        challenger_argument: argument.trim(),
        challenger_stake: stake,
        defender_stake: stake,
        status: "open",
        challenger_alias: alias,
        defender_alias: defenderAlias || "Defender",
        anonymous: anonymous,
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      });

      if (error) throw error;
      toast.success("Challenge posted! Waiting for a defender.");
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to post challenge");
    } finally { setSubmitting(false); }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          className="w-full max-w-md bg-card border border-border rounded-2xl overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              {step === 2 && (
                <button onClick={() => setStep(1)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors mr-1">
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              <Swords className="h-5 w-5 text-gold" />
              <span className="text-sm font-bold text-foreground">
                {step === 1 ? "Issue a Challenge" : "Set Your Stake"}
              </span>
            </div>
            <button onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1 — Argument */}
            {step === 1 && (
              <motion.div key="s1"
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}
                className="p-5 space-y-4">
                {/* Opinion preview */}
                <div className="px-3 py-2.5 rounded-xl bg-secondary/50 border border-border/60">
                  <p className="text-xs text-muted-foreground line-clamp-2">"{opinionStatement}"</p>
                </div>

                {/* Defender info */}
                {defenderAlias && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gold/8 border border-gold/20">
                    <Swords className="h-3.5 w-3.5 text-gold" />
                    <span className="text-xs font-semibold text-gold">
                      Challenging {defenderAlias}
                    </span>
                  </div>
                )}

                {/* Argument */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                    Your Opening Argument
                  </label>
                  <textarea
                    value={argument}
                    onChange={e => setArgument(e.target.value)}
                    placeholder="State your position clearly. Why do you disagree?"
                    rows={4}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold transition-colors resize-none"
                  />
                </div>

                {/* Anonymous */}
                <div className="flex items-center justify-between py-2 border-t border-border">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Challenge anonymously</p>
                    <p className="text-[10px] text-muted-foreground">Use a random alias</p>
                  </div>
                  <button onClick={() => setAnonymous(a => !a)}
                    className={`h-6 w-11 rounded-full p-1 transition-colors relative ${anonymous ? "bg-gold" : "bg-secondary border border-border"}`}>
                    <motion.div
                      animate={{ x: anonymous ? 20 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="h-4 w-4 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>

                <button
                  onClick={() => { if (!argument.trim()) { toast.error("Add your argument first!"); return; } setStep(2); }}
                  className="w-full py-3.5 rounded-xl bg-gold text-primary-foreground text-sm font-bold hover:bg-gold-hover transition-all">
                  Next — Set Stake →
                </button>
              </motion.div>
            )}

            {/* Step 2 — Stake */}
            {step === 2 && (
              <motion.div key="s2"
                initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.15 }}
                className="p-5 space-y-4">
                {/* Argument preview */}
                <div className="px-3 py-2.5 rounded-xl bg-secondary/50 border border-border/60">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Your argument</p>
                  <p className="text-xs text-foreground line-clamp-2">"{argument}"</p>
                </div>

                {/* Stake selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Stake Amount
                    </label>
                    <span className="text-xs text-muted-foreground">
                      Balance: <span className="text-foreground font-bold">{(user?.balance || 0).toLocaleString()}</span>c
                    </span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {STAKE_AMOUNTS.map(s => (
                      <button key={s} onClick={() => setStake(s)}
                        className={`flex-1 min-w-[48px] py-2.5 rounded-xl text-xs font-bold border transition-all ${stake === s
                            ? "bg-foreground text-background border-foreground"
                            : "border-border text-muted-foreground hover:border-foreground/30"
                          }`}>{s}</button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">🪙</span>
                    <input type="number" value={stake}
                      onChange={e => setStake(Math.max(1, Math.min(user?.balance || 0, parseInt(e.target.value) || 0)))}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-border bg-secondary/30 text-sm font-bold text-foreground focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>
                </div>

                {/* Win/lose breakdown */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-secondary/40 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">You risk</p>
                    <p className="text-base font-bold text-foreground">{stake}c</p>
                  </div>
                  <div className="rounded-xl p-3 text-center border border-[#22C55E]/20 bg-[#22C55E]/5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">If you win</p>
                    <p className="text-base font-bold text-[#22C55E]">+{stake * 2}c</p>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground text-center">
                  Debate runs for 7 days · Community votes decide the winner
                </p>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmit}
                  disabled={submitting || (user?.balance || 0) < stake}
                  className="w-full py-3.5 rounded-xl bg-gold text-primary-foreground text-sm font-bold hover:bg-gold-hover transition-all disabled:opacity-40">
                  {submitting ? "Posting..." : `Challenge — ${stake} coins`}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}