import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Coins, TrendingUp, Trophy, Target } from "lucide-react";
import Navbar from "@/components/Navbar";
import { sampleCards } from "@/data/sampleCards";
import { calculateNetWin, getCrowdContext } from "@/lib/callit";
import { useApp } from "@/context/AppContext";
import NumberFlow from "@/components/ui/number-flow";

const tabs = ["Active Calls", "Call History", "Performance"];

const historyFilters = ["All", "Won", "Lost", "Draw", "Voided"];

const recentActivity = [
  { text: 'You called Yes on "Will Drake drop an album before summer?"', result: "active", coins: 0, time: "1d ago" },
  { text: 'You called Yes on "Is Kendrick\'s run the greatest?"', result: "won", coins: 240, time: "2d ago" },
  { text: 'You called No on "Will crypto hit 100k again?"', result: "active", coins: 0, time: "2d ago" },
  { text: 'You called Yes on "Is Messi the GOAT?"', result: "active", coins: 0, time: "3d ago" },
  { text: 'You called No on "Will it rain Friday in Nairobi?"', result: "draw", coins: 80, time: "4d ago" },
  { text: 'You called Yes on "Is remote work better?"', result: "active", coins: 0, time: "5d ago" },

  { text: 'You called Yes on "Will BTC pass ETH in dev activity?"', result: "won", coins: 180, time: "6d ago" },
  { text: 'You called No on "Is AI replacing designers?"', result: "lost", coins: 120, time: "7d ago" },
  { text: 'You called Yes on "Will Afrobeats dominate 2025?"', result: "won", coins: 320, time: "8d ago" },
  { text: 'You called No on "Is TikTok getting banned?"', result: "lost", coins: 90, time: "9d ago" },
];

const statusConfig: Record<string, { label: string; classes: string }> = {
  open: { label: "Open", classes: "bg-yes/15 text-yes" },
  locked: { label: "Closing", classes: "bg-gold/15 text-gold" },
  resolved: { label: "Resolved", classes: "bg-muted text-muted-foreground" },
  draw: { label: "Draw", classes: "bg-no/15 text-no" },
};

const Portfolio = () => {
  const [activeTab, setActiveTab] = useState("Active Calls");
  const [historyFilter, setHistoryFilter] = useState("All");
  const navigate = useNavigate();
  const { positions: userPositions, user } = useApp();

  const activeCalls = sampleCards.filter((c) => c.status === "open" || c.status === "locked");
  const historyCalls = sampleCards.filter((c) => c.status === "resolved" || c.status === "draw");

  const filteredHistory = historyCalls.filter((c) => {
    if (historyFilter === "All") return true;
    if (historyFilter === "Won") return c.status === "resolved" && c.winner === "yes";
    if (historyFilter === "Lost") return c.status === "resolved" && c.winner === "no";
    if (historyFilter === "Draw") return c.status === "draw";
    if (historyFilter === "Voided") return false; // No voided in sample
    return true;
  });

  const stats = [
    { label: "Total Coins", value: user.balance.toLocaleString(), icon: Coins },
    { label: "Position Value", value: "1,240", icon: TrendingUp },
    { label: "Win Rate", value: "68%", icon: Target },
    { label: "Biggest Win", value: "840", icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-foreground mb-1">Your Calls</h1>
          <p className="text-sm text-muted-foreground font-body">Track your active calls and performance</p>
        </motion.div>

        {/* Performance Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {stats.map((stat, i) => {
            const isNumeric = !isNaN(Number(stat.value.replace(/,/g, '').replace('%', '')));
            const numValue = isNumeric ? Number(stat.value.replace(/,/g, '').replace('%', '')) : null;
            const isPercent = stat.value.includes('%');
            
            return (
              <motion.div
                key={stat.label}
                className="bg-card border border-gold rounded-xl p-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-body">{stat.label}</span>
                </div>
                {isNumeric && numValue !== null ? (
                  <div className="flex items-baseline">
                    <NumberFlow 
                      value={numValue} 
                      className="font-headline text-2xl font-bold text-gold"
                    />
                    {isPercent && <span className="font-headline text-2xl font-bold text-gold">%</span>}
                  </div>
                ) : (
                  <span className="font-headline text-2xl font-bold text-gold">{stat.value}</span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="relative border-b border-border mt-10">
          <div className="flex gap-1">
            {tabs.map((tab) => (
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
                    layoutId="portfolio-tab-underline"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-gold rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "Active Calls" && (
            <div className="space-y-4">
              {activeCalls.length === 0 ? (
                <motion.div
                  className="text-center py-16"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-muted-foreground font-body mb-4">No active calls yet</p>
                  <button
                    onClick={() => navigate("/call-it")}
                    className="rounded-full bg-gold px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-gold-hover transition-colors"
                  >
                    Call It
                  </button>
                </motion.div>
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
                      className="card-gold bg-card p-5 cursor-pointer group"
                      onClick={() => navigate(`/opinion/${card.id}`)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.08 }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-body text-[15px] font-semibold text-foreground leading-snug mb-2">
                            {card.question}
                          </h3>
                          <p className={`text-[13px] font-medium mb-1 ${pos.side === "yes" ? "text-yes" : "text-no"}`}>
                            You called {pos.side === "yes" ? "Yes" : "No"}
                          </p>
                          <p className="text-xs text-muted-foreground mb-1">
                            {pos.coins} coins called
                          </p>
                          <span className={`inline-block text-[11px] ${crowd.classes}`}>
                            {crowd.label}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${status.classes}`}>
                            {status.label}
                          </span>
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

          {activeTab === "Call History" && (
            <div>
              {/* Filter pills */}
              <div className="flex gap-2 mb-6 flex-wrap">
                {historyFilters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setHistoryFilter(f)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                      historyFilter === f
                        ? "bg-gold text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {filteredHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12 font-body">No calls match this filter</p>
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
                            <h3 className="font-body text-[15px] font-semibold text-foreground leading-snug mb-2">
                              {card.question}
                            </h3>
                            <p className={`text-[13px] font-medium mb-1 ${pos.side === "yes" ? "text-yes" : "text-no"}`}>
                              You called {pos.side === "yes" ? "Yes" : "No"}
                            </p>
                            <p className="text-xs text-muted-foreground">{pos.coins} coins called</p>
                          </div>
                          <div className="flex flex-col items-end shrink-0">
                            {isWin && (
                              <span className="text-yes font-bold text-base">+{Math.round(netWin)} coins</span>
                            )}
                            {!isWin && !isDraw && (
                              <span className="text-muted-foreground text-sm">0 returned</span>
                            )}
                            {isDraw && (
                              <span className="text-no text-sm font-medium">Refunded · {pos.coins} coins</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === "Performance" && (
            <div>
              {/* Win rate hero */}
              <motion.div
                className="text-center py-10"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <p className="text-sm text-muted-foreground font-body mb-2">Win Rate</p>
                <span className="font-headline text-5xl font-bold text-gold">68%</span>
              </motion.div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {[
                  { label: "Total Calls", value: "47" },
                  { label: "Won", value: "32" },
                  { label: "Lost", value: "12" },
                  { label: "Draw", value: "3" },
                  { label: "Avg Return", value: "+140" },
                  { label: "Best Streak", value: "7" },
                  { label: "Favourite Genre", value: "Sports" },
                  { label: "Early Calls", value: "14" },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    className="bg-card border border-border rounded-xl p-4 text-center"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <p className="text-xs text-muted-foreground font-body mb-1">{s.label}</p>
                    <span className="font-headline text-lg font-bold text-foreground">{s.value}</span>
                  </motion.div>
                ))}
              </div>

              {/* Recent activity */}
              <h3 className="font-headline text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.map((a, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                  >
                    <p className={`text-sm font-body flex-1 ${a.result === "won" ? "text-foreground" : "text-muted-foreground"}`}>
                      {a.text}
                      {a.result === "won" && (
                        <span className="text-gold font-semibold ml-2">Won +{a.coins}</span>
                      )}
                      {a.result === "lost" && (
                        <span className="text-muted-foreground ml-2">Lost -{a.coins}</span>
                      )}
                      {a.result === "draw" && (
                        <span className="text-no ml-2">Refunded {a.coins}</span>
                      )}
                    </p>
                    <span className="text-xs text-muted-foreground ml-4 shrink-0">{a.time}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Portfolio;
