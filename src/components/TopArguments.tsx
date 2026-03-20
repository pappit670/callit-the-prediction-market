import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/supabaseClient";
import { CheckCircle2, XCircle } from "lucide-react";

// System-generated punchy arguments as seed content
const SEED_ARGUMENTS = [
  { stance: "agree",    content: "The data clearly supports this outcome based on recent trends." },
  { stance: "disagree", content: "Too many variables at play — this is far from certain." },
  { stance: "agree",    content: "Historical precedent makes this highly likely." },
  { stance: "disagree", content: "The market is pricing this wrong — I'm taking the other side." },
  { stance: "agree",    content: "Fundamentals are strong. Backing YES with confidence." },
  { stance: "disagree", content: "Sentiment is misleading. The real outcome will surprise people." },
];

interface Argument {
  id: string;
  stance: string;
  content: string;
  username?: string;
  created_at: string;
}

export function TopArguments({ opinionId }: { opinionId: string }) {
  const [args, setArgs]       = useState<Argument[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const fetchArgs = async () => {
      const { data } = await supabase
        .from("positions")
        .select("id, stance, argument, anonymous_alias, created_at")
        .eq("opinion_id", opinionId)
        .not("argument", "is", null)
        .order("upvotes", { ascending: false })
        .limit(6);

      if (data && data.length > 0) {
        setArgs(data.map(d => ({
          id:        d.id,
          stance:    d.stance,
          content:   d.argument,
          username:  d.anonymous_alias,
          created_at: d.created_at,
        })));
      } else {
        // Use seed arguments when no real ones exist
        setArgs(SEED_ARGUMENTS.map((s, i) => ({
          id:        `seed-${i}`,
          stance:    s.stance,
          content:   s.content,
          created_at: new Date().toISOString(),
        })));
      }
    };
    fetchArgs();
  }, [opinionId]);

  // Auto-rotate every 4s
  useEffect(() => {
    if (args.length <= 1) return;
    const t = setInterval(() => setCurrent(c => (c + 1) % args.length), 4000);
    return () => clearInterval(t);
  }, [args.length]);

  if (!args.length) return null;

  const arg = args[current];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
          Top Arguments
        </h4>
        <div className="flex items-center gap-1">
          {args.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`h-1 rounded-full transition-all ${
                i === current ? "w-4 bg-foreground" : "w-1 bg-border"
              }`} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={arg.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className={`rounded-xl border p-4 ${
            arg.stance === "agree"
              ? "border-[#22C55E]/20 bg-[#22C55E]/5"
              : "border-[#EF4444]/20 bg-[#EF4444]/5"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {arg.stance === "agree"
              ? <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" />
              : <XCircle     className="h-3.5 w-3.5 text-[#EF4444]" />}
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              arg.stance === "agree" ? "text-[#22C55E]" : "text-[#EF4444]"
            }`}>
              {arg.stance === "agree" ? "For" : "Against"}
            </span>
            {arg.username && (
              <span className="text-[11px] text-muted-foreground ml-auto">{arg.username}</span>
            )}
          </div>
          <p className="text-sm text-foreground leading-relaxed">{arg.content}</p>
        </motion.div>
      </AnimatePresence>

      {/* All arguments list below */}
      {args.length > 1 && (
        <div className="mt-2 space-y-1.5">
          {args.filter((_, i) => i !== current).slice(0, 3).map(a => (
            <button key={a.id} onClick={() => setCurrent(args.indexOf(a))}
              className="w-full text-left px-3 py-2 rounded-lg border border-border/50 hover:bg-secondary/40 transition-colors flex items-center gap-2">
              {a.stance === "agree"
                ? <CheckCircle2 className="h-3 w-3 text-[#22C55E] shrink-0" />
                : <XCircle     className="h-3 w-3 text-[#EF4444] shrink-0" />}
              <p className="text-xs text-muted-foreground line-clamp-1">{a.content}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}