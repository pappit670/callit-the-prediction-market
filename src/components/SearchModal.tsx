import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, SlidersHorizontal, TrendingUp, Clock, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";

interface SearchResult {
    id: string;
    statement: string;
    call_count: number;
    topics: { name: string; icon: string; slug: string } | null;
}

const TRENDING_SEARCHES = [
    "Bitcoin price", "Arsenal title", "Ruto confidence", "GPT-5",
    "Kenya fuel", "Champions League", "NBA playoffs", "Gaza ceasefire",
];

const SORT_OPTIONS = ["Most Popular", "Newest", "Ending Soon", "Rising"];
const TOPIC_FILTERS = [
    { label: "All", slug: null },
    { label: "Crypto", slug: "crypto-bitcoin" },
    { label: "Sports", slug: "sports" },
    { label: "Politics", slug: "politics" },
    { label: "Tech", slug: "tech" },
    { label: "Business", slug: "business" },
    { label: "World", slug: "world" },
    { label: "Entertainment", slug: "entertainment" },
];

interface Props { onClose: () => void; }

export function SearchModal({ onClose }: Props) {
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [activeSort, setActiveSort] = useState("Most Popular");
    const [activeTopic, setActiveTopic] = useState<string | null>(null);
    const [recentSearches, setRecent] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem("callit-recent-searches") || "[]"); }
        catch { return []; }
    });

    useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    useEffect(() => {
        if (!query.trim()) { setResults([]); return; }
        const t = setTimeout(doSearch, 280);
        return () => clearTimeout(t);
    }, [query, activeSort, activeTopic]);

    const doSearch = async () => {
        setLoading(true);
        try {
            let q = supabase
                .from("opinions")
                .select("id, statement, call_count, topics!opinions_topic_id_fkey(name, icon, slug)")
                .eq("status", "open")
                .ilike("statement", `%${query.trim()}%`)
                .limit(15);

            if (activeTopic) {
                const { data: topicRow } = await supabase
                    .from("topics").select("id").eq("slug", activeTopic).maybeSingle();
                if (topicRow?.id) q = q.eq("topic_id", topicRow.id);
            }

            if (activeSort === "Newest") q = q.order("created_at", { ascending: false });
            else if (activeSort === "Ending Soon") q = q.order("end_time", { ascending: true });
            else if (activeSort === "Rising") q = q.order("rising_score", { ascending: false });
            else q = q.order("call_count", { ascending: false });

            const { data } = await q;
            setResults((data as any) || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSelect = (result: SearchResult) => {
        const updated = [result.statement, ...recentSearches.filter(r => r !== result.statement)].slice(0, 5);
        setRecent(updated);
        try { localStorage.setItem("callit-recent-searches", JSON.stringify(updated)); } catch { }
        navigate(`/opinion/${result.id}`);
        onClose();
    };

    const clearRecent = () => {
        setRecent([]);
        try { localStorage.removeItem("callit-recent-searches"); } catch { }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.18 }}
                className="fixed top-0 left-0 right-0 z-[91] bg-background border-b border-border shadow-2xl"
                style={{ maxHeight: "88vh" }}
                onClick={e => e.stopPropagation()}
            >
                {/* Input row */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
                    <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === "Escape" && onClose()}
                        placeholder="Search calls, topics, events..."
                        className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFilters(f => !f)}
                            className={`p-2 rounded-lg transition-colors ${showFilters
                                    ? "bg-foreground/10 text-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                                }`}>
                            <SlidersHorizontal className="h-4 w-4" />
                        </button>
                        {query && (
                            <button onClick={() => setQuery("")}
                                className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                        <button onClick={onClose}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors ml-1 font-medium">
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Filter panel */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
                            className="overflow-hidden border-b border-border"
                        >
                            <div className="px-4 py-3 space-y-3">
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Sort by</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {SORT_OPTIONS.map(s => (
                                            <button key={s} onClick={() => setActiveSort(s)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${activeSort === s
                                                        ? "bg-foreground text-background border-foreground"
                                                        : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                                                    }`}>
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Category</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {TOPIC_FILTERS.map(t => (
                                            <button key={t.slug ?? "all"} onClick={() => setActiveTopic(t.slug)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${activeTopic === t.slug
                                                        ? "bg-foreground text-background border-foreground"
                                                        : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                                                    }`}>
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Results area */}
                <div className="overflow-y-auto" style={{ maxHeight: "calc(88vh - 72px)" }}>

                    {/* Empty — trending + recent */}
                    {!query && (
                        <div className="px-4 py-4 space-y-5">
                            {recentSearches.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5" /> Recent
                                        </p>
                                        <button onClick={clearRecent}
                                            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                                            Clear
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {recentSearches.map(r => (
                                            <button key={r} onClick={() => setQuery(r)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border text-xs text-foreground hover:border-foreground/40 transition-colors">
                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                    <TrendingUp className="h-3.5 w-3.5" /> Trending
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {TRENDING_SEARCHES.map(t => (
                                        <button key={t} onClick={() => setQuery(t)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border text-xs text-foreground hover:border-foreground/40 transition-colors">
                                            <Flame className="h-3 w-3 text-orange-500" />
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading */}
                    {query && loading && (
                        <div className="px-4 py-8 text-center">
                            <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto" />
                        </div>
                    )}

                    {/* Results */}
                    {query && !loading && results.length > 0 && (
                        <div className="divide-y divide-border/40">
                            {results.map((r, i) => (
                                <motion.button
                                    key={r.id}
                                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.025 }}
                                    onClick={() => handleSelect(r)}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/40 transition-colors text-left"
                                >
                                    <div className="h-9 w-9 rounded-xl bg-secondary border border-border flex items-center justify-center text-base shrink-0">
                                        {(r.topics as any)?.icon || "📊"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground line-clamp-1">{r.statement}</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            {(r.topics as any)?.name} · {r.call_count || 0} callers
                                        </p>
                                    </div>
                                    <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                </motion.button>
                            ))}
                        </div>
                    )}

                    {/* No results */}
                    {query && !loading && results.length === 0 && (
                        <div className="px-4 py-12 text-center">
                            <p className="text-sm font-semibold text-foreground mb-1">No results for "{query}"</p>
                            <p className="text-xs text-muted-foreground">Try different keywords or browse topics</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}