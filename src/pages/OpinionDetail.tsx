import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, Send, ThumbsUp, MessageCircle, Coins, Info } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { sampleCards } from "@/data/sampleCards";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import ResolutionScreen from "@/components/ResolutionScreen";

const activityFeed = [
  { user: "cryptobro", side: "yes" as const, amount: 120, time: "2 min ago" },
  { user: "vibecheck", side: "no" as const, amount: 85, time: "5 min ago" },
  { user: "goatdebater", side: "yes" as const, amount: 300, time: "12 min ago" },
  { user: "nairobiguide", side: "yes" as const, amount: 50, time: "28 min ago" },
  { user: "worklife", side: "no" as const, amount: 200, time: "1 hr ago" },
];

const initialComments = [
  { user: "hiphophead", text: "This is a no-brainer. The evidence speaks for itself.", time: "3 hrs ago" },
  { user: "cryptobro", text: "I'm not so sure honestly. Could go either way.", time: "5 hrs ago" },
  { user: "vibecheck", text: "Staked big on Yes. Let's see how this plays out 🔥", time: "8 hrs ago" },
];

function parseTimeLeft(timeLeft: string): number {
  const match = timeLeft.match(/(\d+)\s*(day|hour|hr|min)/i);
  if (!match) return 0;
  const val = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  if (unit.startsWith("day")) return val * 86400;
  if (unit.startsWith("hour") || unit === "hr") return val * 3600;
  if (unit.startsWith("min")) return val * 60;
  return 0;
}

function formatCountdown(s: number) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return { d, h, m, s: sec };
}

function getEarlyEntryMultiplier(postedDaysAgo: number, timeLeft: string): { multiplier: number; label: string } | null {
  const totalSeconds = parseTimeLeft(timeLeft) + postedDaysAgo * 86400;
  const elapsed = postedDaysAgo * 86400;
  const pct = totalSeconds > 0 ? elapsed / totalSeconds : 0;
  if (pct <= 0.1) return { multiplier: 1.5, label: "1.5x" };
  if (pct <= 0.4) return { multiplier: 1.25, label: "1.25x" };
  if (pct <= 0.8) return null;
  return { multiplier: 0.85, label: "0.85x late penalty" };
}

const resolutionDescriptions: Record<string, string> = {
  crowd: "How this resolves: The side with the most staked coins when the timer ends wins.",
  event: "How this resolves: Based on whether the real-world event occurs by the deadline.",
  metric: "How this resolves: Based on predefined measurable metrics.",
};

const statusConfig: Record<string, { label: string; classes: string }> = {
  open: { label: "Open", classes: "bg-yes/15 text-yes" },
  locked: { label: "Closing", classes: "bg-gold/15 text-gold" },
  resolved: { label: "Resolved", classes: "bg-muted text-muted-foreground" },
  draw: { label: "Draw — Refunded", classes: "bg-no/15 text-no" },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const OpinionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const card = sampleCards.find((c) => c.id === Number(id));

  const [stakeAmount, setStakeAmount] = useState("");
  const [selectedSide, setSelectedSide] = useState<"yes" | "no">("yes");
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState(initialComments);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [showResolution, setShowResolution] = useState(false);

  useEffect(() => {
    if (card) setSecondsLeft(parseTimeLeft(card.timeLeft));
  }, [card]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  const countdown = useMemo(() => formatCountdown(secondsLeft), [secondsLeft]);

  if (!card) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Opinion not found.</p>
      </div>
    );
  }

  const { question, yesPercent, noPercent, coins, genre, creator, postedDaysAgo, stakerCount, isResolved, winner, resolutionType = "crowd", status = "open" } = card;
  const percent = selectedSide === "yes" ? yesPercent : noPercent;
  const potentialWin = stakeAmount && percent > 0 ? (parseFloat(stakeAmount) * (100 / percent) * 0.9 - parseFloat(stakeAmount)).toFixed(0) : "0";
  const earlyEntry = getEarlyEntryMultiplier(postedDaysAgo ?? 1, card.timeLeft);
  const statusInfo = statusConfig[status] || statusConfig.open;
  const isActive = status === "open" || status === "locked";

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied!", description: "Share this call with your friends." });
  };

  const handleComment = () => {
    if (!commentInput.trim()) return;
    setComments([{ user: "you", text: commentInput, time: "Just now" }, ...comments]);
    setCommentInput("");
  };

  // Demo: user staked on yes for resolved opinions
  const userStakedSide = isResolved ? "yes" : null;
  const userStakeCoins = isResolved ? 200 : 0;
  const userWon = isResolved && winner === userStakedSide;
  const userPayout = userWon ? Math.round(userStakeCoins * (100 / yesPercent) * 0.9) : userStakeCoins;

  if (showResolution && isResolved) {
    return (
      <ResolutionScreen
        card={card}
        userWon={!!userWon}
        userPayout={userPayout}
        onDismiss={() => {
          setShowResolution(false);
          navigate("/");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-[780px] mx-auto px-4 sm:px-6 pt-8 pb-20">
        {/* Back + Genre + Status */}
        <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible" className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-gold transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="rounded bg-gold/10 px-3 py-1 text-[11px] font-medium text-gold font-body">{genre}</span>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusInfo.classes}`}>
            {statusInfo.label}
          </span>
        </motion.div>

        {/* Question */}
        <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="visible" className="mb-6">
          <h1 className="font-headline text-3xl sm:text-4xl text-foreground leading-tight mb-4">{question}</h1>

          {/* Resolution type info box */}
          <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-secondary">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-[13px] text-muted-foreground font-body">{resolutionDescriptions[resolutionType]}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-muted-foreground hover:ring-2 hover:ring-gold transition-all">
              {creator[0].toUpperCase()}
            </div>
            <div>
              <span className="font-body text-sm font-semibold text-foreground">@{creator}</span>
              <span className="text-xs text-muted-foreground ml-2">Posted {postedDaysAgo ?? 1} days ago</span>
            </div>
          </div>
        </motion.div>

        {/* Staking bars */}
        <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible" className="mb-8">
          <div className="flex h-4 w-full rounded-full overflow-hidden bg-secondary mb-4">
            <motion.div className="h-full bg-yes rounded-l-full" initial={{ width: 0 }} animate={{ width: `${yesPercent}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
            <motion.div className="h-full bg-no rounded-r-full" initial={{ width: 0 }} animate={{ width: `${noPercent}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[32px] font-bold text-yes font-body">Yes {yesPercent}%</span>
            <span className="text-[32px] font-bold text-no font-body">No {noPercent}%</span>
          </div>
          <p className="text-[10px] text-muted-foreground font-body mb-3">Weighted by coins staked</p>
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="font-headline text-2xl font-bold text-gold">{coins.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground ml-2 font-body">coins in pool</span>
            </div>
            {stakerCount && (
              <span className="text-sm text-muted-foreground font-body">{stakerCount} people have staked</span>
            )}
          </div>
          {earlyEntry && isActive && (
            <div className="mt-3">
              <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-medium text-gold font-body">
                Early Entry · {earlyEntry.label} multiplier active
              </span>
            </div>
          )}
          {/* User personal stake */}
          {userStakedSide && (
            <div className="mt-3 flex items-center gap-2">
              <Coins className="h-4 w-4 text-gold" />
              <span className="text-sm font-semibold text-gold font-body">
                Your stake: {userStakeCoins} coins on {userStakedSide === "yes" ? "Yes" : "No"}
              </span>
            </div>
          )}
        </motion.div>

        {/* Resolution or Calculator + Stake */}
        {isResolved || status === "resolved" || status === "draw" ? (
          <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible" className="mb-8 space-y-4">
            {status === "draw" ? (
              <div className="rounded-2xl bg-no/15 p-6">
                <p className="font-headline text-xl font-bold text-no mb-3">
                  This call is a draw — All stakes refunded
                </p>
                <div className="space-y-1 font-body text-sm text-muted-foreground">
                  <p>Total pool: {coins.toLocaleString()} coins</p>
                  <p>All stakes returned to participants</p>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-2xl bg-gold p-6">
                  <p className="font-headline text-xl font-bold text-primary-foreground mb-3">
                    This call is closed · {winner === "yes" ? "Yes" : "No"} Won
                  </p>
                  <div className="space-y-1 font-body text-sm text-primary-foreground/80">
                    <p>Total pool: {coins.toLocaleString()} coins</p>
                    <p>Callit cut (10%): {Math.round(coins * 0.1).toLocaleString()} coins</p>
                    <p>Winner payout: {Math.round(coins * 0.9).toLocaleString()} coins distributed</p>
                  </div>
                </div>
                {userWon ? (
                  <div className="rounded-xl bg-yes/15 p-4 text-center">
                    <p className="font-headline text-lg text-yes font-bold">You called it. +{userPayout} coins added to your wallet</p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-muted p-4 text-center">
                    <p className="text-sm text-muted-foreground font-body">Tough call. {userStakeCoins} coins lost.</p>
                    <button onClick={() => navigate("/call-it")} className="mt-2 text-sm font-medium text-gold hover:text-gold-hover transition-colors font-body">
                      Make another call →
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setShowResolution(true)}
                  className="w-full rounded-xl border border-gold text-gold font-body text-sm font-semibold py-3 hover:bg-gold hover:text-primary-foreground transition-all duration-200"
                >
                  View Full Result
                </button>
              </>
            )}
          </motion.div>
        ) : (
          <>
            {/* Calculator */}
            <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible" className="mb-6">
              <h3 className="font-body text-base font-semibold text-foreground mb-1">Calculate your return</h3>
              <p className="text-[13px] text-muted-foreground font-body mb-3">Enter how many coins you want to stake and see your potential win</p>
              <div className="relative mb-3">
                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold" />
                <input
                  type="number"
                  min="1"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="Enter coins"
                  className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div className="flex gap-2 mb-3">
                {(["yes", "no"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSide(s)}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold font-body border transition-all duration-200 ${
                      selectedSide === s
                        ? s === "yes" ? "bg-yes border-yes text-white" : "bg-no border-no text-white"
                        : "border-border text-muted-foreground hover:border-gold"
                    }`}
                  >
                    {s === "yes" ? "Yes" : "No"}
                  </button>
                ))}
              </div>
              {stakeAmount && (
                <p className="font-headline text-lg text-gold font-bold">
                  Stake {stakeAmount} on {selectedSide === "yes" ? "Yes" : "No"} → potential win {potentialWin} coins
                </p>
              )}
            </motion.div>

            {/* Stake buttons */}
            <motion.div custom={4} variants={sectionVariants} initial="hidden" animate="visible" className="mb-8">
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 rounded-xl bg-yes py-3 text-base font-semibold text-white font-body hover:brightness-90 transition-all">
                  Stake Yes
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 rounded-xl bg-no py-3 text-base font-semibold text-white font-body hover:brightness-90 transition-all">
                  Stake No
                </motion.button>
              </div>
              <p className="text-[11px] text-muted-foreground text-center mt-2 font-body">Coins are deducted immediately on stake</p>
            </motion.div>
          </>
        )}

        {/* Countdown */}
        <motion.div custom={5} variants={sectionVariants} initial="hidden" animate="visible" className="mb-8">
          <div className="grid grid-cols-4 gap-3 mb-2">
            {[
              { val: countdown.d, label: "Days" },
              { val: countdown.h, label: "Hours" },
              { val: countdown.m, label: "Minutes" },
              { val: countdown.s, label: "Seconds" },
            ].map((u) => (
              <div key={u.label} className="rounded-lg bg-secondary p-3 text-center">
                <div className="font-headline text-[28px] font-bold text-foreground">{String(u.val).padStart(2, "0")}</div>
                <div className="text-[11px] text-muted-foreground font-body">{u.label}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground font-body">
            Resolved by: {resolutionType === "crowd" ? "Community Stake" : resolutionType === "event" ? "Event Outcome" : "Metrics"}
          </p>
        </motion.div>

        {/* Activity */}
        <motion.div custom={6} variants={sectionVariants} initial="hidden" animate="visible" className="mb-8">
          <h3 className="font-body text-base font-semibold text-foreground mb-3">Recent Stakes</h3>
          <div className="space-y-0">
            {activityFeed.map((a, i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                  {a.user[0].toUpperCase()}
                </div>
                <span className="text-[13px] font-medium text-foreground font-body">@{a.user}</span>
                <span className={`text-[13px] font-medium font-body ${a.side === "yes" ? "text-yes" : "text-no"}`}>
                  staked {a.side === "yes" ? "Yes" : "No"}
                </span>
                <span className="text-[13px] font-semibold text-gold font-body">{a.amount}</span>
                <span className="text-[11px] text-muted-foreground ml-auto font-body">{a.time}</span>
              </div>
            ))}
          </div>
          <button className="mt-2 text-[13px] font-medium text-gold hover:text-gold-hover transition-colors font-body">
            View all activity
          </button>
        </motion.div>

        {/* Share */}
        <motion.div custom={7} variants={sectionVariants} initial="hidden" animate="visible" className="mb-8">
          <button
            onClick={handleShare}
            className="w-full rounded-xl border border-gold text-gold font-body text-sm font-semibold py-3 flex items-center justify-center gap-2 hover:bg-gold hover:text-primary-foreground transition-all duration-200"
          >
            <Share2 className="h-4 w-4" />
            Share this call
          </button>
        </motion.div>

        {/* Comments */}
        <motion.div custom={8} variants={sectionVariants} initial="hidden" animate="visible" className="mb-8">
          <h3 className="font-headline text-xl mb-1">The Conversation</h3>
          <p className="text-xs text-muted-foreground font-body mb-4">Keep it respectful. AI moderation active.</p>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">Y</div>
            <input
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleComment()}
              placeholder="Drop your take..."
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
            />
            <button onClick={handleComment} className="h-9 w-9 rounded-lg bg-gold flex items-center justify-center hover:bg-gold-hover transition-colors shrink-0">
              <Send className="h-4 w-4 text-primary-foreground" />
            </button>
          </div>

          <div className="space-y-3">
            {comments.map((c, i) => (
              <div key={i} className="rounded-lg bg-secondary p-4 border-l-2 border-gold">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                    {c.user[0].toUpperCase()}
                  </div>
                  <span className="text-[13px] font-semibold text-foreground font-body">@{c.user}</span>
                  <span className="text-[11px] text-muted-foreground font-body">{c.time}</span>
                </div>
                <p className="text-sm text-foreground font-body mb-2">{c.text}</p>
                <div className="flex items-center gap-4">
                  <button className="text-muted-foreground hover:text-gold transition-colors flex items-center gap-1 text-xs font-body">
                    <ThumbsUp className="h-3 w-3" /> Like
                  </button>
                  <button className="text-muted-foreground hover:text-gold transition-colors flex items-center gap-1 text-xs font-body">
                    <MessageCircle className="h-3 w-3" /> Reply
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full rounded-xl border border-gold text-gold font-body text-sm font-medium py-2.5 hover:bg-gold hover:text-primary-foreground transition-all">
            Load more comments
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default OpinionDetail;
