import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Megaphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/supabaseClient";

const MyCalls = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useApp();
  const [activeTab, setActiveTab] = useState<"active" | "resolved">("active");
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) { navigate("/auth"); return; }
    fetchCalls();
  }, [isLoggedIn]);

  const fetchCalls = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("calls")
      .select("*, opinions(id, statement, status, options, end_time, call_count, winning_option, topics!opinions_topic_id_fkey(name, icon))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setCalls(data || []);
    setLoading(false);
  };

  const activeCalls = calls.filter(c => c.opinions?.status === "open");
  const resolvedCalls = calls.filter(c => c.opinions?.status === "closed");
  const currentList = activeTab === "active" ? activeCalls : resolvedCalls;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 md:px-6 pt-12">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-8">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">My Calls</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center border border-gold">
              <Megaphone className="h-6 w-6 text-gold" />
            </div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-foreground">My Calls</h1>
          </div>
          <button onClick={() => navigate("/call-it")}
            className="rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-gold-hover transition-all hidden md:block">
            Post New Call
          </button>
        </motion.div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-8">
          {(["active", "resolved"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 pb-4 text-sm font-semibold transition-all relative capitalize ${activeTab === tab ? "text-gold" : "text-muted-foreground hover:text-foreground"
                }`}>
              {tab} ({tab === "active" ? activeCalls.length : resolvedCalls.length})
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold rounded-full" />}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-secondary animate-pulse" />)}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
              {currentList.length > 0 ? currentList.map(call => {
                const won = call.opinions?.winning_option === call.chosen_option;
                const resolved = call.opinions?.status === "closed";
                return (
                  <div key={call.id}
                    onClick={() => navigate(`/opinion/${call.opinions?.id}`)}
                    className="bg-card border border-border rounded-xl p-5 hover:border-gold transition-colors cursor-pointer">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                          {call.opinions?.topics?.icon} {call.opinions?.topics?.name}
                          {call.opinions?.end_time && ` · Ends ${new Date(call.opinions.end_time).toLocaleDateString()}`}
                        </span>
                        <h3 className="font-semibold text-foreground mb-2 leading-tight">
                          {call.opinions?.statement}
                        </h3>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-gold font-semibold">Called: {call.chosen_option}</span>
                          <span className="text-muted-foreground">{call.opinions?.call_count || 0} total callers</span>
                          {resolved && (
                            <span className={`font-bold ${won ? "text-yes" : "text-destructive"}`}>
                              {won ? "Won" : "Lost"}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs px-3 py-1.5 rounded-full font-semibold shrink-0 ${resolved ? (won ? "bg-yes/15 text-yes" : "bg-destructive/15 text-destructive") : "bg-gold/10 text-gold"
                        }`}>
                        {resolved ? (won ? "Won" : "Lost") : "Active"}
                      </span>
                    </div>
                  </div>
                );
              }) : (
                <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-xl">
                  <p className="text-muted-foreground mb-4">No {activeTab} calls yet.</p>
                  {activeTab === "active" && (
                    <button onClick={() => navigate("/call-it")}
                      className="rounded-full bg-gold text-primary-foreground px-6 py-2.5 text-sm font-semibold hover:bg-gold-hover transition-all">
                      Make a Call
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
};

export default MyCalls;