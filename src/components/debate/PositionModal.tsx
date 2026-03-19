import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, XCircle, Send } from "lucide-react";
import { supabase } from "@/supabaseClient";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface PositionModalProps {
  opinionId: string;
  opinionStatement: string;
  stance: "agree" | "disagree";
  onClose: () => void;
  onSuccess?: (position: any) => void;
}

export function PositionModal({ opinionId, opinionStatement, stance, onClose, onSuccess }: PositionModalProps) {
  const { isLoggedIn } = useApp();
  const navigate = useNavigate();
  const [argument, setArgument] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isAgree = stance === "agree";
  const color   = isAgree ? "#00C278" : "#EF4444";
  const Icon    = isAgree ? CheckCircle2 : XCircle;

  const handleSubmit = async () => {
    if (!isLoggedIn) { toast.error("Log in first!"); navigate("/auth"); return; }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      const alias = `Caller ${Math.floor(Math.random() * 9000) + 1000}`;
      const { data, error } = await supabase.from("positions").upsert({
        opinion_id: opinionId, user_id: user.id,
        stance, argument: argument.trim() || null,
        anonymous_alias: alias,
      }, { onConflict: "opinion_id,user_id" }).select().single();
      if (error) throw error;
      toast.success(`${isAgree ? "Agreed" : "Disagreed"}!`);
      onSuccess?.(data);
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally { setSubmitting(false); }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-md bg-card border border-border rounded-2xl overflow-hidden shadow-2xl"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5" style={{ color }} />
              <span className="font-bold text-foreground text-sm">{isAgree ? "Agree with this call" : "Disagree with this call"}</span>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="bg-secondary/60 rounded-xl p-3 border-l-2" style={{ borderLeftColor: color }}>
              <p className="text-sm text-foreground leading-snug line-clamp-2">{opinionStatement}</p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Your argument <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <textarea
                value={argument}
                onChange={e => setArgument(e.target.value)}
                placeholder={isAgree ? "Why do you agree? Make your case..." : "Why do you disagree? Be specific."}
                maxLength={280} rows={3}
                className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold transition-colors resize-none"
              />
              <p className="text-[11px] text-muted-foreground text-right mt-1">{argument.length}/280</p>
            </div>

            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={submitting}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                style={{ background: color }}
              >
                {submitting ? "Submitting..." : <><Send className="h-4 w-4" />{isAgree ? "Agree" : "Disagree"}</>}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
