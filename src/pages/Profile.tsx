import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Coins, Target, Trophy, Award, Settings, Flame, Crown } from "lucide-react";
import Navbar from "@/components/Navbar";
import { sampleCards } from "@/data/sampleCards";
import { calculateNetWin, getCrowdContext } from "@/lib/callit";

const profileTabs = ["Active Calls", "My Opinions", "Biggest Wins", "History", "Leaderboard"] as const;
const historyFilters = ["All", "Won", "Lost", "Draw"];

const userPositions: Record<number, { side: "yes" | "no"; coins: number }> = {
  1: { side: "yes", coins: 200 },
  3: { side: "no", coins: 150 },
  4: { side: "yes", coins: 300 },
  6: { side: "yes", coins: 100 },
  2: { side: "yes", coins: 250 },
  5: { side: "no", coins: 80 },
};

const statusConfig: Record<string, { label: string; classes: string }> = {
  open: { label: "Open", classes: "bg-yes/15 text-yes" },
  locked: { label: "Closing", classes: "bg-gold/15 text-gold" },
  resolved: { label: "Resolved", classes: "bg-muted text-muted-foreground" },
  draw: { label: "Draw", classes: "bg-no/15 text-no" },
};

const biggestWins = [
  { question: "Is Kendrick's run the greatest in hip hop history?", coinsWon: 840, side: "yes" as const, againstPercent: 22, date: "Feb 14, 2026" },
  { question: "Will Afrobeats dominate 2025?", coinsWon: 320, side: "yes" as const, againstPercent: 38, date: "Jan 28, 2026" },
  { question: "Will BTC pass ETH in dev activity?", coinsWon: 180, side: "yes" as const, againstPercent: 46, date: "Jan 15, 2026" },
  { question: "Is remote work better than office work?", coinsWon: 140, side: "no" as const, againstPercent: 62, date: "Jan 8, 2026" },
];

// --- Leaderboard data ---
const timeTabs = ["This Week", "This Month", "All Time"] as const;
const categoryTabs = ["Most Coins Won", "Win Rate", "Best Streak", "Top Opinion Creators"] as const;

interface LeaderboardEntry {
  rank: number;
  username: string;
  initials: string;
  genre: string;
  coinsWon: number;
  winRate: number;
  streak: number;
  isCurrentUser?: boolean;
}

const leaderboardData: LeaderboardEntry[] = [
  { rank: 1, username: "vibecheck", initials: "VC", genre: "Music & Culture", coinsWon: 12400, winRate: 82, streak: 9 },
  { rank: 2, username: "goatdebater", initials: "GD", genre: "Sports", coinsWon: 9800, winRate: 76, streak: 7 },
  { rank: 3, username: "cryptobro", initials: "CB", genre: "Crypto & Money", coinsWon: 8200, winRate: 71, streak: 5 },
  { rank: 4, username: "hiphophead", initials: "HH", genre: "Music & Culture", coinsWon: 6500, winRate: 68, streak: 4 },
  { rank: 5, username: "nairobiguide", initials: "NG", genre: "Local", coinsWon: 5100, winRate: 65, streak: 3 },
  { rank: 6, username: "worklife", initials: "WL", genre: "Random", coinsWon: 4200, winRate: 62, streak: 2 },
  { rank: 7, username: "politicsjunkie", initials: "PJ", genre: "Politics & Society", coinsWon: 3800, winRate: 59, streak: 4 },
  { rank: 8, username: "sportsfan99", initials: "SF", genre: "Sports", coinsWon: 3200, winRate: 57, streak: 1 },
  { rank: 9, username: "memequeen", initials: "MQ", genre: "Entertainment", coinsWon: 2900, winRate: 55, streak: 2 },
  { rank: 10, username: "trendwatcher", initials: "TW", genre: "Trending", coinsWon: 2600, winRate: 53, streak: 1 },
];

const currentUserStats: LeaderboardEntry = {
  rank: 24, username: "you", initials: "JD", genre: "Music & Culture", coinsWon: 1240, winRate: 68, streak: 3, isCurrentUser: true,
};

function getRankColor(rank: number) {
  if (rank === 1) return "hsl(47 91% 52%)";
  if (rank === 2) return "hsl(0 0% 75%)";
  if (rank === 3) return "hsl(29 69% 50%)";
  return undefined;
}
function getRankTextClass(rank: number) {
  if (rank === 1) return "text-gold";
  if (rank === 2) return "text-[hsl(0,0%,75%)]";
  if (rank === 3) return "text-[hsl(29,69%,50%)]";
  return "text-muted-foreground";
}
function getGlowStyle(rank: number) {
  if (rank === 1) return { boxShadow: "0 0 40px hsl(47 91% 52% / 0.15), 0 0 80px hsl(47 91% 52% / 0.05)" };
  if (rank === 2) return { boxShadow: "0 0 30px hsl(0 0% 75% / 0.12)" };
  if (rank === 3) return { boxShadow: "0 0 30px hsl(29 69% 50% / 0.12)" };
  return {};
}

import { DotPattern } from "@/components/ui/dot-pattern";

// ... [Profile constants]

const Profile = () => {
  const [activeTab, setActiveTab] = useState<typeof profileTabs[number]>("Active Calls");
  const [historyFilter, setHistoryFilter] = useState("All");
  const [timeTab, setTimeTab] = useState<typeof timeTabs[number]>("All Time");
  const [categoryTab, setCategoryTab] = useState<typeof categoryTabs[number]>("Most Coins Won");
  const navigate = useNavigate();

  const activeCalls = sampleCards.filter((c) => c.status === "open" || c.status === "locked");
  const historyCalls = sampleCards.filter((c) => c.status === "resolved" || c.status === "draw");
  const myOpinions = sampleCards.filter((c) => c.creator === "vibecheck" || c.creator === "goatdebater");

  const filteredHistory = historyCalls.filter((c) => {
    if (historyFilter === "All") return true;
    if (historyFilter === "Won") return c.status === "resolved" && c.winner === "yes";
    if (historyFilter === "Lost") return c.status === "resolved" && c.winner === "no";
    if (historyFilter === "Draw") return c.status === "draw";
    return true;
  });

  const stats = [
    { label: "Calls Made", value: "47", icon: Target },
    { label: "Win Rate", value: "68%", icon: Award },
    { label: "Best Win", value: "840", icon: Coins },
    { label: "Ranking", value: "#24", icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        {/* Profile Header Card */}
        <motion.div
          className="relative bg-card border-b border-gold-border rounded-[20px] p-8 md:p-10 mb-8 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <DotPattern className="fill-[#F5C518]/10 [mask-image:linear-gradient(to_left,white,transparent)] z-0" width={12} height={12} cr={0.8} />
          <div className="relative z-10 flex flex-col md:flex-row md:items-start gap-6 md:gap-10">
            {/* Left: Avatar + Info */}
            <div className="flex flex-col items-center md:items-start gap-3">
              <button className="relative group">
                <div className="h-20 w-20 rounded-full bg-secondary border-[3px] border-gold flex items-center justify-center text-2xl font-bold text-muted-foreground font-headline">
                  JD
                </div>
                <span className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-body font-medium text-foreground">
                  Change
                </span>
              </button>
              <div className="text-center md:text-left">
                <h2 className="font-headline text-2xl font-bold text-foreground">JohnDoe</h2>
                <p className="text-[13px] text-muted-foreground font-body mt-0.5">Joined Jan 2026</p>
                <p className="text-[13px] text-muted-foreground font-body">1,240 total views on your opinions</p>
              </div>
            </div>

            {/* Right: Stats + Settings */}
            <div className="flex-1">
              <div className="flex justify-end mb-3">
                <Link to="/settings" className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-gold transition-colors font-body font-medium">
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    className="bg-secondary rounded-xl p-4 text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + i * 0.06 }}
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-1.5">
                      <stat.icon className="h-3.5 w-3.5 text-gold" />
                      <span className="text-[11px] text-muted-foreground font-body">{stat.label}</span>
                    </div>
                    <span className="font-headline text-xl font-bold text-gold">{stat.value}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Profile Tabs */}
        <div className="relative border-b border-border mb-6">
          <div className="flex gap-1 overflow-x-auto">
            {profileTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors"
              >
                <span className={activeTab === tab ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}>
                  {tab}
                </span>
                {activeTab === tab && (
                  <motion.div
                    layoutId="profile-tab-underline"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-gold rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {/* Active Calls */}
          {activeTab === "Active Calls" && (
            <div className="space-y-4">
              {activeCalls.length === 0 ? (
                <EmptyState title="No active calls" subtitle="Make your first call and own your opinion" />
              ) : (
                activeCalls.map((card, i) => {
                  const pos = userPositions[card.id];
                  if (!pos) return null;
                  const sidePercent = pos.side === "yes" ? card.yesPercent : card.noPercent;
                  const { netWin } = calculateNetWin(pos.coins, sidePercent);
                  const crowd = getCrowdContext(card.yesPercent, card.noPercent);
                  const status = statusConfig[card.status || "open"];

                  return (
                    <motion.div
                      key={card.id}
                      className="card-gold bg-card p-5 cursor-pointer"
                      onClick={() => navigate(`/opinion/${card.id}`)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.08 }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-body text-[15px] font-semibold text-foreground leading-snug mb-2">{card.question}</h3>
                          <p className={`text-[13px] font-medium mb-1 ${pos.side === "yes" ? "text-yes" : "text-no"}`}>
                            You called {pos.side === "yes" ? "Yes" : "No"}
                          </p>
                          <p className="text-xs text-muted-foreground mb-1">{pos.coins} coins called</p>
                          <span className={`inline-block text-[11px] ${crowd.classes}`}>{crowd.label}</span>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${status.classes}`}>{status.label}</span>
                          <span className="text-gold font-semibold text-sm">+{Math.round(netWin)} coins</span>
                          <span className="text-xs text-muted-foreground">{card.timeLeft}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}

          {/* My Opinions */}
          {activeTab === "My Opinions" && (
            <div className="space-y-4">
              {myOpinions.length === 0 ? (
                <EmptyState title="No opinions yet" subtitle="Create your first opinion and let the crowd call it" />
              ) : (
                myOpinions.map((card, i) => {
                  const status = statusConfig[card.status || "open"];
                  const resLabel = card.resolutionType === "event" ? "Event Based" : card.resolutionType === "metric" ? "Metric Based" : "Crowd Based";
                  return (
                    <motion.div
                      key={card.id}
                      className="card-gold bg-card p-5 cursor-pointer"
                      onClick={() => navigate(`/opinion/${card.id}`)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.08 }}
                    >
                      <h3 className="font-body text-[15px] font-semibold text-foreground leading-snug mb-2">{card.question}</h3>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${status.classes}`}>{status.label}</span>
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">{resLabel}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground font-body">{card.callerCount ?? 0} callers</span>
                        <span className="text-sm font-semibold text-gold">{card.coins.toLocaleString()} coins in pool</span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}

          {/* Biggest Wins */}
          {activeTab === "Biggest Wins" && (
            <div className="space-y-4">
              {biggestWins.length === 0 ? (
                <EmptyState title="No wins yet" subtitle="Start calling and stack your wins" />
              ) : (
                biggestWins.map((win, i) => (
                  <motion.div
                    key={i}
                    className="card-gold bg-card p-5"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                  >
                    <h3 className="font-body text-[15px] font-semibold text-foreground leading-snug mb-2">{win.question}</h3>
                    <p className="text-base font-bold text-yes mb-1">+{win.coinsWon} coins won</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-[13px] font-medium ${win.side === "yes" ? "text-yes" : "text-no"}`}>
                        Called {win.side === "yes" ? "Yes" : "No"}
                      </span>
                      <span className="text-[12px] text-muted-foreground font-body">
                        Against {win.againstPercent}% of callers
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 font-body">{win.date}</p>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* History */}
          {activeTab === "History" && (
            <div>
              <div className="flex gap-2 mb-6 flex-wrap">
                {historyFilters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setHistoryFilter(f)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                      historyFilter === f ? "bg-gold text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                {filteredHistory.length === 0 ? (
                  <EmptyState title="No calls match this filter" subtitle="Try a different filter or make more calls" />
                ) : (
                  filteredHistory.map((card, i) => {
                    const pos = userPositions[card.id];
                    if (!pos) return null;
                    const isWin = card.status === "resolved" && card.winner === pos.side;
                    const isDraw = card.status === "draw";
                    const { netWin } = calculateNetWin(pos.coins, pos.side === "yes" ? card.yesPercent : card.noPercent);

                    return (
                      <motion.div
                        key={card.id}
                        className="card-gold bg-card p-5 cursor-pointer"
                        onClick={() => navigate(`/opinion/${card.id}`)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.08 }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-body text-[15px] font-semibold text-foreground leading-snug mb-2">{card.question}</h3>
                            <p className={`text-[13px] font-medium mb-1 ${pos.side === "yes" ? "text-yes" : "text-no"}`}>
                              You called {pos.side === "yes" ? "Yes" : "No"}
                            </p>
                            <p className="text-xs text-muted-foreground">{pos.coins} coins called</p>
                          </div>
                          <div className="flex flex-col items-end shrink-0">
                            {isWin && <span className="text-yes font-bold text-base">+{Math.round(netWin)} coins</span>}
                            {!isWin && !isDraw && <span className="text-muted-foreground text-sm">0 returned</span>}
                            {isDraw && <span className="text-no text-sm font-medium">Refunded · {pos.coins} coins</span>}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Leaderboard */}
          {activeTab === "Leaderboard" && (
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6">
                <h2 className="font-headline text-2xl md:text-3xl font-bold text-foreground">The Ones Who Called It</h2>
                <p className="mt-1 text-sm font-body text-muted-foreground">Ranked by coins won, win rate and streak</p>
              </motion.div>

              {/* Time Tabs */}
              <div className="relative border-b border-border mb-4">
                <div className="flex gap-1">
                  {timeTabs.map((t) => (
                    <button key={t} onClick={() => setTimeTab(t)} className="relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors">
                      <span className={timeTab === t ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}>{t}</span>
                      {timeTab === t && (
                        <motion.div layoutId="lb-time-underline" className="absolute bottom-0 left-2 right-2 h-0.5 bg-gold rounded-full" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                {categoryTabs.map((c) => (
                  <button key={c} onClick={() => setCategoryTab(c)} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${categoryTab === c ? "bg-gold text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                    {c}
                  </button>
                ))}
              </div>

              {/* Leaderboard List */}
              <div className="space-y-3 mb-8">
                {leaderboardData.map((entry, i) => {
                  const isTop3 = entry.rank <= 3;
                  const rankColor = getRankColor(entry.rank);
                  return (
                    <motion.div
                      key={entry.rank}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.05 }}
                      className={`relative flex items-center gap-4 bg-card border border-gold-border rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:shadow-lg ${isTop3 ? "p-6" : "px-6 py-4"}`}
                      style={getGlowStyle(entry.rank)}
                    >
                      <div className="relative flex flex-col items-center min-w-[32px]">
                        {entry.rank === 1 && <Crown className="h-4 w-4 text-gold mb-1" />}
                        <span className={`font-headline text-xl font-bold ${getRankTextClass(entry.rank)}`}>{entry.rank}</span>
                      </div>
                      <div className="h-11 w-11 shrink-0 rounded-full bg-secondary border-2 flex items-center justify-center text-xs font-semibold text-muted-foreground" style={{ borderColor: rankColor || "hsl(var(--border))" }}>
                        {entry.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-body text-[15px] font-semibold text-foreground truncate">{entry.username}</span>
                          {entry.isCurrentUser && <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold text-gold leading-none">You</span>}
                        </div>
                        <span className="inline-block mt-1 rounded-full bg-gold/10 px-2.5 py-0.5 text-[11px] font-body text-gold leading-none">{entry.genre}</span>
                      </div>
                      <div className="hidden sm:flex items-center gap-5 text-right">
                        <div>
                          <div className="text-base font-bold font-body text-gold">{entry.coinsWon.toLocaleString()}</div>
                          <div className="text-[11px] text-muted-foreground">coins</div>
                        </div>
                        <div>
                          <div className="text-[13px] font-medium font-body text-yes">{entry.winRate}%</div>
                          <div className="text-[11px] text-muted-foreground">win rate</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Flame className="h-3.5 w-3.5 text-gold" />
                          <span className="text-[13px] font-medium font-body text-foreground">{entry.streak}</span>
                        </div>
                      </div>
                      <div className="sm:hidden flex items-center gap-1 text-right">
                        <span className="text-sm font-bold font-body text-gold">{entry.coinsWon.toLocaleString()}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Your Ranking Strip */}
              <div className="rounded-xl border border-gold-border bg-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-headline text-lg font-bold text-gold">Your rank: #{currentUserStats.rank}</span>
                  <div className="hidden sm:flex items-center gap-4 text-sm">
                    <span className="font-body font-bold text-gold">{currentUserStats.coinsWon.toLocaleString()} coins</span>
                    <span className="font-body font-medium text-yes">{currentUserStats.winRate}% win rate</span>
                    <span className="flex items-center gap-1 font-body font-medium text-foreground">
                      <Flame className="h-3.5 w-3.5 text-gold" />
                      {currentUserStats.streak}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-body text-muted-foreground">Keep calling to climb</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <motion.div className="flex flex-col items-center justify-center py-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h3 className="font-headline text-xl text-muted-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground font-body">{subtitle}</p>
    </motion.div>
  );
}

export default Profile;
