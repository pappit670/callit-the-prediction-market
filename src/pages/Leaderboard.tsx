import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Crown, Flame, Trophy } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/supabaseClient";
import { useApp } from "@/context/AppContext";
import { SlidingNumber } from "@/components/ui/sliding-number";

const timeTabs = ["This Week", "This Month", "All Time"] as const;

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
  // No glow effects in the financial-grade theme.
  if (rank === 1) return {};
  if (rank === 2) return {};
  if (rank === 3) return {};
  return {};
}

const Leaderboard = () => {
  const [timeTab, setTimeTab] = useState<typeof timeTabs[number]>("All Time");
  const [entries, setEntries] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isLoggedIn } = useApp();

  useEffect(() => { fetchLeaderboard(); }, [timeTab]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, wins, losses, total_calls, avatar_url")
        .gt("total_calls", 0)
        .order("wins", { ascending: false })
        .limit(20);

      if (data) {
        const ranked = data.map((p, i) => ({
          ...p,
          rank: i + 1,
          winRate: p.total_calls > 0 ? Math.round((p.wins / p.total_calls) * 100) : 0,
          initials: p.username?.slice(0, 2).toUpperCase() || "??",
        }));
        setEntries(ranked);

        if (isLoggedIn) {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          const myEntry = ranked.find(e => e.id === authUser?.id);
          if (myEntry) {
            setUserRank(myEntry);
          } else {
            const { data: myProfile } = await supabase
              .from("profiles").select("id, username, wins, losses, total_calls")
              .eq("id", authUser?.id).single();
            if (myProfile) setUserRank({
              ...myProfile,
              rank: ranked.length + 1,
              winRate: myProfile.total_calls > 0 ? Math.round((myProfile.wins / myProfile.total_calls) * 100) : 0,
              initials: myProfile.username?.slice(0, 2).toUpperCase() || "??",
            });
          }
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 md:px-6 py-8">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-foreground">The Ones Who Called It</h1>
          <p className="mt-2 text-sm text-muted-foreground">Ranked by wins, win rate and total calls</p>
        </motion.div>

        <div className="relative border-b border-border mb-6">
          <div className="flex gap-1">
            {timeTabs.map((t) => (
              <button key={t} onClick={() => setTimeTab(t)}
                className="relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors">
                <span className={timeTab === t ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}>{t}</span>
                {timeTab === t && (
                  <motion.div layoutId="time-underline" className="absolute bottom-0 left-2 right-2 h-0.5 bg-gold rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-secondary animate-pulse" />)}
          </div>
        ) : entries.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="font-headline text-xl text-muted-foreground mb-2">No rankings yet</h3>
            <p className="text-sm text-muted-foreground">Be the first to call and climb</p>
            <button onClick={() => navigate("/call-it")}
              className="mt-6 rounded-full bg-gold px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-gold-hover transition-colors">
              Make a Call
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, i) => {
              const isTop3 = entry.rank <= 3;
              const rankColor = getRankColor(entry.rank);
              const isMe = userRank?.id === entry.id;
              return (
                <motion.div key={entry.id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className={`relative flex items-center gap-4 bg-card border border-border rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-gold ${isTop3 ? "p-6" : "px-6 py-4"
                    } ${isMe ? "border-gold/50" : ""}`}
                  style={getGlowStyle(entry.rank)}
                >
                  <div className="relative flex flex-col items-center min-w-[32px]">
                    {entry.rank === 1 && <Crown className="h-4 w-4 text-gold mb-1" />}
                    <span className={`font-headline text-xl font-bold ${getRankTextClass(entry.rank)}`}>{entry.rank}</span>
                  </div>
                  <div className="h-11 w-11 shrink-0 rounded-full bg-secondary border-2 flex items-center justify-center text-xs font-semibold text-muted-foreground"
                    style={{ borderColor: rankColor || "hsl(var(--border))" }}>
                    {entry.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">{entry.username}</span>
                      {isMe && <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold text-gold">You</span>}
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <SlidingNumber value={entry.total_calls} /> calls made
                    </span>
                  </div>
                  <div className="hidden sm:flex items-center gap-5 text-right">
                    <div>
                      <div className="text-base font-bold text-gold flex items-center justify-end">
                        <SlidingNumber value={entry.wins} />
                      </div>
                      <div className="text-xs text-muted-foreground">wins</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-yes flex items-center justify-end">
                        <SlidingNumber value={entry.winRate} /><span>%</span>
                      </div>
                      <div className="text-xs text-muted-foreground">win rate</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Flame className="h-3.5 w-3.5 text-gold" />
                      <span className="text-sm font-medium text-foreground">
                        <SlidingNumber value={entry.total_calls} />
                      </span>
                    </div>
                  </div>
                  <div className="sm:hidden">
                    <span className="text-sm font-bold text-gold flex items-center">
                      <SlidingNumber value={entry.wins} /> wins
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {userRank && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gold/30 bg-card/95 backdrop-blur-md">
          <div className="mx-auto max-w-3xl flex items-center justify-between px-4 md:px-6 py-3">
            <div className="flex items-center gap-4">
              <span className="font-headline text-lg font-bold text-gold">Your rank: #{userRank.rank}</span>
              <div className="hidden sm:flex items-center gap-4 text-sm">
                <span className="font-bold text-gold flex items-center gap-1">
                  <SlidingNumber value={userRank.wins} /> wins
                </span>
                <span className="font-medium text-yes flex items-center gap-1">
                  <SlidingNumber value={userRank.winRate} />% win rate
                </span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">Keep calling to climb</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;