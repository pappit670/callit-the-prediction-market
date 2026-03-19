import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, ThumbsUp, Send, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/supabaseClient";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

interface DebateBattleProps {
    opinionId: string;
    options: string[];
    optionColors?: string[];
}

export function DebateBattle({ opinionId, options, optionColors = ["#F5C518", "#00C278"] }: DebateBattleProps) {
    const { isLoggedIn } = useApp();
    const [arguments_, setArguments] = useState<any[]>([]);
    const [activeSide, setActiveSide] = useState<string>(options[0] || "yes");
    const [input, setInput] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [upvoted, setUpvoted] = useState<Set<string>>(new Set());
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => { fetchArguments(); }, [opinionId]);

    const fetchArguments = async () => {
        const { data } = await supabase
            .from("arguments")
            .select("*, profiles(username, reputation)")

            .eq("opinion_id", opinionId)
            .order("upvotes", { ascending: false })
            .limit(20);
        setArguments(data || []);
    };

    const submitArgument = async () => {
        if (!isLoggedIn) { toast.error("Log in to argue your case!"); return; }
        if (!input.trim()) return;
        setSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not logged in");
            const { data } = await supabase.from("arguments").insert({
                opinion_id: opinionId,
                user_id: user.id,
                side: activeSide.toLowerCase(),
                content: input.trim(),
            }).select("*, profiles(username, reputation_score)").single();
            if (data) {
                setArguments(prev => [data, ...prev]);
                setInput("");
                toast.success("Argument posted!");
            }
        } catch (e: any) { toast.error(e.message); }
        finally { setSubmitting(false); }
    };

    const upvoteArgument = async (argId: string) => {
        if (!isLoggedIn) { toast.error("Log in to upvote!"); return; }
        if (upvoted.has(argId)) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await supabase.from("argument_upvotes").insert({ argument_id: argId, user_id: user.id });
            await supabase.from("arguments").update({ upvotes: arguments_.find(a => a.id === argId)?.upvotes + 1 || 1 }).eq("id", argId);
            setUpvoted(prev => new Set([...prev, argId]));
            setArguments(prev => prev.map(a => a.id === argId ? { ...a, upvotes: (a.upvotes || 0) + 1 } : a));
        } catch (e) { console.error(e); }
    };

    const sideArgs = (side: string) => arguments_.filter(a => a.side === side.toLowerCase());

    return (
        <div className="border border-border rounded-2xl overflow-hidden" id="debate">
            {/* Header */}
            <button
                className="w-full flex items-center justify-between px-5 py-4 bg-card hover:bg-secondary/30 transition-colors"
                onClick={() => setCollapsed(!collapsed)}
            >
                <div className="flex items-center gap-2">
                    <Swords className="h-5 w-5 text-gold" />
                    <h3 className="font-headline text-lg font-bold text-foreground">Debate Battle</h3>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                        {arguments_.length} arguments
                    </span>
                </div>
                {collapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
            </button>

            <AnimatePresence>
                {!collapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Side selector */}
                        <div className="flex border-b border-border">
                            {options.map((opt, i) => (
                                <button
                                    key={opt}
                                    onClick={() => setActiveSide(opt)}
                                    className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 ${activeSide === opt
                                        ? "border-b-2"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                        }`}
                                    style={activeSide === opt ? {
                                        borderBottomColor: optionColors[i % optionColors.length],
                                        color: optionColors[i % optionColors.length],
                                    } : {}}
                                >
                                    {opt} side
                                    <span className="ml-2 text-[10px] opacity-70">
                                        ({sideArgs(opt).length} args)
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="p-4">
                            {/* Post argument */}
                            <div className="flex gap-2 mb-5">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && submitArgument()}
                                    placeholder={`Argue for ${activeSide}...`}
                                    disabled={!isLoggedIn}
                                    className="flex-1 rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold transition-colors disabled:opacity-50"
                                />
                                <button
                                    onClick={submitArgument}
                                    disabled={submitting || !isLoggedIn}
                                    className="h-10 w-10 rounded-xl bg-gold flex items-center justify-center hover:bg-gold-hover transition-colors disabled:opacity-50 flex-shrink-0"
                                >
                                    <Send className="h-4 w-4 text-primary-foreground" />
                                </button>
                            </div>

                            {/* Two column debate layout */}
                            <div className="grid grid-cols-2 gap-3">
                                {options.map((opt, sideIdx) => {
                                    const color = optionColors[sideIdx % optionColors.length];
                                    const args = sideArgs(opt);
                                    return (
                                        <div key={opt}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="h-2 w-2 rounded-full" style={{ background: color }} />
                                                <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
                                                    {opt} ({args.length})
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                {args.length === 0 ? (
                                                    <p className="text-xs text-muted-foreground italic text-center py-4 border border-dashed border-border rounded-xl">
                                                        No arguments yet. Be first!
                                                    </p>
                                                ) : args.slice(0, 3).map((arg) => (
                                                    <div key={arg.id}
                                                        className="bg-secondary rounded-xl p-3 border-l-2"
                                                        style={{ borderLeftColor: color }}
                                                    >
                                                        <div className="flex items-center gap-1.5 mb-1.5">
                                                            <span className="text-[11px] font-semibold text-foreground">
                                                                @{arg.profiles?.username || "anon"}
                                                            </span>
                                                            {arg.profiles?.reputation && (
                                                                <span className="text-[9px] text-muted-foreground">
                                                                    {Math.round(arg.profiles.reputation)}% acc
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-foreground leading-relaxed mb-2 line-clamp-3">
                                                            {arg.content}
                                                        </p>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); upvoteArgument(arg.id); }}
                                                            className={`flex items-center gap-1 text-[10px] font-semibold transition-colors ${upvoted.has(arg.id) ? "text-gold" : "text-muted-foreground hover:text-gold"
                                                                }`}
                                                        >
                                                            <ThumbsUp className="h-3 w-3" /> {arg.upvotes || 0}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}