import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Target, Trophy, Award, Settings } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/supabaseClient";
import { useApp } from "@/context/AppContext";
import { DotPattern } from "@/components/ui/dot-pattern";
import { SlidingNumber } from "@/components/ui/sliding-number";

const profileTabs = ["Active Calls", "My Opinions", "History"] as const;
const historyFilters = ["All", "Won", "Lost"];

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <motion.div className="flex flex-col items-center justify-center py-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h3 className="font-headline text-xl text-muted-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </motion.div>
  );
}

const Profile = () => {
  const [activeTab, setActiveTab] = useState<typeof profileTabs[number]>("Active Calls");
  const [historyFilter, setHistoryFilter] = useState("All");
  const [profile, setProfile] = useState<any>(null);
  const [activeCalls, setActiveCalls] = useState<any[]>([]);
  const [myOpinions, setMyOpinions] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, isLoggedIn } = useApp();

  useEffect(() => {
    if (!isLoggedIn) { navigate("/auth"); return; }
    fetchProfileData();
  }, [isLoggedIn]);

  const fetchProfileData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data: profileData } = await supabase
      .from("profiles").select("*").eq("id", authUser.id).single();
    setProfile(profileData);

    const { data: callsData } = await supabase
      .from("calls")
      .select("*, opinions(id, statement, status, options, end_time, topics(name))")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false });

    setActiveCalls((callsData || []).filter((c: any) => c.opinions?.status === "open"));
    setHistory((callsData || []).filter((c: any) => c.opinions?.status === "closed"));

    const { data: opinionsData } = await supabase
      .from("opinions").select("*, topics(name)")
      .eq("creator_id", authUser.id)
      .order("created_at", { ascending: false });
    setMyOpinions(opinionsData || []);
    setLoading(false);
  };

  const filteredHistory = history.filter(c => {
    if (historyFilter === "All") return true;
    if (historyFilter === "Won") return c.opinions?.winning_option === c.chosen_option;
    if (historyFilter === "Lost") return c.opinions?.winning_option && c.opinions?.winning_option !== c.chosen_option;
    return true;
  });

  const winRate = profile?.total_calls > 0
    ? Math.round((profile.wins / profile.total_calls) * 100)
    : 0;

  const stats = [
    { label: "Calls Made", value: profile?.total_calls || 0, icon: Target },
    { label: "Win Rate", value: winRate, suffix: "%", icon: Award },
    { label: "Wins", value: profile?.wins || 0, icon: Trophy },
    { label: "Losses", value: profile?.losses || 0, icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">

        <motion.div
          className="relative bg-card border border-border rounded-2xl p-8 mb-8 overflow-hidden"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        >
          <DotPattern className="fill-[#F5C518]/10 [mask-image:linear-gradient(to_left,white,transparent)] z-0" width={12} height={12} cr={0.8} />
          <div className="relative z-10 flex flex-col md:flex-row md:items-start gap-6 md:gap-10">
            <div className="flex flex-col items-center md:items-start gap-3">
              <div className="h-20 w-20 rounded-full bg-secondary border-[3px] border-gold flex items-center justify-center text-2xl font-bold text-muted-foreground">
                {user.initials || "?"}
              </div>
              <div className="text-center md:text-left">
                <h2 className="font-headline text-2xl font-bold text-foreground">{profile?.username || user.username}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Joined {user.joinDate}</p>
                {profile?.bio && <p className="text-sm text-muted-foreground">{profile.bio}</p>}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-end mb-3">
                <Link to="/settings" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors">
                  <Settings className="h-3.5 w-3.5" /> Settings
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {stats.map((stat, i) => (
                  <motion.div key={stat.label} className="bg-secondary rounded-xl p-4 text-center"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.06 }}>
                    <div className="flex items-center justify-center gap-1.5 mb-1.5">
                      <stat.icon className="h-3.5 w-3.5 text-gold" />
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </div>
                    <div className="font-headline text-xl font-bold text-gold flex items-center justify-center">
                      <SlidingNumber value={stat.value} />
                      {stat.suffix && <span>{stat.suffix}</span>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="relative border-b border-border mb-6">
          <div className="flex gap-1 overflow-x-auto">
            {profileTabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors">
                <span className={activeTab === tab ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}>
                  {tab}
                </span>
                {activeTab === tab && (
                  <motion.div layoutId="profile-tab" className="absolute bottom-0 left-2 right-2 h-0.5 bg-gold rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-secondary animate-pulse" />)}
          </div>
        ) : (
          <div>
            {activeTab === "Active Calls" && (
              <div className="space-y-4">
                {activeCalls.length === 0 ? (
                  <EmptyState title="No active calls" subtitle="Make your first call and own your opinion" />
                ) : activeCalls.map((call, i) => (
                  <motion.div key={call.id}
                    className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-gold/50 transition-all"
                    onClick={() => navigate(`/opinion/${call.opinions?.id}`)}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground leading-snug mb-2">{call.opinions?.statement}</h3>
                        <p className="text-xs text-muted-foreground">
                          You called: <span className="font-semibold text-gold">{call.chosen_option}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{call.opinions?.topics?.name}</p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-yes/15 text-yes font-medium shrink-0">Open</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === "My Opinions" && (
              <div className="space-y-4">
                {myOpinions.length === 0 ? (
                  <EmptyState title="No opinions yet" subtitle="Create your first opinion and let the crowd call it" />
                ) : myOpinions.map((op, i) => (
                  <motion.div key={op.id}
                    className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-gold/50 transition-all"
                    onClick={() => navigate(`/opinion/${op.id}`)}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <h3 className="text-sm font-semibold text-foreground mb-2">{op.statement}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${op.status === "open" ? "bg-yes/15 text-yes" : "bg-muted text-muted-foreground"}`}>
                        {op.status}
                      </span>
                      <span className="text-xs text-muted-foreground">{op.topics?.name}</span>
                      <span className="text-xs text-gold font-semibold flex items-center gap-0.5">
                        <SlidingNumber value={op.call_count || 0} /> callers
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === "History" && (
              <div>
                <div className="flex gap-2 mb-6 flex-wrap">
                  {historyFilters.map((f) => (
                    <button key={f} onClick={() => setHistoryFilter(f)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${historyFilter === f ? "bg-gold text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}>{f}</button>
                  ))}
                </div>
                <div className="space-y-4">
                  {filteredHistory.length === 0 ? (
                    <EmptyState title="No calls match this filter" subtitle="Try a different filter" />
                  ) : filteredHistory.map((call, i) => {
                    const won = call.opinions?.winning_option === call.chosen_option;
                    const resolved = !!call.opinions?.winning_option;
                    return (
                      <motion.div key={call.id}
                        className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-gold/50 transition-all"
                        onClick={() => navigate(`/opinion/${call.opinions?.id}`)}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-foreground mb-1">{call.opinions?.statement}</h3>
                            <p className="text-xs text-muted-foreground">Called: <span className="text-gold font-semibold">{call.chosen_option}</span></p>
                          </div>
                          <span className={`text-xs font-bold ${won ? "text-yes" : resolved ? "text-destructive" : "text-muted-foreground"}`}>
                            {won ? "Won" : resolved ? "Lost" : "Pending"}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;