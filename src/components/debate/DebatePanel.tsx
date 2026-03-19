import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Swords, ChevronDown, ChevronUp, Users } from "lucide-react";
import { supabase } from "@/supabaseClient";
import { useApp } from "@/context/AppContext";
import { PositionModal } from "./PositionModal";
import { ChallengeModal } from "./ChallengeModal";

interface DebatePanelProps {
  opinionId: string;
  opinionStatement: string;
  defaultExpanded?: boolean;
}

export function DebatePanel({
  opinionId, opinionStatement, defaultExpanded = false
}: DebatePanelProps) {
  const { isLoggedIn } = useApp();
  const [positions, setPositions]       = useState<any[]>([]);
  const [loading, setLoading]           = useState(false);
  const [expanded, setExpanded]         = useState(defaultExpanded);
  const [positionModal, setPositionModal] = useState<"agree"|"disagree"|null>(null);
  const [challengeTarget, setChallengeTarget] = useState<any>(null);
  const [agreeCount, setAgreeCount]     = useState(0);
  const [disagreeCount, setDisagreeCount] = useState(0);

  useEffect(() => {
    if (expanded) fetchPositions();
  }, [expanded, opinionId]);

  const fetchPositions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("positions")
      .select("*")
      .eq("opinion_id", opinionId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) {
      setPositions(data);
      setAgreeCount(data.filter(p => p.stance === "agree").length);
      setDisagreeCount(data.filter(p => p.stance === "disagree").length);
    }
    setLoading(false);
  };

  const total     = agreeCount + disagreeCount;
  const agreePct  = total > 0 ? Math.round((agreeCount / total) * 100) : 50;
  const disagreePct = 100 - agreePct;

  return (
    <>
      <div className="border border-border rounded-2xl overflow-hidden bg-card">
        {/* Collapsed header — always visible */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Swords className="h-4 w-4 text-gold flex-shrink-0" />
            <span className="text-sm font-semibold text-foreground">Debate</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-[#00C278]">
                <CheckCircle2 className="h-3 w-3" /> {agreeCount}
              </span>
              <span className="flex items-center gap-1 text-xs text-[#EF4444]">
                <XCircle className="h-3 w-3" /> {disagreeCount}
              </span>
            </div>
          </div>
          {expanded
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-4 border-t border-border">

                {/* Agree / Disagree buttons */}
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setPositionModal("agree")}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#00C278]/40 text-[#00C278] text-sm font-bold hover:bg-[#00C278]/10 transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Agree
                  </button>
                  <button
                    onClick={() => setPositionModal("disagree")}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#EF4444]/40 text-[#EF4444] text-sm font-bold hover:bg-[#EF4444]/10 transition-colors"
                  >
                    <XCircle className="h-4 w-4" /> Disagree
                  </button>
                </div>

                {/* Sentiment bar */}
                {total > 0 && (
                  <div>
                    <div className="h-2 rounded-full bg-[#EF4444]/20 overflow-hidden">
                      <motion.div
                        className="h-full bg-[#00C278] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${agreePct}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-[#00C278] font-semibold">{agreePct}% Agree</span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" /> {total}
                      </span>
                      <span className="text-[#EF4444] font-semibold">{disagreePct}% Disagree</span>
                    </div>
                  </div>
                )}

                {/* Positions list */}
                {loading ? (
                  <div className="space-y-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-16 rounded-xl bg-secondary animate-pulse" />
                    ))}
                  </div>
                ) : positions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No positions yet — be the first to take a stand!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {positions.map((pos) => (
                      <div
                        key={pos.id}
                        className={`rounded-xl border p-3 ${
                          pos.stance === "agree"
                            ? "border-[#00C278]/20 bg-[#00C278]/5"
                            : "border-[#EF4444]/20 bg-[#EF4444]/5"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            {pos.stance === "agree"
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-[#00C278]" />
                              : <XCircle className="h-3.5 w-3.5 text-[#EF4444]" />}
                            <span className="text-xs font-semibold text-muted-foreground">
                              {pos.anonymous_alias || "Anonymous"}
                            </span>
                          </div>
                          <button
                            onClick={() => setChallengeTarget(pos)}
                            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-gold transition-colors px-2 py-0.5 rounded-full border border-border hover:border-gold"
                          >
                            <Swords className="h-3 w-3" /> Challenge
                          </button>
                        </div>
                        {pos.argument && (
                          <p className="text-xs text-foreground leading-relaxed">
                            {pos.argument}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Position Modal */}
      {positionModal && (
        <PositionModal
          opinionId={opinionId}
          opinionStatement={opinionStatement}
          stance={positionModal}
          onClose={() => setPositionModal(null)}
          onSuccess={() => { fetchPositions(); }}
        />
      )}

      {/* Challenge Modal */}
      {challengeTarget && (
        <ChallengeModal
          opinionId={opinionId}
          opinionStatement={opinionStatement}
          targetPosition={challengeTarget}
          onClose={() => setChallengeTarget(null)}
        />
      )}
    </>
  );
}
