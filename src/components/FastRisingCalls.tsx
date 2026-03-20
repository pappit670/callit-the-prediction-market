import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Users, Eye } from "lucide-react";
import { supabase } from "@/supabaseClient";
import { motion } from "framer-motion";

export function FastRisingCalls() {
    const [rising, setRising] = useState<any[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        supabase
            .from("opinions")
            .select("id, statement, call_count, follower_count, rising_score, topics!opinions_topic_id_fkey(name, icon, color), created_at")
            .eq("status", "open")
            .order("rising_score", { ascending: false })
            .limit(5)
            .then(({ data }) => { if (data) setRising(data); });
    }, []);

    if (rising.length === 0) return null;

    return (
        <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Fast Rising Calls 🔥</h2>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
                {rising.map((op, i) => {
                    const timeDiff = Date.now() - new Date(op.created_at).getTime();
                    const hoursOld = Math.floor(timeDiff / 3600000);
                    const callsPerHour = hoursOld > 0 ? Math.round((op.call_count || 0) / hoursOld) : op.call_count || 0;

                    return (
                        <motion.button
                            key={op.id}
                            onClick={() => navigate(`/opinion/${op.id}`)}
                            className="w-full flex items-start gap-4 px-4 py-3.5 hover:bg-secondary/50 transition-colors text-left group"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                        >
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/10 text-orange-500 font-bold text-xs flex-shrink-0 mt-0.5">
                                {i + 1}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground group-hover:text-gold transition-colors line-clamp-1">
                                    {op.statement}
                                </p>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                    <span className="text-[10px] text-muted-foreground">
                                        {op.topics?.icon} {op.topics?.name}
                                    </span>
                                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <Users className="h-2.5 w-2.5" /> {op.call_count || 0} callers
                                    </span>
                                    {op.follower_count > 0 && (
                                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <Eye className="h-2.5 w-2.5" /> {op.follower_count} watching
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex-shrink-0 text-right">
                                <div className="flex items-center gap-1 text-orange-500 font-bold text-xs">
                                    <TrendingUp className="h-3 w-3" />
                                    +{callsPerHour}/hr
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-0.5">rising</p>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </section>
    );
}