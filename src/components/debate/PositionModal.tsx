import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";

interface Props {
  opinionId: string;
  opinionStatement: string;
  stance: "agree" | "disagree";
  onClose: () => void;
}

export function PositionModal({ opinionId, opinionStatement, stance, onClose }: Props) {
  const { user, isLoggedIn } = useApp();
  const [argument, setArgument] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [anonymous, setAnonymous] = useState(false);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const color = stance === "agree" ? "#22C55E" : "#DC2626";
  const label = stance === "agree" ? "Agree" : "Disagree";
  const Icon = stance === "agree" ? CheckCircle2 : XCircle;

  const handleSubmit = async () => {
    if (!isLoggedIn) { toast.error("Log in first!"); return; }
    if (!argument.trim()) { toast.error("Add your argument!"); return; }
    setSubmitting(true);
    try {
      const { data: { user: au } } = await supabase.auth.getUser();
      if (!au) throw new Error("Not logged in");

      const alias = anonymous
        ? `Caller ${Math.floor(Math.random() * 900 + 100)}`
        : (user?.username || "Caller");

      const { error } = await supabase.from("positions").upsert({
        opinion_id: opinionId,
        user_id: au.id,
        stance,
        argument: argument.trim(),
        anonymous_alias: alias,
        anonymous: anonymous,
      }, { onConflict: "opinion_id,user_id" });

      if (error) throw error;
      toast.success(`Your ${label} stance posted!`);
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to post");
    } finally { setSubmitting(false); }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          className="w-full max-w-md bg-card border border-border rounded-2xl overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5" style={{ color }} />
              <span className="text-sm font-bold text-foreground">
                I {label} with this
              </span>
            </div>
            <button onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Opinion preview */}
            <div className="px-3 py-2.5 rounded-xl bg-secondary/50 border border-border/60">
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                "{opinionStatement}"
              </p>
            </div>

            {/* Stance badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border"
              style={{ borderColor: color + "40", background: color + "08" }}>
              <div className="h-2 w-2 rounded-full" style={{ background: color }} />
              <span className="text-xs font-bold" style={{ color }}>
                Taking the {label} side
              </span>
            </div>

            {/* Argument input */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                Your Argument
              </label>
              <textarea
                value={argument}
                onChange={e => setArgument(e.target.value)}
                placeholder={`Why do you ${stance} with this? Make your case...`}
                rows={4}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold transition-colors resize-none"
              />
              <p className="text-[10px] text-muted-foreground mt-1 text-right">
                {argument.length}/280
              </p>
            </div>

            {/* Anonymous toggle */}
            <div className="flex items-center justify-between py-2 border-t border-border">
              <div>
                <p className="text-xs font-semibold text-foreground">Post anonymously</p>
                <p className="text-[10px] text-muted-foreground">Your name won't be shown</p>
              </div>
              <button onClick={() => setAnonymous(a => !a)}
                className={`h-6 w-11 rounded-full p-1 transition-colors relative ${anonymous ? "bg-gold" : "bg-secondary border border-border"}`}>
                <motion.div
                  animate={{ x: anonymous ? 20 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="h-4 w-4 bg-white rounded-full shadow-sm"
                />
              </button>
            </div>

            {/* Submit */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={submitting || !argument.trim()}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
              style={{ background: color }}
            >
              {submitting ? "Posting..." : `Post ${label} Stance`}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}