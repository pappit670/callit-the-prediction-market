// src/components/TrustPanel.tsx
// Market trust, resolution info, dispute system and transparency panel for Callit.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, AlertTriangle, CheckCircle2, Clock, Link2,
  Flag, Users, TrendingUp, ChevronDown, ChevronUp, Info,
} from "lucide-react";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner";
import { getStateInfo, type MarketState } from "@/lib/marketLifecycle";

interface Props {
  opinion: {
    id: string;
    statement: string;
    status: string;
    end_time?: string | null;
    resolution_result?: string | null;
    resolution_condition?: string | null;
    resolution_source?: string | null;
    dispute_count?: number;
    call_count?: number;
    coins_staked?: number;
    participant_count?: number;
  };
  isLoggedIn: boolean;
  userId?: string;
}

function StatPill({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: string | number; color?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1">
        <Icon className="h-3 w-3" style={{ color: color ?? "var(--muted-foreground)" }} />
        <span className="text-sm font-bold tabular-nums">{value}</span>
      </div>
      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}

export function TrustPanel({ opinion, isLoggedIn, userId }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const stateInfo = getStateInfo(opinion.status as MarketState);
  const disputeCount = opinion.dispute_count ?? 0;
  const isSuspicious = disputeCount >= 3;

  const handleDispute = async () => {
    if (!isLoggedIn) { toast.error("Log in to flag a dispute"); return; }
    if (!disputeReason.trim()) { toast.error("Please provide a reason"); return; }

    setSubmittingDispute(true);
    const { error } = await supabase.from("market_disputes").insert({
      opinion_id: opinion.id,
      user_id: userId,
      reason: disputeReason.trim(),
      status: "open",
    });

    if (error) {
      toast.error("Failed to submit dispute");
    } else {
      toast.success("Dispute filed — admin will review within 24h");
      setDisputeOpen(false);
      setDisputeReason("");
    }
    setSubmittingDispute(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">

      {/* State header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40"
        style={{ background: stateInfo.color + "08" }}>
        <div className="h-2.5 w-2.5 rounded-full animate-pulse" style={{ background: stateInfo.color }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold" style={{ color: stateInfo.color }}>{stateInfo.label}</p>
          <p className="text-[10px] text-muted-foreground leading-snug">{stateInfo.description}</p>
        </div>
        {isSuspicious && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-1 rounded-full">
            <AlertTriangle className="h-3 w-3" />
            Under review
          </div>
        )}
      </div>

      {/* Market signals row */}
      <div className="grid grid-cols-3 divide-x divide-border/40 border-b border-border/40 py-3 px-2">
        <StatPill icon={Users}     label="Callers"  value={(opinion.call_count ?? 0).toLocaleString()} />
        <StatPill icon={TrendingUp} label="Staked"  value={`${(opinion.coins_staked ?? 0).toLocaleString()}c`} color="#F5C518" />
        <StatPill icon={Flag}      label="Disputes" value={disputeCount} color={disputeCount > 0 ? "#F59E0B" : undefined} />
      </div>

      {/* Resolution info */}
      <div className="px-4 py-3 space-y-3 border-b border-border/40">
        {opinion.resolution_condition && (
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Resolution Condition</p>
            <p className="text-xs text-foreground leading-relaxed">{opinion.resolution_condition}</p>
          </div>
        )}

        {opinion.resolution_source && (
          <div className="flex items-center gap-2">
            <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
            <a
              href={opinion.resolution_source}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#2563EB] hover:underline truncate"
            >
              {opinion.resolution_source.replace(/^https?:\/\//, "")}
            </a>
          </div>
        )}

        {!opinion.resolution_condition && !opinion.resolution_source && (
          <p className="text-xs text-muted-foreground italic">No resolution details provided</p>
        )}

        {opinion.end_time && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            <span>
              Deadline:{" "}
              <span className="text-foreground font-semibold">
                {new Date(opinion.end_time).toLocaleDateString("en-GB", {
                  day: "2-digit", month: "short", year: "numeric",
                })}
              </span>
            </span>
          </div>
        )}

        {opinion.resolution_result && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#22C55E]/08 border border-[#22C55E]/20">
            <CheckCircle2 className="h-4 w-4 text-[#22C55E] shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground">Resolved as</p>
              <p className="text-sm font-bold text-[#22C55E]">{opinion.resolution_result}</p>
            </div>
          </div>
        )}
      </div>

      {/* Dispute button */}
      {opinion.status !== "resolved" && (
        <div className="px-4 py-3 border-b border-border/40">
          <button
            onClick={() => setDisputeOpen(d => !d)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Flag className="h-3.5 w-3.5" />
            <span>Flag an issue with this market</span>
          </button>

          <AnimatePresence>
            {disputeOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-2">
                  <textarea
                    value={disputeReason}
                    onChange={e => setDisputeReason(e.target.value)}
                    placeholder="Describe the issue (e.g. incorrect resolution, misleading question)..."
                    rows={3}
                    className="w-full text-xs bg-secondary/40 border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-foreground/30 resize-none transition-colors placeholder:text-muted-foreground"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleDispute}
                      disabled={submittingDispute || !disputeReason.trim()}
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#F59E0B] text-black disabled:opacity-50 transition-opacity"
                    >
                      {submittingDispute ? "Submitting..." : "Submit Dispute"}
                    </button>
                    <button
                      onClick={() => setDisputeOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs border border-border text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* How it works — collapsible */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center justify-between w-full px-4 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="h-3.5 w-3.5" />
          <span className="font-semibold">How markets work</span>
        </div>
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 text-xs text-muted-foreground border-t border-border/40 pt-3">
              {[
                { icon: "1️⃣", text: "Pick a side — YES or NO — and stake coins on your prediction." },
                { icon: "📈", text: "Prices move based on how people trade. More YES buyers = higher YES price." },
                { icon: "✅", text: "When the deadline passes, outcome is verified against the stated data source." },
                { icon: "💰", text: "Winners receive a proportional payout from the losing side's pool (minus 5% fee)." },
                { icon: "🛡️", text: "If you believe the result is wrong, use the dispute button above to flag it for admin review." },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="text-sm shrink-0">{item.icon}</span>
                  <p className="leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
