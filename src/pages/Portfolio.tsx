import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Coins, TrendingUp, Trophy, Target, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/supabaseClient";
import { SlidingNumber } from "@/components/ui/sliding-number";

const tabs = ["Active Calls", "Call History", "Performance"];
const historyFilters = ["All", "Won", "Lost"];

const Portfolio = () => {
  const [activeTab, setActiveTab] = useState("Active Calls");
  const [historyFilter, setHistoryFilter] = useState("All");
  const [activeCalls, setActiveCalls] = useState<any[]>([]);
  const [historyCalls, setHistoryCalls] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isLoggedIn } = useApp();

  useEffect(() => {
    if (!isLoggedIn) { navigate("/auth"); return; }
    fetchData();
  }, [isLoggedIn]);

  const fetchData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data: profileData } = await supabase
      .from("profiles").select("*").eq("id", authUser.id).single();
    setProfile(profileData);

    const { data: callsData } = await supabase
      .from("calls")
      .select("*, opinions(id, statement, status, options, end_time, call_count, winning_option, topics!opinions_topic_id_fkey(name, icon))")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false });

    setActiveCalls((callsData || []).filter((c: any) => c.opinions?.status === "open"));
    setHistoryCalls((callsData || []).filter((c: any) => c.opinions?.status === "closed"));
    setLoading(false);
  };

  const filteredHistory = historyCalls.filter(c => {
    if (historyFilter === "All") return true;
    if (historyFilter === "Won") return c.opinions?.winning_option === c.chosen_option;
    if (historyFilter === "Lost") return c.opinions?.winning_option && c.opinions?.winning_option !== c.chosen_option;
    return true;
  });

  const winRate = profile?.total_calls > 0
    ? Math.round((profile.wins / profile.total_calls) * 100)
    : 0;

  const stats = [
    { label: "Balance", value: profile?.balance || 0, icon: Coins },
    { label: "Total Calls", value: profile?.total_calls || 0, icon: TrendingUp },
    { label: "Win Rate", value: winRate, suffix: "%", icon: Target },
    { label: "Total Wins", value: profile?.wins || 0, icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-foreground mb-1">Your Calls</h1>
          <p className="text-sm text-muted-foreground">Track your active calls and performance</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {stats.map((stat, i) => (
            <motion.div key={stat.label}
              className="bg-card border border-gold/30 rounded-xl p-5"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}>
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <div className="font-headline text-2xl font-bold text-gold flex items-center">
                <SlidingNumber value={stat.value} />
                {stat.suffix && <span>{stat.suffix}</span>}
              </div>
            </motion.div>
          ))}
        </div>

        {/* UPGRADED: First-call onboarding banner — only shows when no calls made */}
        {(profile?.total_calls || 0) === 0 && (
          <div className="mt-6 rounded-xl border border-gold/30 bg-gold/5 p-5 flex items-start gap-4">
            <div className="text-2xl">🎯</div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground mb-1">Make your first call</p>
              <p className="text-xs text-muted-foreground mb-3">Pick a question, stake coins, and start building your prediction record. Your wins and accuracy are tracked here.</p>
              <button onClick={() => navigate("/")}
                className="rounded-full bg-gold px-4 py-1.5 text-xs font-bold text-primary-foreground hover:bg-gold-hover transition-colors">
                Browse calls →
              </button>
            </div>
          </div>
        )}

        <div className="relative border-b border-border mt-10">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors">
                <span className={activeTab === tab ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}>
                  {tab}
                </span>
                {activeTab === tab && (
                  <motion.div layoutId="portfolio-tab"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-gold rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {activeTab === "Active Calls" && (
            <div className="space-y-4">
              {loading ? (
                [...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-secondary animate-pulse" />)
              ) : activeCalls.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground mb-4">No active calls yet</p>
                  <button onClick={() => navigate("/call-it")}
                    className="rounded-full bg-gold px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-gold-hover transition-colors">
                    Call It
                  </button>
                </div>
              ) : activeCalls.map((call, i) => (
                <motion.div key={call.id}
                  className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-gold/50 transition-all"
                  onClick={() => navigate(`/opinion/${call.opinions?.id}`)}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">
                        {call.opinions?.topics?.icon} {call.opinions?.topics?.name}
                      </p>
                      <h3 className="text-sm font-semibold text-foreground leading-snug mb-2">
                        {call.opinions?.statement}
                      </h3>
                      <p className="text-xs text-gold font-semibold">Called: {call.chosen_option}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-yes/15 text-yes font-medium shrink-0">Active</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === "Call History" && (
            <div>
              <div className="flex gap-2 mb-6 flex-wrap">
                {historyFilters.map((f) => (
                  <button key={f} onClick={() => setHistoryFilter(f)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${historyFilter === f ? "bg-gold text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}>{f}</button>
                ))}
              </div>
              <div className="space-y-4">
                {loading ? (
                  [...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-secondary animate-pulse" />)
                ) : filteredHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">No calls match this filter</p>
                ) : filteredHistory.map((call, i) => {
                  const won = call.opinions?.winning_option === call.chosen_option;
                  const resolved = !!call.opinions?.winning_option;
                  return (
                    <motion.div key={call.id}
                      className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-gold/50 transition-all"
                      onClick={() => navigate(`/opinion/${call.opinions?.id}`)}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.08 }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-foreground leading-snug mb-1">
                            {call.opinions?.statement}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Called: <span className="text-gold font-semibold">{call.chosen_option}</span>
                          </p>
                        </div>
                        <span className={`text-xs font-bold shrink-0 ${won ? "text-yes" : resolved ? "text-destructive" : "text-muted-foreground"}`}>
                          {won ? "Won" : resolved ? "Lost" : "Pending"}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "Performance" && (
            <div>
              <motion.div className="text-center py-10"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}>
                <p className="text-sm text-muted-foreground mb-2">Win Rate</p>
                <div className="font-headline text-5xl font-bold text-gold flex items-center justify-center">
                  <SlidingNumber value={winRate} /><span>%</span>
                </div>
              </motion.div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {[
                  { label: "Total Calls", value: profile?.total_calls || 0 },
                  { label: "Won", value: profile?.wins || 0 },
                  { label: "Lost", value: profile?.losses || 0 },
                  { label: "Win Rate", value: winRate, suffix: "%" },
                ].map((s, i) => (
                  <motion.div key={s.label}
                    className="bg-card border border-border rounded-xl p-4 text-center"
                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}>
                    <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                    <div className="font-headline text-lg font-bold text-foreground flex items-center justify-center">
                      <SlidingNumber value={s.value} />
                      {s.suffix && <span>{s.suffix}</span>}
                    </div>
                  </motion.div>
                ))}
              </div>

              <h3 className="font-headline text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {[...activeCalls, ...historyCalls].slice(0, 10).map((call, i) => {
                  const won = call.opinions?.winning_option === call.chosen_option;
                  const resolved = call.opinions?.status === "closed";
                  return (
                    <motion.div key={call.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.04 }}>
                      <p className="text-sm flex-1 text-muted-foreground">
                        You called <span className="text-gold font-semibold">{call.chosen_option}</span> on{" "}
                        <span className="text-foreground">"{call.opinions?.statement?.slice(0, 50)}..."</span>
                        {resolved && won && <span className="text-yes font-semibold ml-1">· Won</span>}
                        {resolved && !won && <span className="text-destructive ml-1">· Lost</span>}
                      </p>
                      <span className="text-xs text-muted-foreground ml-4 shrink-0">
                        {new Date(call.created_at).toLocaleDateString()}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Portfolio;