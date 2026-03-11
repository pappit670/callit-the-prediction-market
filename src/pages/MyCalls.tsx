import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Megaphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useApp } from "@/context/AppContext";

const MyCalls = () => {
  const navigate = useNavigate();
  const { postedCalls } = useApp();
  const [activeTab, setActiveTab] = useState<"active" | "resolved">("active");

  const activeCalls = postedCalls.filter(c => true); // Mock logic for simplicity
  const resolvedCalls = [] as typeof postedCalls;

  const currentList = activeTab === "active" ? activeCalls : resolvedCalls;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <main className="mx-auto max-w-4xl px-4 md:px-6 pt-12">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-8">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            My Calls
          </span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center border border-gold">
              <Megaphone className="h-6 w-6 text-gold" />
            </div>
            <div>
              <h1 className="font-headline text-3xl md:text-4xl font-bold text-foreground leading-tight">
                My Posted Calls
              </h1>
            </div>
          </div>
          
          <button 
            onClick={() => navigate("/call-it")}
            className="rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-gold-hover transition-all hidden md:block"
          >
            Post New Call
          </button>
        </motion.div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-8">
          {(["active", "resolved"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 pb-4 text-sm font-semibold font-body transition-all relative capitalize ${
                activeTab === tab ? "text-gold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab} Calls
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold rounded-full" />}
            </button>
          ))}
        </div>

        {/* List */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {currentList.length > 0 ? (
              currentList.map(call => (
                <div key={call.id} className="bg-card border border-border rounded-xl p-5 hover:border-gold transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                      {call.category} · Ends {call.duration}
                    </span>
                    <h3 className="font-headline text-lg font-bold text-foreground mb-2 leading-tight max-w-xl">
                      {call.question}
                    </h3>
                    <div className="flex items-center gap-4 text-xs font-medium font-body">
                      <span className="text-gold">Pool: {Math.floor(call.stake * 3.5).toLocaleString()} coins</span>
                      <span className="text-muted-foreground">{call.resolutionType} resolution</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 text-xs font-semibold rounded bg-secondary text-foreground hover:bg-secondary/80 transition-colors">
                      Edit
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-xl bg-secondary/10">
                <p className="text-muted-foreground font-body mb-4">No {activeTab} calls found.</p>
                {activeTab === "active" && (
                  <button 
                    onClick={() => navigate("/call-it")}
                    className="rounded-full bg-foreground text-background px-6 py-2.5 text-sm font-semibold hover:bg-foreground/90 transition-all font-body md:hidden"
                  >
                    Post New Call
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </main>
    </div>
  );
};

export default MyCalls;
