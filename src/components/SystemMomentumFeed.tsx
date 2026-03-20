import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Users, Zap, Flame, ArrowLeftRight } from "lucide-react";

type SystemMessageKind = "join" | "stake" | "argument" | "debate";

type SystemMessage = {
  id: string;
  kind: SystemMessageKind;
  text: string;
};

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatCoins(n: number) {
  if (n >= 1000) return `${Math.round(n / 10) / 100}K`;
  return `${n}`;
}

export default function SystemMomentumFeed({
  label = "System feed",
  intervalMs = 2200,
  fadeOutMs = 5200,
  maxItems = 6,
}: {
  label?: string;
  intervalMs?: number;
  fadeOutMs?: number;
  maxItems?: number;
}) {
  const [items, setItems] = useState<SystemMessage[]>([]);
  const timeRef = useRef<number>(Date.now());

  const iconForKind = useMemo(() => {
    const common = "h-3.5 w-3.5 flex-shrink-0 text-muted-foreground";
    return {
      join: <Users className={common} />,
      stake: <Zap className={common} />,
      argument: <MessageCircle className={common} />,
      debate: <Flame className={common} />,
    };
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => {
      const now = Date.now();
      const msSince = now - timeRef.current;
      timeRef.current = now;

      // System momentum: generate plausible deltas without claiming real users.
      const kind = pick<SystemMessageKind>(["join", "stake", "argument", "debate"]);
      const joinCount = Math.max(1, Math.round(2 + Math.random() * 12));
      const coinsDeltaBase = Math.max(30, Math.round(100 + Math.random() * 520));
      const coinsDelta = Math.round(coinsDeltaBase * Math.max(0.35, Math.min(1.25, msSince / intervalMs)));

      let messageText = "";
      if (kind === "join") {
        messageText = `${joinCount} users just joined`;
      } else if (kind === "stake") {
        messageText = `+${formatCoins(coinsDelta)} coins in last 2 min`;
      } else if (kind === "argument") {
        messageText = pick([
          "New argument dropped in the debate",
          "Hot take posted — stakes moving",
          "Fresh counterpoint is trending",
        ]);
      } else {
        messageText = pick([
          "Debate heating up",
          "Consensus shifting in real time",
          "Momentum building across options",
        ]);
      }

      const msg: SystemMessage = {
        id: `${now}-${Math.random().toString(16).slice(2)}`,
        kind,
        text: messageText,
      };

      setItems((prev) => {
        const next = [msg, ...prev].slice(0, maxItems);
        return next;
      });

      window.setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== msg.id));
      }, fadeOutMs);
    }, intervalMs);

    return () => window.clearInterval(t);
  }, [fadeOutMs, intervalMs, maxItems]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-secondary/40 border border-border/50">
          <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        <AnimatePresence initial={false}>
          {items.map((it) => (
            <motion.div
              key={it.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex items-start gap-3 mb-2"
            >
              {iconForKind[it.kind]}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground leading-snug line-clamp-2">
                  <span className="text-foreground/70">{label}:</span> {it.text}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

