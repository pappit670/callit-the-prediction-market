import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/supabaseClient";
import { Activity, TrendingUp, MessageSquare, Users } from "lucide-react";

interface Signal {
  id: string;
  signal_type: string;
  message: string;
  coins: number;
  created_at: string;
}

// System-generated signals that run even with no real activity
const AMBIENT_SIGNALS = [
  { signal_type: "join",     message: "3 users joined in the last minute",      coins: 0 },
  { signal_type: "stake",    message: "+150 coins staked in last 5 mins",        coins: 150 },
  { signal_type: "movement", message: "YES moved +2% in the last hour",          coins: 0 },
  { signal_type: "argument", message: "New argument posted",                     coins: 0 },
  { signal_type: "join",     message: "7 users viewing this call right now",     coins: 0 },
  { signal_type: "stake",    message: "+80 coins on NO side",                    coins: 80 },
  { signal_type: "movement", message: "Debate heating up — 4 new arguments",    coins: 0 },
  { signal_type: "join",     message: "12 users joined this call today",         coins: 0 },
  { signal_type: "stake",    message: "Majority backing YES — 58%",              coins: 0 },
  { signal_type: "movement", message: "Call trending in Sports",                 coins: 0 },
];

function signalIcon(type: string) {
  switch (type) {
    case "stake":    return <TrendingUp className="h-3 w-3" />;
    case "argument": return <MessageSquare className="h-3 w-3" />;
    case "join":     return <Users className="h-3 w-3" />;
    default:         return <Activity className="h-3 w-3" />;
  }
}

function signalColor(type: string) {
  switch (type) {
    case "stake":    return "text-[#22C55E]";
    case "argument": return "text-[#3B82F6]";
    case "join":     return "text-[#F97316]";
    default:         return "text-muted-foreground";
  }
}

export function LiveSignalFeed({ opinionId }: { opinionId?: string }) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const ambientRef = useRef<NodeJS.Timeout | null>(null);
  const ambientIdx = useRef(0);

  useEffect(() => {
    // Fetch real signals
    const fetchReal = async () => {
      let q = supabase.from("live_signals").select("*")
        .order("created_at", { ascending: false }).limit(15);
      if (opinionId) q = q.eq("opinion_id", opinionId);
      const { data } = await q;
      if (data?.length) setSignals(data);
    };
    fetchReal();

    // Real-time subscription
    const channel = supabase.channel("live-signals")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "live_signals",
        ...(opinionId ? { filter: `opinion_id=eq.${opinionId}` } : {}),
      }, (payload) => {
        setSignals(prev => [payload.new as Signal, ...prev].slice(0, 15));
      })
      .subscribe();

    // Ambient signals — inject every 8-15s to keep feed alive
    const injectAmbient = () => {
      const s = AMBIENT_SIGNALS[ambientIdx.current % AMBIENT_SIGNALS.length];
      ambientIdx.current++;
      const fakeSignal: Signal = {
        id:          `ambient-${Date.now()}`,
        signal_type: s.signal_type,
        message:     s.message,
        coins:       s.coins,
        created_at:  new Date().toISOString(),
      };
      setSignals(prev => [fakeSignal, ...prev].slice(0, 15));
      // Schedule next with random interval
      const next = 8000 + Math.random() * 7000;
      ambientRef.current = setTimeout(injectAmbient, next);
    };
    ambientRef.current = setTimeout(injectAmbient, 3000);

    return () => {
      supabase.removeChannel(channel);
      if (ambientRef.current) clearTimeout(ambientRef.current);
    };
  }, [opinionId]);

  if (!signals.length) return null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/30">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#22C55E]" />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Live Activity
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto">System feed</span>
      </div>

      {/* Scrolling feed */}
      <div className="max-h-[160px] overflow-hidden relative">
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none" />
        <AnimatePresence initial={false}>
          {signals.slice(0, 8).map((s) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 px-3 py-2 border-b border-border/30 last:border-0"
            >
              <span className={`shrink-0 ${signalColor(s.signal_type)}`}>
                {signalIcon(s.signal_type)}
              </span>
              <span className="text-xs text-foreground/70 flex-1 truncate">{s.message}</span>
              {s.coins > 0 && (
                <span className="text-[10px] font-semibold text-[#22C55E] shrink-0">
                  +{s.coins}c
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}