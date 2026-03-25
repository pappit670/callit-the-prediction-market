// src/components/MobileStakeSheet.tsx — FINAL
//
// KEY CHANGES:
//  1. Sheet rises to 95vh so all options are always visible
//  2. Named options (not YES/NO) show with their own YES/NO sub-stake
//     e.g. "Ruto" gets a YES/NO toggle below it
//     staking YES on Ruto = you believe Ruto wins
//     staking NO on Ruto  = you believe Ruto does NOT win
//     each name is an independent pool — staking YES on Ruto and YES on Raila
//     are completely separate bets
//  3. Removed the "X coins deducted on confirm" line below the CTA
//  4. Gold CTA matches brand

import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SlidingNumber } from "@/components/ui/sliding-number";

// ── Helpers ───────────────────────────────────────────────────
const isYN = (label: string) =>
    ["yes", "no", "agree", "disagree"].includes(label.toLowerCase().trim());

const isNamedOption = (opts: string[]) =>
    opts.length >= 2 && !opts.every(o => isYN(o));

const optColor = (label: string, i: number): string => {
    const l = label.toLowerCase().trim();
    if (l === "yes" || l === "agree") return "#2563EB";
    if (l === "no" || l === "disagree") return "#DC2626";
    const multi = ["#7C3AED", "#0891B2", "#059669", "#EA580C", "#2563EB", "#DC2626"];
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
    const sheetRef = useRef<HTMLDivElement>(null);
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedName, setSelectedName] = useState<string | null>(null);
    const [selectedSide, setSelectedSide] = useState<"yes" | "no" | null>(null);
    const [stakeAmount, setStakeAmount] = useState(50);

    // For plain YES/NO questions, selectedName is the option directly
    const isNamed = isNamedOption(options);

    // The final option string we send to onCall
    // For named: "Ruto:yes" or "Ruto:no"
    // For plain YES/NO: "YES" or "NO"
    const finalOption = isNamed
        ? (selectedName && selectedSide ? `${selectedName}:${selectedSide}` : null)
        : selectedName;

    const canProceed = !!finalOption;

    useEffect(() => {
        document.body.style.overflow = "hidden";
        document.body.style.touchAction = "none";
        return () => {
            document.body.style.overflow = "";
            document.body.style.touchAction = "";
        };
    }, []);

    useEffect(() => {
        const el = sheetRef.current;
        if (!el) return;
        const stop = (e: TouchEvent) => e.stopPropagation();
        el.addEventListener("touchmove", stop, { passive: false });
        return () => el.removeEventListener("touchmove", stop);
    }, []);

    const calcOdds = (opt: string): number => {
        const pct = latestProbabilities[opt];
        if (!pct || pct <= 0) return 2.0;
        return Math.round((100 / pct) * 10) / 10;
    };

    const calcReturn = (opt: string, amount: number): number =>
        Math.round(amount * calcOdds(opt) * 0.95);

    const handleCall = () => {
        if (!isLoggedIn) { toast.error("Log in to call!"); navigate("/auth"); onClose(); return; }
        if (!finalOption) return;
        onCall(finalOption, stakeAmount);
        onClose();
    };

    // ── Step 2: Amount + confirm ──────────────────────────────
    const renderStep2 = () => {
        if (!finalOption) return null;

        // Display label for the recap
        const displayLabel = isNamed && selectedName && selectedSide
            ? `${selectedName} — ${selectedSide.toUpperCase()}`
            : finalOption;

        const color = isNamed && selectedSide === "yes" ? "#2563EB" :
            isNamed && selectedSide === "no" ? "#DC2626" :
                optColor(finalOption, 0);

        const odds = calcOdds(isNamed ? selectedName! : finalOption);
        const ret = calcReturn(isNamed ? selectedName! : finalOption, stakeAmount);
        const pct = hasActivity ? latestProbabilities[isNamed ? selectedName! : finalOption] : null;

        return (
            <motion.div key="s2"
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.15 }}
                className="px-4 pt-4 pb-6 space-y-4">

                {/* Selected recap */}
                <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border"
                    style={{ borderColor: color + "40", background: color + "08" }}>
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-base font-bold flex-1" style={{ color }}>
                        {displayLabel}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: "#F5C518" }}>{odds}x</span>
                        {pct !== null && (
                            <span className="text-sm font-bold tabular-nums text-muted-foreground">{pct}%</span>
                        )}
                    </div>
                </div>

                {/* Stake amount */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Stake Amount</span>
                        <span className="text-xs text-muted-foreground">
                            Balance: <span className="text-foreground font-bold">{(user?.balance || 0).toLocaleString()}</span>c
                        </span>
                    </div>
                    <div className="flex gap-2 mb-3">
                        {STAKE_OPTS.map(s => (
                            <button key={s} onClick={() => setStakeAmount(s)}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${stakeAmount === s ? "bg-foreground text-background border-foreground"
                                        : "border-border text-muted-foreground hover:border-foreground/30"}`}>
                                {s}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🪙</span>
                        <input type="number" value={stakeAmount}
                            onChange={e => setStakeAmount(Math.max(1, Math.min(user?.balance || 0, parseInt(e.target.value) || 0)))}
                            className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-border bg-secondary/30 text-base font-bold text-foreground focus:outline-none focus:border-foreground/40 transition-colors" />
                    </div>
                </div>

                {/* Return preview */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-secondary/40 rounded-2xl p-4 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">You Stake</p>
                        <p className="text-xl font-bold text-foreground">{stakeAmount}c</p>
                    </div>
                    <div className="rounded-2xl p-4 text-center border border-[#22C55E]/20 bg-[#22C55E]/5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">If Correct</p>
                        <p className="text-xl font-bold text-[#22C55E]">+{ret}c</p>
                        <p className="text-[10px] font-semibold mt-0.5" style={{ color: "#F5C518" }}>{odds}x return</p>
                    </div>
                </div>

                {/* Market stats */}
                <div className="grid grid-cols-3 border border-border rounded-2xl overflow-hidden">
                    {[
                        { val: <SlidingNumber value={opinion.call_count || 0} />, label: "Callers" },
                        { val: countdown || "—", label: "Time Left", mid: true },
                        { val: opinion.follower_count || 0, label: "Watching" },
                    ].map((s, i) => (
                        <div key={i} className={`text-center py-3 ${s.mid ? "border-x border-border" : ""}`}>
                            <p className="text-sm font-bold text-foreground">{s.val}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* CTA — gold, no text below */}
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleCall}
                    disabled={!finalOption || submitting || (user?.balance || 0) < stakeAmount}
                    className="w-full py-4 rounded-2xl text-base font-black transition-all disabled:opacity-40"
                    style={{ background: "#F5C518", color: "#0a0a0a" }}>
                    {submitting ? "Placing..." : userCall ? "Update Call →" : "Call It →"}
                </motion.button>
            </motion.div>
        );
    };

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div key="backdrop"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
                style={{ touchAction: "none" }} onClick={onClose} />

            {/* Sheet — 95vh so all options always visible */}
            <motion.div key="sheet" ref={sheetRef}
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 280 }}
                className="fixed bottom-0 left-0 right-0 z-[81] bg-card rounded-t-3xl border-t border-border shadow-2xl"
                style={{ maxHeight: "95vh", display: "flex", flexDirection: "column" }}
                onClick={e => e.stopPropagation()}>

                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1 shrink-0">
                    <div className="h-1 w-12 rounded-full bg-border/60" />
                </div>

                {/* Step bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
                    {step === 2 && (
                        <button onClick={() => { setStep(1); }}
                            className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                    )}
                    <div className="flex items-center gap-1.5 flex-1">
                        <div className={`h-1 rounded-full flex-1 transition-colors ${step >= 1 ? "bg-foreground" : "bg-border"}`} />
                        <div className={`h-1 rounded-full flex-1 transition-colors ${step >= 2 ? "bg-foreground" : "bg-border"}`} />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium mx-2">
                        {step === 1 ? "Pick a side" : "Confirm stake"}
                    </span>
                    <button onClick={onClose}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto overscroll-contain"
                    style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}>
                    <AnimatePresence mode="wait">

                        {/* ── STEP 1: Pick a side ── */}
                        {step === 1 && (
                            <motion.div key="s1"
                                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.15 }}
                                className="px-4 pt-4 pb-8 space-y-3">

                                <p className="text-sm font-semibold text-foreground leading-snug">
                                    {opinion.statement}
                                </p>

                                {userCall && (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50 border border-border">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" />
                                        <span className="text-xs text-muted-foreground">Your call:</span>
                                        <span className="text-xs font-bold text-foreground">{userCall.chosen_option}</span>
                                    </div>
                                )}

                                {/* ── NAMED OPTIONS (Ruto / Raila / etc) ── */}
                                {isNamed ? (
                                    <div className="space-y-2">
                                        {options.map((opt, i) => {
                                            const color = optColor(opt, i);
                                            const pct = hasActivity ? latestProbabilities[opt] : null;
                                            const isActive = selectedName === opt;
                                            const yesPct = pct !== null ? pct : Math.round(100 / options.length);
                                            const noPct = 100 - yesPct;

                                            return (
                                                <div key={opt} className="rounded-2xl border overflow-hidden transition-all"
                                                    style={{
                                                        borderColor: isActive ? color + "60" : "var(--border)",
                                                        background: isActive ? color + "0A" : "var(--secondary-10, rgba(128,128,128,0.04))",
                                                    }}>

                                                    {/* Option name row */}
                                                    <div className="flex items-center justify-between px-4 py-3 cursor-pointer"
                                                        onClick={() => setSelectedName(isActive ? null : opt)}>
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="h-3 w-3 rounded-full shrink-0" style={{ background: color }} />
                                                            <span className="text-base font-bold text-foreground">{opt}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {pct !== null && (
                                                                <span className="text-sm font-bold tabular-nums" style={{ color }}>
                                                                    {pct}%
                                                                </span>
                                                            )}
                                                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${isActive ? "border-foreground" : "border-border"}`}>
                                                                {isActive && <div className="h-2.5 w-2.5 rounded-full bg-foreground" />}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* YES / NO sub-stake — only shown when this option is selected */}
                                                    {isActive && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="border-t border-border/50 px-4 py-3">

                                                            <p className="text-[11px] text-muted-foreground mb-2.5 uppercase tracking-wider font-semibold">
                                                                Will {opt} win?
                                                            </p>

                                                            <div className="grid grid-cols-2 gap-2">
                                                                {/* YES */}
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedSide("yes");
                                                                        setStep(2);
                                                                    }}
                                                                    className="flex items-center justify-between px-3.5 py-3 rounded-xl border transition-all relative overflow-hidden group"
                                                                    style={{
                                                                        borderColor: selectedSide === "yes" ? "#2563EB50" : "var(--border)",
                                                                        background: selectedSide === "yes" ? "#2563EB0D" : "var(--secondary)",
                                                                    }}>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: "#2563EB" }} />
                                                                        <span className="text-sm font-bold" style={{ color: "#2563EB" }}>Yes</span>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="text-sm font-bold tabular-nums" style={{ color: "#2563EB" }}>
                                                                            {yesPct}%
                                                                        </div>
                                                                    </div>
                                                                </button>

                                                                {/* NO */}
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedSide("no");
                                                                        setStep(2);
                                                                    }}
                                                                    className="flex items-center justify-between px-3.5 py-3 rounded-xl border transition-all relative overflow-hidden group"
                                                                    style={{
                                                                        borderColor: selectedSide === "no" ? "#DC262650" : "var(--border)",
                                                                        background: selectedSide === "no" ? "#DC26260D" : "var(--secondary)",
                                                                    }}>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: "#DC2626" }} />
                                                                        <span className="text-sm font-bold" style={{ color: "#DC2626" }}>No</span>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="text-sm font-bold tabular-nums" style={{ color: "#DC2626" }}>
                                                                            {noPct}%
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            </div>

                                                            <p className="text-[10px] text-muted-foreground mt-2 text-center">
                                                                Independent pool — staking on {opt} doesn't affect other options
                                                            </p>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    /* ── PLAIN YES/NO ── vertical list */
                                    <div className="space-y-2.5">
                                        {options.map((opt, i) => {
                                            const pct = hasActivity ? latestProbabilities[opt] : null;
                                            const color = optColor(opt, i);
                                            const yn = isYN(opt);
                                            const odds = calcOdds(opt);
                                            return (
                                                <button key={opt}
                                                    onClick={() => { if (opinionOpen) { setSelectedName(opt); setStep(2); } }}
                                                    disabled={!opinionOpen}
                                                    className="w-full flex items-center justify-between px-4 py-4 rounded-2xl border transition-all text-left disabled:opacity-50 relative overflow-hidden group"
                                                    style={{
                                                        borderColor: yn ? color + "50" : "var(--border)",
                                                        background: yn ? color + "0D" : "var(--secondary-10, rgba(0,0,0,0.04))",
                                                    }}>
                                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                                                        style={{ background: yn ? `linear-gradient(135deg, ${color}22 0%, ${color}08 100%)` : "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)" }} />
                                                    <div className="flex items-center gap-3 relative z-10">
                                                        <div className="h-3 w-3 rounded-full shrink-0" style={{ background: color }} />
                                                        <span className="text-base font-bold" style={{ color: yn ? color : "var(--foreground)" }}>{opt}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 relative z-10">
                                                        <span className="text-sm font-bold" style={{ color: "#F5C518" }}>{odds}x</span>
                                                        <span className="text-sm font-bold tabular-nums"
                                                            style={{ color: pct !== null ? (yn ? color : "var(--muted-foreground)") : undefined }}>
                                                            {pct !== null ? `${pct}%` : "—"}
                                                        </span>
                                                        {opinionOpen && <span className="text-xs text-muted-foreground">→</span>}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {!isLoggedIn && (
                                    <button onClick={() => { navigate("/auth"); onClose(); }}
                                        className="w-full py-4 rounded-2xl border font-bold hover:opacity-80 transition-all"
                                        style={{ borderColor: "#F5C518", color: "#F5C518" }}>
                                        Log in to call
                                    </button>
                                )}
                            </motion.div>
                        )}

                        {step === 2 && renderStep2()}
                    </AnimatePresence>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
