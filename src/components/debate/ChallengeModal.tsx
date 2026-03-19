import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Swords, Coins, Shield, Trophy, Users, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/supabaseClient";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Position {
  id: string;
  user_id: string;
  stance: string;
  argument: string | null;
  anonymous_alias: string;
  created_at: string;
}

interface ChallengeModalProps {
  opinionId: string;
  opinionStatement: string;
  targetPosition: Position;
  onClose: () => void;
}

const STAKE_OPTIONS = [1, 5, 10, 50, 100] as const;

export function ChallengeModal({
  opinionId, opinionStatement, targetPosition, onClose
}: ChallengeModalProps) {
  const { user, isLoggedIn } = useApp();
  const navigate = useNavigate();
  const [step, setStep]       = useState<"challenge" | "pending" | "active">("challenge");
  const [argument, setArgument] = useState("");
  const [stake, setStake]     = useState<number>(10);
  const [submitting, setSubmitting] = useState(false);
  const [debate, setDebate]   = useState<any>(null);
  const [votes, setVotes]     = useState({ challenger: 0, defender: 0 });
  const [userVoted, setUserVoted] = useState(false);
  const [replies, setReplies] = useState<any[]>([]);
  const [showReplies, setShowReplies] = useState(false);

  const maxStake = Math.min(user?.balance || 0, 500);

  const handleChallenge = async () => {
    if (!isLoggedIn) { toast.error("Log in to challenge!"); navigate("/auth"); return; }
    if (!argument.trim()) { toast.error("Add your counter-argument first"); return; }
    if (stake > (user?.balance || 0)) { toast.error("Not enough coins!"); return; }

    setSubmitting(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Not logged in");

      const aliases = [
        "Caller A","Caller B","Eagle","Lion","Storm","Falcon",
        "Phoenix","Titan","Cipher","Maverick"
      ];
      const challengerAlias = aliases[Math.floor(Math.random() * aliases.length)];
      const defenderAlias   = aliases.find(a => a !== challengerAlias) || "Defender";

      const { data: newDebate, error } = await supabase.from("debates").insert({
        opinion_id:           opinionId,
        challenger_id:        authUser.id,
        defender_id:          targetPosition.user_id,
        challenger_argument:  argument.trim(),
        defender_argument:    targetPosition.argument || "No argument provided",
        challenger_stake:     stake,
        defender_stake:       stake,
        status:               "pending",
        anonymous:            true,
        challenger_alias:     challengerAlias,
        defender_alias:       defenderAlias,
        challenger_votes:     0,
        defender_votes:       0,
        expires_at:           new Date(Date.now() + 48 * 3600000).toISOString(),
      }).select().single();

      if (error) throw error;

      // Deduct stake from challenger
      await supabase.from("profiles")
        .update({ balance: (user.balance || 0) - stake })
        .eq("id", authUser.id);

      setDebate(newDebate);
      setStep("pending");
      toast.success("Challenge sent! Waiting for opponent to accept.");
    } catch (e: any) {
      toast.error(e.message || "Failed to send challenge");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (side: "challenger" | "defender") => {
    if (!isLoggedIn) { toast.error("Log in to vote!"); return; }
    if (userVoted) { toast.error("You already voted!"); return; }
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      await supabase.from("debate_votes").insert({
        debate_id: debate.id,
        user_id:   authUser.id,
        side,
      });

      // Update vote count
      const col = side === "challenger" ? "challenger_votes" : "defender_votes";
      await supabase.from("debates")
        .update({ [col]: (side === "challenger" ? votes.challenger : votes.defender) + 1 })
        .eq("id", debate.id);

      setVotes(prev => ({ ...prev, [side]: prev[side] + 1 }));
      setUserVoted(true);
      toast.success("Vote cast!");
    } catch (e: any) {
      toast.error("Already voted or error occurred");
    }
  };

  const totalVotes = votes.challenger + votes.defender;
  const challengerPct = totalVotes > 0 ? Math.round((votes.challenger / totalVotes) * 100) : 50;
  const defenderPct   = 100 - challengerPct;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-lg bg-card border border-border rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-gold" />
              <span className="font-bold text-foreground">
                {step === "challenge" ? "Issue Challenge" : step === "pending" ? "Challenge Sent" : "Live Debate"}
              </span>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* ── STEP 1: CHALLENGE FORM ── */}
          {step === "challenge" && (
            <div className="p-5 space-y-4">
              {/* Opinion */}
              <div className="bg-secondary/40 rounded-xl p-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">The Call</p>
                <p className="text-sm font-semibold text-foreground line-clamp-2">{opinionStatement}</p>
              </div>

              {/* Target argument */}
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-[#EF4444]" />
                  <span className="text-xs font-bold text-[#EF4444] uppercase tracking-wider">
                    {targetPosition.anonymous_alias || "Opponent"}'s Stance
                  </span>
                  <span className="ml-auto text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-secondary capitalize">
                    {targetPosition.stance}
                  </span>
                </div>
                <p className="text-sm text-foreground">
                  {targetPosition.argument || "No argument — just their stance."}
                </p>
              </div>

              {/* Counter argument */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  Your Counter-Argument <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={argument}
                  onChange={(e) => setArgument(e.target.value)}
                  placeholder="Make your case. Be specific, be sharp."
                  maxLength={280}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold transition-colors resize-none"
                />
                <p className="text-xs text-muted-foreground text-right mt-1">{argument.length}/280</p>
              </div>

              {/* Stake selector */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2 flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5 text-gold" /> Stake
                  <span className="ml-auto text-muted-foreground font-normal">
                    Balance: {(user?.balance || 0).toLocaleString()} coins
                  </span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {STAKE_OPTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => setStake(s)}
                      disabled={s > maxStake}
                      className={`flex-1 min-w-[48px] py-2.5 rounded-xl text-sm font-bold transition-all border disabled:opacity-30 ${
                        stake === s
                          ? "bg-gold text-primary-foreground border-gold"
                          : "border-border text-muted-foreground hover:border-gold/50 hover:text-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                  <button
                    onClick={() => setStake(maxStake)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                      stake === maxStake
                        ? "bg-gold text-primary-foreground border-gold"
                        : "border-border text-muted-foreground hover:border-gold/50"
                    }`}
                  >
                    Max
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Winner takes <span className="text-gold font-semibold">{stake * 2} coins</span> · Determined by community votes
                </p>
              </div>

              {/* Anonymity notice */}
              <div className="bg-secondary/40 rounded-xl p-3 flex items-start gap-2">
                <Shield className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Identities are masked during debates. You and your opponent will appear as aliases like "Caller A" and "Eagle". Real usernames only show on profiles and rankings.
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleChallenge}
                disabled={submitting || !argument.trim()}
                className="w-full py-3.5 rounded-xl bg-gold text-primary-foreground text-sm font-bold hover:bg-gold-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Swords className="h-4 w-4" />
                {submitting ? "Starting Debate..." : `Start Debate — ${stake} coins`}
              </motion.button>
            </div>
          )}

          {/* ── STEP 2: PENDING ── */}
          {step === "pending" && debate && (
            <div className="p-5 space-y-4">
              <div className="text-center py-6">
                <div className="h-16 w-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
                  <Swords className="h-8 w-8 text-gold" />
                </div>
                <h3 className="font-headline text-xl font-bold text-foreground mb-2">Challenge Issued!</h3>
                <p className="text-sm text-muted-foreground">
                  Your challenge has been sent. The community can now view and vote on this debate.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/40 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Your Stake</p>
                  <p className="text-lg font-bold text-gold">{stake} coins</p>
                </div>
                <div className="bg-secondary/40 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Pot Size</p>
                  <p className="text-lg font-bold text-gold">{stake * 2} coins</p>
                </div>
              </div>

              <button
                onClick={() => setStep("active")}
                className="w-full py-3 rounded-xl bg-gold text-primary-foreground text-sm font-bold hover:bg-gold-hover transition-all"
              >
                View Live Debate →
              </button>
            </div>
          )}

          {/* ── STEP 3: ACTIVE DEBATE ── */}
          {step === "active" && debate && (
            <div className="p-5 space-y-4">
              {/* Live vote bar */}
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span className="font-semibold text-[#00C278]">{debate.challenger_alias}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {totalVotes} votes</span>
                  <span className="font-semibold text-[#EF4444]">{debate.defender_alias}</span>
                </div>
                <div className="h-3 rounded-full bg-[#EF4444]/30 overflow-hidden">
                  <motion.div
                    className="h-full bg-[#00C278] rounded-full transition-all duration-700"
                    style={{ width: `${challengerPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-bold mt-1">
                  <span style={{ color: "#00C278" }}>{challengerPct}%</span>
                  <span style={{ color: "#EF4444" }}>{defenderPct}%</span>
                </div>
              </div>

              {/* Side-by-side arguments */}
              <div className="grid grid-cols-2 gap-3">
                {/* Challenger */}
                <div className="rounded-xl border border-[#00C278]/30 bg-[#00C278]/5 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Trophy className="h-3.5 w-3.5 text-[#00C278]" />
                    <span className="text-[11px] font-bold text-[#00C278] uppercase">{debate.challenger_alias}</span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">{debate.challenger_argument}</p>
                  {!userVoted && (
                    <button
                      onClick={() => handleVote("challenger")}
                      className="mt-3 w-full py-1.5 rounded-lg bg-[#00C278]/15 text-[#00C278] text-xs font-bold hover:bg-[#00C278]/25 transition-colors"
                    >
                      Support this side
                    </button>
                  )}
                </div>

                {/* Defender */}
                <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/5 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Shield className="h-3.5 w-3.5 text-[#EF4444]" />
                    <span className="text-[11px] font-bold text-[#EF4444] uppercase">{debate.defender_alias}</span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">{debate.defender_argument}</p>
                  {!userVoted && (
                    <button
                      onClick={() => handleVote("defender")}
                      className="mt-3 w-full py-1.5 rounded-lg bg-[#EF4444]/15 text-[#EF4444] text-xs font-bold hover:bg-[#EF4444]/25 transition-colors"
                    >
                      Support this side
                    </button>
                  )}
                </div>
              </div>

              {userVoted && (
                <p className="text-xs text-center text-muted-foreground">
                  ✓ Vote cast — debate resolves in 48h
                </p>
              )}

              {/* Replies toggle */}
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>Community Replies ({replies.length})</span>
                {showReplies ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
