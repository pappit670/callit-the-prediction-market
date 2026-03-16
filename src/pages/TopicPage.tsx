import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import OpinionCard from "@/components/OpinionCard";
import { supabase } from "@/supabaseClient";
import { useApp } from "@/context/AppContext";
import {
    ArrowLeft, Flame, Clock, TrendingUp, BarChart3,
    ChevronDown, ChevronRight, Users, Timer, Coins, Plus
} from "lucide-react";
import { toast } from "sonner";

const filters = [
    { id: "trending", label: "Trending", icon: <Flame className="h-3.5 w-3.5" /> },
    { id: "newest", label: "Newest", icon: <Clock className="h-3.5 w-3.5" /> },
    { id: "volume", label: "Top Volume", icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { id: "closing", label: "Closing Soon", icon: <BarChart3 className="h-3.5 w-3.5" /> },
];

const SPORT_EMOJIS: Record<string, string> = {
    football: "⚽", basketball: "🏀", tennis: "🎾",
    cricket: "🏏", athletics: "🏅", esports: "🎮", baseball: "⚾",
};

const OPTION_COLORS = [
    "#F5C518", "#00C278", "#3B82F6", "#A855F7",
    "#F97316", "#F43F5E", "#06B6D4", "#84CC16",
];

interface SubtopicItem {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
    type: string;
    sport: string | null;
    children?: SubtopicItem[];
    expanded?: boolean;
}

const TopicPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user, isLoggedIn } = useApp();

    const [topic, setTopic] = useState<any>(null);
    const [sidebarItems, setSidebarItems] = useState<SubtopicItem[]>([]);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [activeSubtopic, setActiveSubtopic] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState("trending");
    const [opinions, setOpinions] = useState<any[]>([]);
    const [trendingCount, setTrendingCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [opLoading, setOpLoading] = useState(false);
    const [selectedOpinion, setSelectedOpinion] = useState<any>(null);
    const [stakeAmount, setStakeAmount] = useState(50);
    const [selectedSide, setSelectedSide] = useState<string | null>(null);
    const [staking, setStaking] = useState(false);

    useEffect(() => { if (slug) fetchTopicData(slug); }, [slug]);
    useEffect(() => { if (topic) fetchOpinions(); }, [topic, activeSubtopic, activeFilter]);
    useEffect(() => {
        if (selectedOpinion) {
            const opts = Array.isArray(selectedOpinion.options) ? selectedOpinion.options : ["Yes", "No"];
            setSelectedSide(opts[0]);
        }
    }, [selectedOpinion]);

    const fetchTopicData = async (topicSlug: string) => {
        if (topicSlug === "trending") {
            setTopic({ name: "Trending", slug: "trending", icon: "🔥", color: "#F5C518" });
            setLoading(false);
            return;
        }

        const { data: topicData } = await supabase
            .from("topics").select("*").eq("slug", topicSlug).single();

        if (topicData) {
            setTopic(topicData);

            // Get all subtopics for this category
            const { data: subs } = await supabase
                .from("topics").select("*")
                .eq("subtopic_of", topicData.slug)
                .eq("active", true).order("name");

            if (topicSlug === "sports") {
                // Group by sport
                const { data: leagues } = await supabase
                    .from("topics").select("*")
                    .in("type", ["league", "competition"])
                    .eq("active", true).order("sport").order("name");

                // Build grouped structure
                const grouped: Record<string, SubtopicItem[]> = {};
                (leagues || []).forEach((l: any) => {
                    const sport = l.sport || "other";
                    if (!grouped[sport]) grouped[sport] = [];
                    grouped[sport].push(l);
                });

                const items: SubtopicItem[] = Object.entries(grouped).map(([sport, children]) => ({
                    id: sport,
                    name: sport.charAt(0).toUpperCase() + sport.slice(1),
                    slug: sport,
                    icon: SPORT_EMOJIS[sport] || "🏆",
                    color: null,
                    type: "group",
                    sport,
                    children: children as SubtopicItem[],
                }));
                setSidebarItems(items);
                // Expand first group by default
                if (items.length > 0) setExpandedGroups(new Set([items[0].id]));
            } else {
                setSidebarItems((subs || []).map((s: any) => ({ ...s, children: [] })));
            }
        }
        setLoading(false);
    };

    const fetchOpinions = async () => {
        setOpLoading(true);
        try {
            let query = supabase
                .from("opinions")
                .select("*, topics(name, slug, icon, color), profiles(username, reputation_score)")
                .eq("status", "open");

            if (topic?.slug !== "trending") {
                let topicSlugs = [topic.slug];
                if (activeSubtopic) {
                    topicSlugs = [activeSubtopic];
                }
                const { data: topicIds } = await supabase
                    .from("topics").select("id")
                    .in("slug", topicSlugs);

                // Also get subtopics of selected
                const { data: subIds } = await supabase
                    .from("topics").select("id")
                    .eq("subtopic_of", activeSubtopic || topic.slug);

                const allIds = [
                    ...(topicIds || []).map((t: any) => t.id),
                    ...(subIds || []).map((t: any) => t.id),
                ];

                if (allIds.length > 0) {
                    query = query.in("topic_id", allIds);
                }
            }

            if (activeFilter === "newest") query = query.order("created_at", { ascending: false });
            else if (activeFilter === "volume") query = query.order("call_count", { ascending: false });
            else if (activeFilter === "closing") query = query.order("end_time", { ascending: true });
            else query = query.order("call_count", { ascending: false });

            const { data } = await query.limit(20);
            setOpinions(data || []);
            if (data && data.length > 0) setSelectedOpinion(data[0]);
            setTrendingCount(Math.min(data?.length || 0, 5));
        } catch (e) { console.error(e); }
        finally { setOpLoading(false); }
    };

    const handleQuickStake = async () => {
        if (!isLoggedIn) { toast.error("Log in to make a call!"); navigate("/auth"); return; }
        if (!selectedOpinion || !selectedSide) return;
        if (stakeAmount > (user.balance || 0)) { toast.error("Not enough coins!"); return; }

        setStaking(true);
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) throw new Error("Not logged in");

            const { error } = await supabase.from("calls").upsert({
                opinion_id: selectedOpinion.id,
                user_id: authUser.id,
                chosen_option: selectedSide,
            }, { onConflict: "opinion_id,user_id" });

            if (error) throw error;

            await supabase.from("opinions")
                .update({ call_count: (selectedOpinion.call_count || 0) + 1 })
                .eq("id", selectedOpinion.id);

            toast.success(`Called "${selectedSide}" — ${stakeAmount} coins staked!`);
            fetchOpinions();
        } catch (e: any) {
            toast.error(e.message || "Failed to place call");
        } finally { setStaking(false); }
    };

    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupId)) next.delete(groupId);
            else next.add(groupId);
            return next;
        });
    };

    const mapToCard = (op: any) => ({
        id: op.id,
        question: op.statement,
        yesPercent: 50, noPercent: 50,
        coins: op.call_count || 0,
        timeLeft: op.end_time
            ? new Date(op.end_time) > new Date()
                ? `${Math.ceil((new Date(op.end_time).getTime() - Date.now()) / 86400000)}d left`
                : "Ended"
            : "30d left",
        genre: op.topics?.name || "General",
        topicIcon: op.topics?.icon,
        topicColor: op.topics?.color,
        status: op.status,
        creatorUsername: op.profiles?.username || null,
        creatorReputation: op.profiles?.reputation_score
            ? Math.round(op.profiles.reputation_score) : undefined,
        createdAt: op.created_at,
        followerCount: op.follower_count || 0,
        isRising: (op.rising_score || 0) > 10,
        options: Array.isArray(op.options)
            ? op.options.map((o: string, i: number) => ({
                label: o,
                percent: Math.round(100 / op.options.length),
                color: OPTION_COLORS[(i * 3) % OPTION_COLORS.length],
            }))
            : undefined,
    });

    const selectedOptions = selectedOpinion && Array.isArray(selectedOpinion.options)
        ? selectedOpinion.options
        : ["Yes", "No"];

    const potentialReturn = Math.round(stakeAmount * 1.9);
    const timeLeft = selectedOpinion?.end_time
        ? new Date(selectedOpinion.end_time) > new Date()
            ? `${Math.ceil((new Date(selectedOpinion.end_time).getTime() - Date.now()) / 86400000)}d left`
            : "Ended"
        : "30d left";

    if (loading) return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="mx-auto max-w-7xl px-4 md:px-6 py-8">

                <button onClick={() => navigate("/")}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors mb-6">
                    <ArrowLeft className="h-4 w-4" /> Back to Home
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_300px] gap-6">

                    {/* LEFT — Subtopics only (collapsible for sports) */}
                    <div className="flex flex-col gap-2">
                        {/* Topic header */}
                        <div className="flex items-center gap-2 px-2 mb-2">
                            <div className="h-8 w-8 rounded-lg flex items-center justify-center text-lg"
                                style={{ background: (topic?.color || "#F5C518") + "20" }}>
                                {topic?.icon}
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-foreground">{topic?.name}</h2>
                                <p className="text-[10px] text-muted-foreground">{opinions.length} open calls</p>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-2xl overflow-hidden">
                            {/* All option */}
                            <button
                                onClick={() => setActiveSubtopic(null)}
                                className={`flex items-center gap-2 w-full px-4 py-3 text-sm font-medium border-b border-border transition-colors hover:bg-secondary ${!activeSubtopic ? "bg-gold/10 text-gold font-semibold" : "text-muted-foreground"
                                    }`}
                            >
                                <span>{topic?.icon}</span> All {topic?.name}
                            </button>

                            {/* Sports: grouped by sport with collapse */}
                            {topic?.slug === "sports" ? (
                                sidebarItems.map((group) => (
                                    <div key={group.id}>
                                        <button
                                            onClick={() => toggleGroup(group.id)}
                                            className="flex items-center justify-between w-full px-4 py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wider hover:bg-secondary transition-colors border-b border-border"
                                        >
                                            <span className="flex items-center gap-2">
                                                <span>{group.icon}</span> {group.name}
                                            </span>
                                            {expandedGroups.has(group.id)
                                                ? <ChevronDown className="h-3.5 w-3.5" />
                                                : <ChevronRight className="h-3.5 w-3.5" />}
                                        </button>
                                        <AnimatePresence>
                                            {expandedGroups.has(group.id) && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    {(group.children || []).map((league) => (
                                                        <button
                                                            key={league.slug}
                                                            onClick={() => setActiveSubtopic(league.slug)}
                                                            className={`flex items-center gap-2 w-full pl-8 pr-4 py-2.5 text-sm font-medium border-b border-border/50 last:border-0 transition-colors hover:bg-secondary ${activeSubtopic === league.slug
                                                                ? "bg-gold/10 text-gold font-semibold"
                                                                : "text-muted-foreground"
                                                                }`}
                                                            style={{ borderLeftColor: league.color || "#F5C518", borderLeftWidth: activeSubtopic === league.slug ? 2 : 0 }}
                                                        >
                                                            <span className="text-xs">{league.icon}</span>
                                                            <span className="truncate">{league.name}</span>
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))
                            ) : (
                                /* Other categories: flat subtopic list */
                                sidebarItems.map((sub) => (
                                    <button
                                        key={sub.slug}
                                        onClick={() => setActiveSubtopic(sub.slug)}
                                        className={`flex items-center gap-2.5 w-full px-4 py-3 text-sm font-medium border-b border-border last:border-0 transition-colors hover:bg-secondary ${activeSubtopic === sub.slug
                                            ? "bg-gold/10 text-gold font-semibold"
                                            : "text-muted-foreground"
                                            }`}
                                    >
                                        <span>{sub.icon}</span>
                                        <span className="truncate">{sub.name}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* CENTER — Feed */}
                    <div className="flex flex-col gap-4">

                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="font-headline text-2xl font-bold text-foreground">
                                    {activeSubtopic
                                        ? sidebarItems.flatMap(s => [s, ...(s.children || [])]).find(s => s.slug === activeSubtopic)?.name || activeSubtopic
                                        : topic?.name}
                                </h1>
                                <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-yes inline-block" />
                                        {opinions.length} active
                                    </span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Flame className="h-3 w-3 text-gold" /> {trendingCount} trending
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => navigate("/call-it")}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gold text-primary-foreground text-xs font-bold hover:bg-gold-hover transition-all">
                                <Plus className="h-3.5 w-3.5" /> Create Call
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {filters.map(f => (
                                <button key={f.id} onClick={() => setActiveFilter(f.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${activeFilter === f.id
                                        ? "bg-foreground text-background border-foreground"
                                        : "border-border text-muted-foreground hover:border-gold/50 hover:text-gold"
                                        }`}>
                                    {f.icon} {f.label}
                                </button>
                            ))}
                        </div>

                        {/* Cards */}
                        {opLoading ? (
                            <div className="flex flex-col gap-3">
                                {[...Array(4)].map((_, i) => <div key={i} className="h-40 rounded-2xl bg-secondary animate-pulse" />)}
                            </div>
                        ) : opinions.length > 0 ? (
                            <motion.div className="flex flex-col gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                {opinions.map((op, i) => (
                                    <div key={op.id}
                                        onClick={() => setSelectedOpinion(op)}
                                        className={`cursor-pointer transition-all ${selectedOpinion?.id === op.id ? "ring-2 ring-gold rounded-2xl" : ""}`}>
                                        <OpinionCard data={mapToCard(op)} index={i} />
                                    </div>
                                ))}
                            </motion.div>
                        ) : (
                            <div className="py-20 text-center border border-dashed border-border rounded-2xl">
                                <p className="text-3xl mb-3">{topic?.icon}</p>
                                <p className="text-muted-foreground">No opinions yet in {topic?.name}.</p>
                                <button onClick={() => navigate("/call-it")} className="mt-4 text-gold font-bold hover:underline">
                                    Be the first to call it →
                                </button>
                            </div>
                        )}
                    </div>

                    {/* RIGHT — Quick Stake Panel */}
                    <div className="hidden lg:block">
                        <div className="sticky top-24">
                            {selectedOpinion ? (
                                <div className="bg-card border border-gold/30 rounded-2xl overflow-hidden">

                                    {/* Opinion header */}
                                    <div className="p-5 border-b border-border">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-6 w-6 rounded-full bg-gold/10 flex items-center justify-center text-xs border border-gold/30">
                                                {selectedOpinion.topics?.icon || "📰"}
                                            </div>
                                            <span className="text-xs font-semibold text-gold uppercase tracking-wider">
                                                {selectedOpinion.topics?.name || "General"}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-3">
                                            {selectedOpinion.statement}
                                        </h3>
                                        {selectedOpinion.profiles?.username && (
                                            <p className="text-[11px] text-muted-foreground mt-1">
                                                by <span className="text-gold">@{selectedOpinion.profiles.username}</span>
                                            </p>
                                        )}
                                    </div>

                                    {/* Quick stake */}
                                    <div className="p-5 space-y-4">

                                        {/* Pick side */}
                                        <div>
                                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                                Pick your side
                                            </p>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                {selectedOptions.map((opt: string, i: number) => {
                                                    const color = OPTION_COLORS[(i * 3) % OPTION_COLORS.length];
                                                    return (
                                                        <button key={opt} onClick={() => setSelectedSide(opt)}
                                                            className={`py-2.5 px-3 rounded-xl border-2 text-sm font-bold transition-all ${selectedSide === opt
                                                                ? "text-foreground"
                                                                : "border-border/50 bg-secondary/50 text-muted-foreground"
                                                                }`}
                                                            style={selectedSide === opt ? {
                                                                borderColor: color,
                                                                background: color + "15",
                                                                color,
                                                                boxShadow: `0 0 14px ${color}30`,
                                                            } : {}}
                                                        >
                                                            {opt}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Stake amount */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    Stake Amount
                                                </p>
                                                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                    <Coins className="h-3 w-3 text-gold" />
                                                    {user.balance?.toLocaleString() || 0} available
                                                </span>
                                            </div>
                                            <div className="bg-secondary rounded-xl px-4 py-3 flex items-center gap-2 border border-border focus-within:border-gold transition-colors">
                                                <Coins className="h-4 w-4 text-gold flex-shrink-0" />
                                                <input
                                                    type="number"
                                                    value={stakeAmount}
                                                    onChange={(e) => setStakeAmount(Math.max(1, parseInt(e.target.value) || 0))}
                                                    className="flex-1 bg-transparent text-foreground text-lg font-bold focus:outline-none"
                                                    min={1}
                                                    max={user.balance || 1000}
                                                />
                                            </div>
                                            {/* Quick amounts */}
                                            <div className="flex gap-1.5 mt-2">
                                                {[10, 50, 100, 500].map(amt => (
                                                    <button key={amt} onClick={() => setStakeAmount(amt)}
                                                        className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition-colors border ${stakeAmount === amt
                                                            ? "bg-gold text-primary-foreground border-gold"
                                                            : "border-border text-muted-foreground hover:border-gold/50 hover:text-gold"
                                                            }`}>
                                                        {amt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-secondary/50 rounded-xl p-3 text-center">
                                                <p className="text-[10px] text-muted-foreground mb-0.5">Potential Return</p>
                                                <p className="text-sm font-bold text-yes">+{potentialReturn}</p>
                                                <p className="text-[10px] text-muted-foreground">coins</p>
                                            </div>
                                            <div className="bg-secondary/50 rounded-xl p-3 text-center">
                                                <p className="text-[10px] text-muted-foreground mb-0.5 flex items-center justify-center gap-1">
                                                    <Timer className="h-2.5 w-2.5" /> Time left
                                                </p>
                                                <p className="text-sm font-bold text-foreground">{timeLeft}</p>
                                            </div>
                                        </div>

                                        <div className="bg-secondary/50 rounded-xl p-3 flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Users className="h-3 w-3" /> Callers
                                            </span>
                                            <span className="text-xs font-bold text-foreground">
                                                {selectedOpinion.call_count || 0}
                                            </span>
                                        </div>

                                        {/* CTA */}
                                        <button onClick={handleQuickStake} disabled={staking || !selectedSide}
                                            className="w-full py-3.5 rounded-xl bg-gold text-primary-foreground text-sm font-bold hover:bg-gold-hover transition-all animate-gold-pulse disabled:opacity-50">
                                            {staking ? "Placing call..." : `Call It — ${stakeAmount} coins`}
                                        </button>

                                        <button onClick={() => navigate(`/opinion/${selectedOpinion.id}`)}
                                            className="w-full py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:border-gold hover:text-gold transition-colors">
                                            View Full Opinion →
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-card border border-border rounded-2xl p-6 text-center">
                                    <p className="text-muted-foreground text-sm">Select an opinion to place your call</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default TopicPage;