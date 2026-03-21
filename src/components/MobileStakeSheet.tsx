import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SlidingNumber } from "@/components/ui/sliding-number";

const optColor = (label: string, i: number): string => {
    const l = label.toLowerCase().trim();
    if (l === "yes" || l === "agree") return "#2563EB";
    if (l === "no" || l === "disagree") return "#DC2626";
    const multi = ["#F5C518", "#2563EB", "#DC2626", "#7C3AED", "#0891B2", "#059669"];
    return multi[i % multi.length];
};

const STAKE_OPTS = [10, 25, 50, 100, 250];

interface Props {
    opinion: any;
    options: string[];
    userCall: any;
    isOpen: boolean;
    hasActivity: boolean;
    latestProbabilities: Record<string, number>;
    countdown: string;
    onCall: (option: string, amount: number) => void;
    submitting: boolean;
    user: any;
    isLoggedIn: boolean;
    onClose: () => void;
}

export function MobileStakeSheet({
    opinion, options, userCall, isOpen: opinionOpen,
    hasActivity, latestProbabilities, countdown,
    onCall, submitting, user, isLoggedIn, onClose,
}: Props) {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2>(1);
    const [selected, setSelected] = useState<string | null>(userCall?.chosen_option || null);
    const [stakeAmount, setStakeAmount] = useState(50);

    const handleOptionClick = (opt: string) => {
        setSelected(opt);
        setStep(2);
    };

    const handleCall = () => {
        if (!isLoggedIn) { toast.error("Log in to call!"); navigate("/auth"); onClose(); return; }
        if (!selected) return;
        onCall(selected, stakeAmount);
        onClose();
    };

    const potentialReturn = stakeAmount * 2;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-end justify-center"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 28, stiffness: 300 }}
                    className="w-full max-w-lg bg-card rounded-t-2xl border-t border-border overflow-hidden"
                    onClick={e => e.stopPropagation()}
                    style={{ maxHeight: "90vh", overflowY: "auto" }}
                >
                    {/* Handle bar */}
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="h-1 w-10 rounded-full bg-border" />
                    </div>

                    {/* Step bar */}
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                        {step === 2 && (
                            <button onClick={() => setStep(1)}
                                className="text-muted-foreground hover:text-foreground transition-colors mr-1">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                        )}
                        <div className="flex items-center gap-1.5 flex-1">
                            <div className={`h-1 rounded-full flex-1 transition-colors ${step >= 1 ? "bg-foreground" : "bg-border"}`} />
                            <div className={`h-1 rounded-full flex-1 transition-colors ${step >= 2 ? "bg-foreground" : "bg-border"}`} />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium ml-2">
                            {step === 1 ? "Pick a side" : "Confirm stake"}
                        </span>
                        <button onClick={onClose}
                            className="ml-2 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {/* Step 1 */}
                        {step === 1 && (
                            <motion.div key="s1"
                                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}
                                className="p-4 space-y-3 pb-8">
                                <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                                    {opinion.statement}
                                </p>
                                {userCall && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" />
                                        <span className="text-xs text-muted-foreground">Your call:</span>
                                        <span className="text-xs font-bold text-foreground">{userCall.chosen_option}</span>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    {options.map((opt, i) => {
                                        const pct = hasActivity ? latestProbabilities[opt] : null;
                                        const color = optColor(opt, i);
                                        return (
                                            <button key={opt}
                                                onClick={() => opinionOpen && handleOptionClick(opt)}
                                                disabled={!opinionOpen}
                                                className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-border/60 bg-secondary/10 hover:bg-secondary/40 transition-all text-left disabled:opacity-60"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
                                                    <span className="text-base font-bold" style={{ color }}>{opt}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold tabular-nums"
                                                        style={{ color: pct !== null ? color : undefined }}>
                                                        {pct !== null ? `${pct}%` : "—"}
                                                    </span>
                                                    {opinionOpen && <span className="text-muted-foreground text-sm">→</span>}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                {!isLoggedIn && (
                                    <button onClick={() => { navigate("/auth"); onClose(); }}
                                        className="w-full py-3.5 rounded-xl border border-gold text-gold font-bold hover:bg-gold hover:text-primary-foreground transition-all">
                                        Log in to call
                                    </button>
                                )}
                            </motion.div>
                        )}

                        {/* Step 2 */}
                        {step === 2 && (
                            <motion.div key="s2"
                                initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.15 }}
                                className="p-4 space-y-4 pb-8">
                                {/* Selected recap */}
                                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/40 border border-border">
                                    <div className="h-2.5 w-2.5 rounded-full shrink-0"
                                        style={{ background: optColor(selected || "", options.indexOf(selected || "")) }} />
                                    <span className="text-base font-bold flex-1"
                                        style={{ color: optColor(selected || "", options.indexOf(selected || "")) }}>
                                        {selected}
                                    </span>
                                    {hasActivity && selected && (
                                        <span className="text-sm font-bold tabular-nums"
                                            style={{ color: optColor(selected, options.indexOf(selected)) }}>
                                            {latestProbabilities[selected]}%
                                        </span>
                                    )}
                                </div>

                                {/* Stake */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Stake amount</span>
                                        <span className="text-xs text-muted-foreground">
                                            Balance: <span className="text-foreground font-semibold">{(user?.balance || 0).toLocaleString()}</span> coins
                                        </span>
                                    </div>
                                    <div className="flex gap-2 mb-3 flex-wrap">
                                        {STAKE_OPTS.map(s => (
                                            <button key={s} onClick={() => setStakeAmount(s)}
                                                className={`flex-1 min-w-[50px] py-2.5 rounded-xl text-sm font-bold transition-all border ${stakeAmount === s
                                                        ? "bg-foreground text-background border-foreground"
                                                        : "border-border text-muted-foreground hover:border-foreground/30"
                                                    }`}>{s}</button>
                                        ))}
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">🪙</span>
                                        <input type="number" value={stakeAmount}
                                            onChange={e => setStakeAmount(Math.max(1, Math.min(user?.balance || 0, parseInt(e.target.value) || 0)))}
                                            className="w-full pl-9 pr-4 py-3 rounded-xl border border-border bg-secondary/30 text-base font-bold text-foreground focus:outline-none focus:border-gold transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Return */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-secondary/40 rounded-xl p-3 text-center">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">You stake</p>
                                        <p className="text-lg font-bold text-foreground">{stakeAmount}c</p>
                                    </div>
                                    <div className="rounded-xl p-3 text-center border border-[#22C55E]/20 bg-[#22C55E]/5">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">If correct</p>
                                        <p className="text-lg font-bold text-[#22C55E]">+{potentialReturn}c</p>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-0 border border-border rounded-xl overflow-hidden">
                                    {[
                                        { val: <SlidingNumber value={opinion.call_count || 0} />, label: "Callers" },
                                        { val: countdown, label: "Time left", border: true },
                                        { val: opinion.follower_count || 0, label: "Watching" },
                                    ].map((s, i) => (
                                        <div key={i} className={`text-center py-3 ${s.border ? "border-x border-border" : ""}`}>
                                            <p className="text-sm font-bold text-foreground">{s.val}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
                                        </div>
                                    ))}
                                </div>

                                <motion.button whileTap={{ scale: 0.97 }}
                                    onClick={handleCall}
                                    disabled={!selected || submitting || (user?.balance || 0) < stakeAmount}
                                    className="w-full py-4 rounded-xl bg-gold text-primary-foreground text-base font-black hover:bg-gold-hover transition-all disabled:opacity-40">
                                    {submitting ? "Placing..." : userCall ? "Update Call" : "Call It →"}
                                </motion.button>
                                <p className="text-[10px] text-muted-foreground text-center">
                                    {userCall ? "Updating is free" : `${stakeAmount} coins deducted on confirm`}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}