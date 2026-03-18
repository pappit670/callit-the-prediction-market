import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Swords, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { supabase } from "@/supabaseClient";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type Stance = "agree" | "disagree" | "challenge";

interface DebateModalProps {
  isOpen: boolean;
  onClose: () => void;
  opinion: {
    id: string | number;
    question: string;
    genre?: string;
    topicIcon?: string;
  };
  initialStance?: Stance;
}

const STANCE_CONFIG: Record<Stance, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  agree: {
    label: "Agree",
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "#22C55E",
    bg: "#22C55E15",
  },
  disagree: {
    label: "Disagree",
    icon: <XCircle className="h-4 w-4" />,
    color: "#EF4444",
    bg: "#EF444415",
  },
  challenge: {
    label: "Challenge",
    icon: <Swords className="h-4 w-4" />,
    color: "#F5C518",
    bg: "#F5C51815",
  },
};

const QUICK_REPLIES = [
  "Evidence says otherwise",
  "Strong counter-point",
  "Agree, but consider...",
  "Missing key context",
  "This changes everything",
];

const DebateModal = ({ isOpen, onClose, opinion, initialStance = "challenge" }: DebateModalProps) => {
  const { isLoggedIn, user } = useApp();
  const navigate = useNavigate();
  const [stance, setStance] = useState<Stance>(initialStance);
  const [argument, setArgument] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existingArgs, setExistingArgs] = useState<any[]>([]);

  // Reset stance when modal opens with new initialStance
  useEffect(() => {
    setStance(initialStance);
    setArgument("");
  }, [initialStance, isOpen]);

  // Fetch existing arguments/comments when modal opens
  useEffect(() => {
    if (!isOpen || !opinion.id) return;
    supabase
      .from("comments")
      .select("*, profiles(username)")
      .eq("opinion_id", opinion.id)
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }) => { if (data) setExistingArgs(data); });
  }, [isOpen, opinion.id]);

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      toast.error("Log in to join the debate!");
      navigate("/auth");
      return;
    }
    if (!argument.trim()) {
      toast.error("Write your argument first");
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Not logged in");

      const { data } = await supabase.from("comments").insert({
        opinion_id: opinion.id,
        user_id: authUser.id,
        content: `[${stance.toUpperCase()}] ${argument.trim()}`,
      }).select("*, profiles(username)").single();

      if (data) {
        setExistingArgs(prev => [data, ...prev]);
        setArgument("");
        toast.success(`${STANCE_CONFIG[stance].label} posted!`);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to post");
    } finally {
      setSubmitting(false);
    }
  };

  const stanceConfig = STANCE_CONFIG[stance];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-background/75 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-x-4 bottom-4 md:inset-auto md:left-1/2 md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 z-[90] w-full md:max-w-[560px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-border">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  {opinion.topicIcon && (
                    <span className="text-base">{opinion.topicIcon}</span>
                  )}
                  <span className="text-xs font-bold text-gold uppercase tracking-wider">
                    {opinion.genre || "Debate"}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                  {opinion.question}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Stance selector */}
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Your stance
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(["agree", "disagree", "challenge"] as Stance[]).map((s) => {
                    const cfg = STANCE_CONFIG[s];
                    const isActive = stance === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setStance(s)}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 text-xs font-bold transition-all duration-150"
                        style={isActive
                          ? { borderColor: cfg.color, background: cfg.bg, color: cfg.color }
                          : { borderColor: "hsl(var(--border))", background: "transparent", color: "hsl(var(--muted-foreground))" }
                        }
                      >
                        {cfg.icon}
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Argument input */}
              <div>
                <textarea
                  value={argument}
                  onChange={(e) => setArgument(e.target.value)}
                  placeholder={`Drop your ${stance === "agree" ? "support" : stance === "disagree" ? "counter" : "challenge"}...`}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none transition-colors"
                  style={{ borderColor: argument.length > 0 ? stanceConfig.color + "60" : undefined }}
                />
                {/* Quick replies */}
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {QUICK_REPLIES.map((qr) => (
                    <button
                      key={qr}
                      onClick={() => setArgument(prev => prev ? prev + " " + qr : qr)}
                      className="text-[11px] px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:border-gold/50 hover:text-gold transition-colors"
                    >
                      {qr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting || !argument.trim()}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: stanceConfig.color, color: "#0E1116" }}
              >
                <Send className="h-4 w-4" />
                {submitting ? "Posting..." : `Post ${STANCE_CONFIG[stance].label}`}
              </button>

              {/* Opposing arguments */}
              {existingArgs.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
                    Arguments ({existingArgs.length})
                    <button
                      onClick={() => { onClose(); navigate(`/opinion/${opinion.id}#debate`); }}
                      className="flex items-center gap-0.5 text-gold hover:underline normal-case font-medium"
                    >
                      See all <ChevronRight className="h-3 w-3" />
                    </button>
                  </p>
                  <div className="space-y-2 max-h-44 overflow-y-auto no-scrollbar">
                    {existingArgs.map((arg, i) => {
                      const rawContent: string = arg.content || "";
                      const stanceMatch = rawContent.match(/^\[(AGREE|DISAGREE|CHALLENGE)\]/);
                      const detectedStance = stanceMatch ? stanceMatch[1].toLowerCase() as Stance : null;
                      const displayContent = stanceMatch ? rawContent.replace(stanceMatch[0], "").trim() : rawContent;
                      const cfg = detectedStance ? STANCE_CONFIG[detectedStance] : null;

                      return (
                        <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50">
                          {cfg && (
                            <span className="mt-0.5 shrink-0" style={{ color: cfg.color }}>
                              {cfg.icon}
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-muted-foreground mb-0.5">
                              @{arg.profiles?.username || "anon"}
                              {cfg && <span className="ml-1 font-bold" style={{ color: cfg.color }}>{cfg.label}</span>}
                            </p>
                            <p className="text-xs text-foreground leading-relaxed line-clamp-2">{displayContent}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DebateModal;
