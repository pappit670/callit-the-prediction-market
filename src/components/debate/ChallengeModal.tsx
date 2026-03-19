import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Swords, Coins, Shield, Trophy, Users } from "lucide-react";
import { supabase } from "@/supabaseClient";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const STAKE_OPTIONS = [1, 5, 10, 50, 100];
const ALIASES = ["Eagle","Lion","Storm","Falcon","Phoenix","Titan","Cipher","Maverick","Blaze","Ghost"];

interface ChallengeModalProps {
  opinionId: string;
  opinionStatement: string;
  targetPosition: any;
  onClose: () => void;
}

export function ChallengeModal({ opinionId, opinionStatement, targetPosition, onClose }: ChallengeModalProps) {
  const { user, isLoggedIn } = useApp();
  const navigate = useNavigate();
  const [step, setStep]         = useState<"form"|"sent"|"live">("form");
  const [argument, setArgument] = useState("");
  const [stake, setStake]       = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [debate, setDebate]     = useState<any>(null);
  const [votes, setVotes]       = useState({ challenger: 0, defender: 0 });
  const [userVoted, setUserVoted] = useState(false);

  const maxStake    = Math.min(user?.balance || 0, 500);
  const totalVotes  = votes.challenger + votes.defender;
  const chPct       = totalVotes > 0 ? Math.round((votes.challenger / totalVotes) * 100) : 50;

  const handleChallenge = async () => {
    if (!isLoggedIn) { toast.error("Log in to challenge!"); navigate("/auth"); return; }
    if (!argument.trim()) { toast.error("Add your counter-argument first"); return; }
    if (stake > (user?.balance || 0)) { toast.error("Not enough coins!"); return; }
    setSubmitting(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Not logged in");
      const cAlias = ALIASES[Math.floor(Math.random() * ALIASES.length)];
      const dAlias = ALIASES.find(a => a !== cAlias) || "Shadow";
      const { data: d, error } = await supabase.from("debates").insert({
        opinion_id: opinionId,
        challenger_id: authUser.id,
        defender_id: targetPosition.user_id,
        challenger_argument: argument.trim(),
        defender_argument: targetPosition.argument || "No argument provided",
        challenger_stake: stake,
        defender_stake: stake,
        status: "pending",
        anonymous: true,
        challenger_alias: cAlias,
        defender_alias: dAlias,
        challenger_votes: 0, defender_votes: 0,
        expires_at: new Date(Date.now() + 48 * 3600000).toISOString(),
      }).select().single();
      if (error) throw error;
      await supabase.from("profiles").update({ balance: (user.balance || 0) - stake }).eq("id", authUser.id);
      setDebate(d);
      setStep("sent");
      toast.success("Challenge issued!");
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally { setSubmitting(false); }
  };

  const handleVote = async (side: "challenger" | "defender") => {
    if (!isLoggedIn) { toast.error("Log in to vote!"); return; }
    if (userVoted) return;
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      await supabase.from("debate_votes").insert({ debate_id: debate.id, user_id: authUser.id, side });
      const col = side === "challenger" ? "challenger_votes" : "defender_votes";
      await supabase.from("debates").update({ [col]: (side === "challenger" ? votes.challenger : votes.defender) + 1 }).eq("id", debate.id);
      setVotes(prev => ({ ...prev, [side]: prev[side] + 1 }));
      setUserVoted(true);
      toast.success("Vote cast!");
    } catch { toast.error("Already voted"); }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-lg bg-card border border-border rounded-2xl overflow-hidden shadow-2xl max-h-[92vh] overflow-y-auto"
          initial={{ opacity: 0, y: 50, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
            <div className="flex items-center gap-2">
              <Swords className="h-4 w-4 text-gold" />
              <span className="font-bold text-sm text-foreground">
                {step === "form" ? "Issue a Challenge" : step === "sent" ? "Challenge Sent" : "Live Debate"}
              </span>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><X className="h-4 w-4" /></button>
          </div>

          {/* ── FORM ── */}
          {step === "form" && (
            <div className="p-5 space-y-4">
              <div className="bg-secondary/50 rounded-xl p-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1 font-semibold">The Call</p>
                <p className="text-sm font-semibold text-foreground line-clamp-2">{opinionStatement}</p>
              </div>

              <div className="rounded-xl border border-[#EF4444]/25 bg-[#EF4444]/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-3.5 w-3.5 text-[#EF4444]" />
                  <span className="text-[11px] font-bold text-[#EF4444] uppercase tracking-wider">
                    {targetPosition.anonymous_alias || "Opponent"}'s Position
                  </span>
                  <span className="ml-auto text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-secondary/80 capitalize border border-border">
                    {targetPosition.stance}
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {targetPosition.argument || "No argument — just took a stance."}
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Your Counter-Argument <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={argument}
                  onChange={e => setArgument(e.target.value)}
                  placeholder="Make your case. Be specific and sharp."
                  maxLength={280} rows={3}
                  className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold transition-colors resize-none"
                />
                <p className="text-[11px] text-muted-foreground text-right mt-1">{argument.length}/280</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Coins className="h-3.5 w-3.5 text-gold" /> Stake
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Balance: <span className="text-foreground font-semibold">{(user?.balance || 0).toLocaleString()}</span>
                  </span>
                </div>
                <div className="flex gap-2">
                  {STAKE_OPTIONS.map(s => (
                    <button key={s} onClick={() => setStake(s)} disabled={s > maxStake}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all disabled:opacity-25 ${
                        stake === s ? "bg-gold text-primary-foreground border-gold" : "border-border text-muted-foreground hover:border-gold/50 hover:text-foreground"
                      }`}>{s}</button>
                  ))}
                  <button onClick={() => setStake(maxStake)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                      stake === maxStake ? "bg-gold text-primary-foreground border-gold" : "border-border text-muted-foreground hover:border-gold/50"
                    }`}>Max</button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Winner takes <span className="text-gold font-semibold">{stake * 2} coins</span> — decided by community votes
                </p>
              </div>

              <div className="bg-secondary/40 rounded-xl p-3 flex items-start gap-2">
                <Shield className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Identities are masked during debates. You appear as aliases like "Eagle" or "Phoenix". Real identities only show on profiles and leaderboards.
                </p>
              </div>

              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleChallenge}
                  disabled={submitting || !argument.trim()}
                  className="flex-1 py-3 rounded-xl bg-gold text-primary-foreground text-sm font-bold hover:bg-gold-hover flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  <Swords className="h-4 w-4" />
                  {submitting ? "Starting..." : `Start Debate · ${stake} coins`}
                </motion.button>
              </div>
            </div>
          )}

          {/* ── SENT ── */}
          {step === "sent" && debate && (
            <div className="p-5 space-y-4">
              <div className="text-center py-6">
                <div className="h-14 w-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
                  <Swords className="h-7 w-7 text-gold" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Challenge Issued!</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The community can now view and vote on this debate. Winner takes {stake * 2} coins.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/50 rounded-xl p-3 text-center">
                  <p className="text-[11px] text-muted-foreground mb-1">Your Stake</p>
                  <p className="text-xl font-bold text-gold">{stake}</p>
                  <p className="text-[11px] text-muted-foreground">coins</p>
                </div>
                <div className="bg-secondary/50 rounded-xl p-3 text-center">
                  <p className="text-[11px] text-muted-foreground mb-1">Prize Pool</p>
                  <p className="text-xl font-bold text-gold">{stake * 2}</p>
                  <p className="text-[11px] text-muted-foreground">coins</p>
                </div>
              </div>
              <button onClick={() => setStep("live")} className="w-full py-3 rounded-xl bg-gold text-primary-foreground text-sm font-bold hover:bg-gold-hover transition-all">
                View Debate →
              </button>
            </div>
          )}

          {/* ── LIVE ── */}
          {step === "live" && debate && (
            <div className="p-5 space-y-4">
              {/* Vote bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-[#00C278]">{debate.challenger_alias}</span>
                  <span className="text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />{totalVotes} votes</span>
                  <span className="font-bold text-[#EF4444]">{debate.defender_alias}</span>
                </div>
                <div className="h-2.5 rounded-full bg-[#EF4444]/20 overflow-hidden">
                  <motion.div className="h-full bg-[#00C278] rounded-full transition-all duration-700"
                    style={{ width: `${chPct}%` }} />
                </div>
                <div className="flex justify-between text-xs font-bold mt-1">
                  <span style={{ color: "#00C278" }}>{chPct}%</span>
                  <span style={{ color: "#EF4444" }}>{100 - chPct}%</span>
                </div>
              </div>

              {/* Arguments side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#00C278]/25 bg-[#00C278]/5 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Trophy className="h-3.5 w-3.5 text-[#00C278]" />
                    <span className="text-[10px] font-bold text-[#00C278] uppercase">{debate.challenger_alias}</span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed mb-3">{debate.challenger_argument}</p>
                  {!userVoted && (
                    <button onClick={() => handleVote("challenger")}
                      className="w-full py-1.5 rounded-lg bg-[#00C278]/15 text-[#00C278] text-[11px] font-bold hover:bg-[#00C278]/25 transition-colors">
                      Support
                    </button>
                  )}
                </div>
                <div className="rounded-xl border border-[#EF4444]/25 bg-[#EF4444]/5 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Shield className="h-3.5 w-3.5 text-[#EF4444]" />
                    <span className="text-[10px] font-bold text-[#EF4444] uppercase">{debate.defender_alias}</span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed mb-3">{debate.defender_argument}</p>
                  {!userVoted && (
                    <button onClick={() => handleVote("defender")}
                      className="w-full py-1.5 rounded-lg bg-[#EF4444]/15 text-[#EF4444] text-[11px] font-bold hover:bg-[#EF4444]/25 transition-colors">
                      Support
                    </button>
                  )}
                </div>
              </div>

              {userVoted && (
                <p className="text-xs text-center text-muted-foreground bg-secondary/50 rounded-xl py-2.5">
                  ✓ Vote cast · Debate resolves in 48h
                </p>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
