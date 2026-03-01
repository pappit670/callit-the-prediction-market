import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Crown, Flame, Trophy } from "lucide-react";
import Navbar from "@/components/Navbar";

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
  { rank: 1, username: "vibecheck", initials: "VC", genre: "Music & Culture", coinsWon: 12400, winRate: 82, streak: 9, },
  { rank: 2, username: "goatdebater", initials: "GD", genre: "Sports", coinsWon: 9800, winRate: 76, streak: 7, },
  { rank: 3, username: "cryptobro", initials: "CB", genre: "Crypto & Money", coinsWon: 8200, winRate: 71, streak: 5, },
  { rank: 4, username: "hiphophead", initials: "HH", genre: "Music & Culture", coinsWon: 6500, winRate: 68, streak: 4, },
  { rank: 5, username: "nairobiguide", initials: "NG", genre: "Local", coinsWon: 5100, winRate: 65, streak: 3, },
  { rank: 6, username: "worklife", initials: "WL", genre: "Random", coinsWon: 4200, winRate: 62, streak: 2, },
  { rank: 7, username: "politicsjunkie", initials: "PJ", genre: "Politics & Society", coinsWon: 3800, winRate: 59, streak: 4, },
  { rank: 8, username: "sportsfan99", initials: "SF", genre: "Sports", coinsWon: 3200, winRate: 57, streak: 1, },
  { rank: 9, username: "memequeen", initials: "MQ", genre: "Entertainment", coinsWon: 2900, winRate: 55, streak: 2, },
  { rank: 10, username: "trendwatcher", initials: "TW", genre: "Trending", coinsWon: 2600, winRate: 53, streak: 1, },
];

const currentUserStats: LeaderboardEntry = {
  rank: 24,
  username: "you",
  initials: "JD",
  genre: "Music & Culture",
  coinsWon: 1240,
  winRate: 68,
  streak: 3,
  isCurrentUser: true,
};

function getRankColor(rank: number) {
  if (rank === 1) return "hsl(47 91% 52%)"; // gold
  if (rank === 2) return "hsl(0 0% 75%)";   // silver
  if (rank === 3) return "hsl(29 69% 50%)";  // bronze
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

const Leaderboard = () => {
  const [timeTab, setTimeTab] = useState<typeof timeTabs[number]>("All Time");
  const [categoryTab, setCategoryTab] = useState<typeof categoryTabs[number]>("Most Coins Won");
  const navigate = useNavigate();

  const isEmpty = false; // toggle for empty state demo

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 md:px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-foreground">
            The Ones Who Called It
          </h1>
          <p className="mt-2 text-sm font-body text-muted-foreground">
            Ranked by coins won, win rate and streak
          </p>
        </motion.div>

        {/* Time Tabs */}
        <div className="relative border-b border-border mb-4">
          <div className="flex gap-1">
            {timeTabs.map((t) => (
              <button
                key={t}
                onClick={() => setTimeTab(t)}
                className="relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors"
              >
                <span className={timeTab === t ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}>
                  {t}
                </span>
                {timeTab === t && (
                  <motion.div
                    layoutId="time-underline"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-gold rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categoryTabs.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryTab(c)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                categoryTab === c
                  ? "bg-gold text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <Trophy className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="font-headline text-xl text-muted-foreground mb-2">No rankings yet</h3>
            <p className="text-sm font-body text-muted-foreground">Be the first to call and climb</p>
            <button
              onClick={() => navigate("/call-it")}
              className="mt-6 rounded-full bg-gold px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-gold-hover transition-colors"
            >
              Make a Call
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {leaderboardData.map((entry, i) => {
              const isTop3 = entry.rank <= 3;
              const rankColor = getRankColor(entry.rank);

              return (
                <motion.div
                  key={entry.rank}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className={`relative flex items-center gap-4 bg-card border border-gold-border rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:shadow-lg ${
                    isTop3 ? "p-6" : "px-6 py-4"
                  }`}
                  style={getGlowStyle(entry.rank)}
                >
                  {/* Rank */}
                  <div className="relative flex flex-col items-center min-w-[32px]">
                    {entry.rank === 1 && (
                      <Crown className="h-4 w-4 text-gold mb-1" />
                    )}
                    <span className={`font-headline text-xl font-bold ${getRankTextClass(entry.rank)}`}>
                      {entry.rank}
                    </span>
                  </div>

                  {/* Avatar */}
                  <div
                    className="h-11 w-11 shrink-0 rounded-full bg-secondary border-2 flex items-center justify-center text-xs font-semibold text-muted-foreground"
                    style={{ borderColor: rankColor || "hsl(var(--border))" }}
                  >
                    {entry.initials}
                  </div>

                  {/* Name + Genre */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-body text-[15px] font-semibold text-foreground truncate">
                        {entry.username}
                      </span>
                      {entry.isCurrentUser && (
                        <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold text-gold leading-none">
                          You
                        </span>
                      )}
                    </div>
                    <span className="inline-block mt-1 rounded-full bg-gold/10 px-2.5 py-0.5 text-[11px] font-body text-gold leading-none">
                      {entry.genre}
                    </span>
                  </div>

                  {/* Stats */}
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

                  {/* Mobile stats */}
                  <div className="sm:hidden flex items-center gap-1 text-right">
                    <span className="text-sm font-bold font-body text-gold">{entry.coinsWon.toLocaleString()}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Your Ranking Strip */}
      {!isEmpty && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gold-border bg-card/95 backdrop-blur-md">
          <div className="mx-auto max-w-3xl flex items-center justify-between px-4 md:px-6 py-3">
            <div className="flex items-center gap-4">
              <span className="font-headline text-lg font-bold text-gold">
                Your rank: #{currentUserStats.rank}
              </span>
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
  );
};

export default Leaderboard;
