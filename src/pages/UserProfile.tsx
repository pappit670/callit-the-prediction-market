import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Coins, Target, Trophy, Award, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { sampleCards } from "@/data/sampleCards";

const profileTabs = ["My Opinions", "Biggest Wins"] as const;

// Mock user data
const usersData: Record<string, { username: string; initials: string; joined: string; views: number; callsMade: number; winRate: number; bestWin: number; ranking: number }> = {
  vibecheck: { username: "vibecheck", initials: "VC", joined: "Dec 2025", views: 3200, callsMade: 124, winRate: 82, bestWin: 2400, ranking: 1 },
  goatdebater: { username: "goatdebater", initials: "GD", joined: "Jan 2026", views: 1800, callsMade: 89, winRate: 76, bestWin: 1600, ranking: 2 },
  cryptobro: { username: "cryptobro", initials: "CB", joined: "Nov 2025", views: 960, callsMade: 67, winRate: 71, bestWin: 1200, ranking: 3 },
  hiphophead: { username: "hiphophead", initials: "HH", joined: "Feb 2026", views: 540, callsMade: 45, winRate: 68, bestWin: 840, ranking: 4 },
  nairobiguide: { username: "nairobiguide", initials: "NG", joined: "Jan 2026", views: 320, callsMade: 34, winRate: 65, bestWin: 600, ranking: 5 },
  worklife: { username: "worklife", initials: "WL", joined: "Mar 2026", views: 210, callsMade: 22, winRate: 62, bestWin: 400, ranking: 6 },
};

const biggestWinsData: Record<string, { question: string; coinsWon: number; side: "yes" | "no"; againstPercent: number; date: string }[]> = {
  vibecheck: [
    { question: "Is Kendrick's run the greatest in hip hop history?", coinsWon: 2400, side: "yes", againstPercent: 22, date: "Feb 10, 2026" },
    { question: "Will Afrobeats dominate 2025?", coinsWon: 1200, side: "yes", againstPercent: 35, date: "Jan 20, 2026" },
  ],
  goatdebater: [
    { question: "Is Lionel Messi the greatest of all time?", coinsWon: 1600, side: "yes", againstPercent: 29, date: "Feb 5, 2026" },
  ],
};

const statusConfig: Record<string, { label: string; classes: string }> = {
  open: { label: "Open", classes: "bg-yes/15 text-yes" },
  locked: { label: "Closing", classes: "bg-gold/15 text-gold" },
  resolved: { label: "Resolved", classes: "bg-muted text-muted-foreground" },
  draw: { label: "Draw", classes: "bg-no/15 text-no" },
};

const UserProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<typeof profileTabs[number]>("My Opinions");

  const user = usersData[username || ""];

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-20">
          <h3 className="font-headline text-xl text-muted-foreground mb-2">User not found</h3>
          <p className="text-sm text-muted-foreground font-body">This caller doesn't exist</p>
        </div>
      </div>
    );
  }

  const userOpinions = sampleCards.filter((c) => c.creator === user.username);
  const wins = biggestWinsData[user.username] || [];

  const stats = [
    { label: "Calls Made", value: user.callsMade.toString(), icon: Target },
    { label: "Win Rate", value: `${user.winRate}%`, icon: Award },
    { label: "Best Win", value: user.bestWin.toLocaleString(), icon: Coins },
    { label: "Ranking", value: `#${user.ranking}`, icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground hover:text-gold transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-body">Back</span>
        </button>

        {/* Profile Header Card */}
        <motion.div
          className="bg-card border-b border-gold-border rounded-[20px] p-8 md:p-10 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-10">
            {/* Left: Avatar + Info */}
            <div className="flex flex-col items-center md:items-start gap-3">
              <div className="h-20 w-20 rounded-full bg-secondary border-[3px] border-gold flex items-center justify-center text-2xl font-bold text-muted-foreground font-headline">
                {user.initials}
              </div>
              <div className="text-center md:text-left">
                <h2 className="font-headline text-2xl font-bold text-foreground">{user.username}</h2>
                <p className="text-[13px] text-muted-foreground font-body mt-0.5">Joined {user.joined}</p>
                <p className="text-[13px] text-muted-foreground font-body">{user.views.toLocaleString()} total views on opinions</p>
              </div>
            </div>

            {/* Right: Stats + Follow */}
            <div className="flex-1">
              <div className="flex justify-end mb-3">
                <div className="relative">
                  <button
                    disabled
                    className="rounded-full border border-gold px-4 py-1.5 text-[13px] font-semibold text-gold font-body opacity-60 cursor-not-allowed"
                  >
                    Follow
                  </button>
                  <span className="absolute -top-2 -right-3 rounded-full bg-gold/20 px-1.5 py-0.5 text-[9px] font-semibold text-gold leading-none">
                    Soon
                  </span>
                </div>
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

        {/* Tabs */}
        <div className="relative border-b border-border mb-6">
          <div className="flex gap-1">
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
                    layoutId="user-profile-tab-underline"
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
          {activeTab === "My Opinions" && (
            <div className="space-y-4">
              {userOpinions.length === 0 ? (
                <EmptyState title="No opinions yet" subtitle="This caller hasn't posted any opinions" />
              ) : (
                userOpinions.map((card, i) => {
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

          {activeTab === "Biggest Wins" && (
            <div className="space-y-4">
              {wins.length === 0 ? (
                <EmptyState title="No wins yet" subtitle="This caller is still building their streak" />
              ) : (
                wins.map((win, i) => (
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
                      <span className="text-[12px] text-muted-foreground font-body">Against {win.againstPercent}% of callers</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 font-body">{win.date}</p>
                  </motion.div>
                ))
              )}
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

export default UserProfile;
