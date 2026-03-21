import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { Zap, TrendingUp, Flame } from "lucide-react";

interface SidebarOpinion {
    id: string;
    statement: string;
    call_count: number;
    rising_score: number;
    created_at: string;
    topics: { name: string; icon: string } | null;
}

export function RightSidebar() {
    const navigate = useNavigate();
    const [breaking, setBreaking] = useState<SidebarOpinion[]>([]);
    const [rising, setRising] = useState<SidebarOpinion[]>([]);
    const [hot, setHot] = useState<SidebarOpinion[]>([]);

    useEffect(() => {
        // Breaking — newest
        supabase.from("opinions")
            .select("id, statement, call_count, rising_score, created_at, topics!opinions_topic_id_fkey(name, icon)")
            .eq("status", "open")
            .order("created_at", { ascending: false })
            .limit(5)
            .then(({ data }) => setBreaking((data as any) || []));

        // Rising — highest rising_score
        supabase.from("opinions")
            .select("id, statement, call_count, rising_score, created_at, topics!opinions_topic_id_fkey(name, icon)")
            .eq("status", "open")
            .order("rising_score", { ascending: false })
            .limit(5)
            .then(({ data }) => setRising((data as any) || []));

        // Hot — most called
        supabase.from("opinions")
            .select("id, statement, call_count, rising_score, created_at, topics!opinions_topic_id_fkey(name, icon)")
            .eq("status", "open")
            .order("call_count", { ascending: false })
            .limit(5)
            .then(({ data }) => setHot((data as any) || []));
    }, []);

    const Section = ({
        title, icon, items, accent,
    }: {
        title: string;
        icon: React.ReactNode;
        items: SidebarOpinion[];
        accent: string;
    }) => (
        <div>
            <div className="flex items-center gap-2 mb-2">
                <span style={{ color: accent }}>{icon}</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {title}
                </span>
            </div>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                {items.length === 0 ? (
                    <div className="p-3 text-xs text-muted-foreground text-center">Loading...</div>
                ) : items.map((item, i) => (
                    <motion.button
                        key={item.id}
                        initial={{ opacity: 0, x: 6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => navigate(`/opinion/${item.id}`)}
                        className="w-full flex items-start gap-3 px-3 py-3 border-b border-border/50 last:border-0 hover:bg-secondary/40 transition-colors text-left group"
                    >
                        <span className="text-xs font-mono text-muted-foreground mt-0.5 w-4 shrink-0">
                            {i + 1}.
                        </span>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground group-hover:text-gold transition-colors line-clamp-2 leading-snug">
                                {item.statement}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-muted-foreground">
                                    {(item.topics as any)?.icon} {(item.topics as any)?.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    · {item.call_count} callers
                                </span>
                            </div>
                        </div>
                    </motion.button>
                ))}
            </div>
        </div>
    );

    return (
        <aside className="hidden lg:flex flex-col gap-5 w-[280px] shrink-0">
            <Section
                title="Breaking"
                icon={<Zap className="h-3.5 w-3.5" />}
                items={breaking}
                accent="#F5C518"
            />
            <Section
                title="Rising"
                icon={<TrendingUp className="h-3.5 w-3.5" />}
                items={rising}
                accent="#F97316"
            />
            <Section
                title="Hot Right Now"
                icon={<Flame className="h-3.5 w-3.5" />}
                items={hot}
                accent="#EF4444"
            />
        </aside>
    );
}