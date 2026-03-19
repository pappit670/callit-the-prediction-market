import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, CheckCircle2, XCircle, Users, TrendingUp, Zap } from "lucide-react";
import { supabase } from "@/supabaseClient";
import { useNavigate } from "react-router-dom";

interface ActivityItem {
  id: string;
  type: "call" | "debate" | "position" | "rising";
  text: string;
  time: string;
  opinionId?: string;
  color?: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}

export function ActivityFeed() {
  const navigate  = useNavigate();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity();
    // Refresh every 30 seconds
    const t = setInterval(fetchActivity, 30000);
    return () => clearInterval(t);
  }, []);

  const fetchActivity = async () => {
    try {
      // Recent calls
      const { data: calls } = await supabase
        .from("calls")
        .select("id, chosen_option, created_at, opinions(id, statement)")
        .order("created_at", { ascending: false })
        .limit(6);

      // Recent debates
      const { data: debates } = await supabase
        .from("debates")
        .select("id, challenger_alias, defender_alias, created_at, challenger_argument, opinions(id, statement)")
        .order("created_at", { ascending: false })
        .limit(4);

      // Recent positions
      const { data: positions } = await supabase
        .from("positions")
        .select("id, stance, anonymous_alias, created_at, opinions(id, statement)")
        .order("created_at", { ascending: false })
        .limit(4);

      const allItems: ActivityItem[] = [];

      calls?.forEach(c => {
        const op = (c as any).opinions;
        if (!op?.statement) return;
        allItems.push({
          id: `call-${c.id}`,
          type: "call",
          text: `Someone called "${c.chosen_option}" on: ${op.statement.slice(0, 50)}...`,
          time: c.created_at,
          opinionId: op.id,
          color: "#F5C518",
        });
      });

      debates?.forEach(d => {
        const op = (d as any).opinions;
        if (!op?.statement) return;
        allItems.push({
          id: `debate-${d.id}`,
          type: "debate",
          text: `${d.challenger_alias} challenged ${d.defender_alias} on: ${op.statement.slice(0, 45)}...`,
          time: d.created_at,
          opinionId: op.id,
          color: "#A855F7",
        });
      });

      positions?.forEach(p => {
        const op = (p as any).opinions;
        if (!op?.statement) return;
        allItems.push({
          id: `pos-${p.id}`,
          type: "position",
          text: `${p.anonymous_alias || "Someone"} ${p.stance === "agree" ? "agreed" : "disagreed"} — ${op.statement.slice(0, 45)}...`,
          time: p.created_at,
          opinionId: op.id,
          color: p.stance === "agree" ? "#00C278" : "#EF4444",
        });
      });

      // Sort by time
      allItems.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setItems(allItems.slice(0, 12));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string, color: string) => {
    const cls = "h-3.5 w-3.5 flex-shrink-0";
    if (type === "debate") return <Swords className={cls} style={{ color }} />;
    if (type === "call") return <Zap className={cls} style={{ color }} />;
    if (type === "position") return color === "#00C278"
      ? <CheckCircle2 className={cls} style={{ color }} />
      : <XCircle className={cls} style={{ color }} />;
    return <TrendingUp className={cls} style={{ color }} />;
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border">
        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-wider text-foreground">Live Activity</span>
        <span className="ml-auto text-[10px] text-muted-foreground">{items.length} events</span>
      </div>

      {loading ? (
        <div className="p-4 space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-10 rounded-xl bg-secondary animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-6 text-center">
          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground">No activity yet</p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          <AnimatePresence initial={false}>
            {items.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => item.opinionId && navigate(`/opinion/${item.opinionId}`)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors text-left"
              >
                <div className="mt-0.5">
                  {getIcon(item.type, item.color || "#F5C518")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground leading-snug line-clamp-2">{item.text}</p>
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">
                  {timeAgo(item.time)}
                </span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
