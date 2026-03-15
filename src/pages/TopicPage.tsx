import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import OpinionCard from "@/components/OpinionCard";
import { supabase } from "@/supabaseClient";
import { ArrowLeft, Flame, Clock, TrendingUp, BarChart3, Users } from "lucide-react";

const filters = [
    { id: "trending", label: "Trending", icon: <Flame className="h-3.5 w-3.5" /> },
    { id: "newest", label: "Newest", icon: <Clock className="h-3.5 w-3.5" /> },
    { id: "volume", label: "Top Volume", icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { id: "closing", label: "Closing Soon", icon: <BarChart3 className="h-3.5 w-3.5" /> },
];

interface League {
    id: string;
    name: string;
    slug: string;
    sport: string | null;
    country: string | null;
    color: string | null;
    icon: string | null;
}

const sportEmojis: Record<string, string> = {
    football: "⚽", basketball: "🏀", tennis: "🎾",
    cricket: "🏏", athletics: "🏅", esports: "🎮",
};

const TopicPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [topic, setTopic] = useState<any>(null);
    const [subtopics, setSubtopics] = useState<any[]>([]);
    const [leagues, setLeagues] = useState<League[]>([]);
    const [allCategories, setAllCategories] = useState<any[]>([]);
    const [activeSubtopic, setActiveSubtopic] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState("trending");
    const [opinions, setOpinions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [opLoading, setOpLoading] = useState(false);
    const [selectedOpinion, setSelectedOpinion] = useState<any>(null);

    useEffect(() => {
        if (slug) fetchTopicData(slug);
    }, [slug]);

    useEffect(() => {
        if (topic) fetchOpinions();
    }, [topic, activeSubtopic, activeFilter]);

    const fetchTopicData = async (topicSlug: string) => {
        // Load all categories for left column
        const { data: cats } = await supabase
            .from("topics").select("name, slug, icon")
            .eq("type", "category").eq("active", true).order("name");
        setAllCategories(cats || []);

        if (topicSlug === "trending") {
            setTopic({ name: "Trending", slug: "trending", icon: "🔥", color: "#F5C518" });
            setLoading(false);
            return;
        }

        const { data: topicData } = await supabase
            .from("topics").select("*").eq("slug", topicSlug).single();

        if (topicData) {
            setTopic(topicData);
            const { data: subs } = await supabase
                .from("topics").select("*")
                .eq("subtopic_of", topicData.slug).eq("active", true).order("name");
            setSubtopics(subs || []);

            if (topicSlug === "sports") {
                const { data: leagueData } = await supabase
                    .from("topics").select("*")
                    .in("type", ["league", "competition"])
                    .eq("active", true).order("sport").order("name");
                setLeagues((leagueData as League[]) || []);
            }
        }
        setLoading(false);
    };

    const fetchOpinions = async () => {
        setOpLoading(true);
        try {
            let query = supabase
                .from("opinions")
                .select("*, topics(name, slug, icon, color)")
                .eq("status", "open");

            if (topic?.slug !== "trending" && topic?.slug !== "sports") {
                const { data: topicIds } = await supabase
                    .from("topics").select("id")
                    .or(`slug.eq.${topic.slug},subtopic_of.eq.${topic.slug}`);
                if (topicIds?.length) {
                    query = query.in("topic_id", topicIds.map((t: any) => t.id));
                }
            }

            if (activeSubtopic) {
                const { data: subTopic } = await supabase
                    .from("topics").select("id").eq("slug", activeSubtopic).single();
                if (subTopic) query = query.eq("topic_id", subTopic.id);
            }

            if (activeFilter === "newest") query = query.order("created_at", { ascending: false });
            else if (activeFilter === "volume") query = query.order("call_count", { ascending: false });
            else if (activeFilter === "closing") query = query.order("end_time", { ascending: true });
            else query = query.order("call_count", { ascending: false });

            const { data } = await query.limit(12);
            setOpinions(data || []);
            if (data && data.length > 0) setSelectedOpinion(data[0]);
        } catch (e) { console.error(e); }
        finally { setOpLoading(false); }
    };

    const mapToCard = (op: any) => ({
        id: op.id,
        question: op.statement,
        yesPercent: 50, noPercent: 50,
        coins: (op.call_count || 0) * 100,
        timeLeft: op.end_time
            ? new Date(op.end_time) > new Date()
                ? `${Math.ceil((new Date(op.end_time).getTime() - Date.now()) / 86400000)}d left`
                : "Ended"
            : "30 days",
        genre: op.topics?.name || "General",
        topicIcon: op.topics?.icon || "📰",
        topicColor: op.topics?.color,
        status: op.status,
        options: Array.isArray(op.options)
            ? op.options.map((o: string) => ({ label: o, percent: Math.round(100 / op.options.length) }))
            : undefined,
    });

    const groupedLeagues = leagues.reduce<Record<string, League[]>>((acc, league) => {
        const sport = league.sport || "other";
        if (!acc[sport]) acc[sport] = [];
        acc[sport].push(league);
        return acc;
    }, {});

    if (loading) return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
        </div>
    );

    const selectedOptions = selectedOpinion && Array.isArray(selectedOpinion.options)
        ? selectedOpinion.options.map((o: string) => ({ label: o, percent: Math.round(100 / selectedOpinion.options.length) }))
        : [{ label: "Yes", percent: 50 }, { label: "No", percent: 50 }];

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="mx-auto max-w-7xl px-4 md:px-6 py-8">

                <button onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors mb-6">
                    <ArrowLeft className="h-4 w-4" /> Back
                </button>

                {/* THREE COLUMN LAYOUT */}
                <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_300px] gap-6">

                    {/* LEFT — All categories + subtopics */}
                    <div className="flex flex-col gap-2">
                        <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase px-2 mb-1">Categories</h2>
                        <div className="bg-card border border-border rounded-2xl overflow-hidden">
                            <button
                                onClick={() => navigate("/topic/trending")}
                                className={`flex items-center gap-2.5 w-full px-4 py-3 text-sm font-medium hover:bg-secondary transition-colors border-b border-border ${slug === "trending" ? "bg-gold/10 text-gold font-semibold" : "text-muted-foreground"
                                    }`}
                            >
                                🔥 Trending
                            </button>
                            {allCategories.map((cat) => (
                                <button key={cat.slug}
                                    onClick={() => navigate(`/topic/${cat.slug}`)}
                                    className={`flex items-center gap-2.5 w-full px-4 py-3 text-sm font-medium hover:bg-secondary transition-colors border-b border-border last:border-0 ${slug === cat.slug ? "bg-gold/10 text-gold font-semibold" : "text-muted-foreground"
                                        }`}
                                >
                                    {cat.icon} {cat.name}
                                </button>
                            ))}
                        </div>

                        {/* Subtopics */}
                        {subtopics.length > 0 && (
                            <div className="mt-4">
                                <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase px-2 mb-2">Subtopics</h2>
                                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                                    <button
                                        onClick={() => setActiveSubtopic(null)}
                                        className={`flex items-center gap-2 w-full px-4 py-3 text-sm font-medium hover:bg-secondary transition-colors border-b border-border ${!activeSubtopic ? "bg-gold/10 text-gold font-semibold" : "text-muted-foreground"
                                            }`}
                                    >
                                        All {topic?.name}
                                    </button>
                                    {subtopics.map(sub => (
                                        <button key={sub.id}
                                            onClick={() => setActiveSubtopic(sub.slug)}
                                            className={`flex items-center gap-2 w-full px-4 py-3 text-sm font-medium hover:bg-secondary transition-colors border-b border-border last:border-0 ${activeSubtopic === sub.slug ? "bg-gold/10 text-gold font-semibold" : "text-muted-foreground"
                                                }`}
                                        >
                                            {sub.icon} {sub.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sports leagues */}
                        {topic?.slug === "sports" && Object.keys(groupedLeagues).length > 0 && (
                            <div className="mt-4">
                                <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase px-2 mb-2">Leagues</h2>
                                {(Object.entries(groupedLeagues) as [string, League[]][]).map(([sport, sportLeagues]) => (
                                    <div key={sport} className="mb-3">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase px-2 mb-1 flex items-center gap-1">
                                            {sportEmojis[sport] || "🏆"} {sport}
                                        </p>
                                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                                            {sportLeagues.map((league) => (
                                                <button key={league.id}
                                                    onClick={() => navigate(`/topic/${league.slug}`)}
                                                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-gold transition-colors border-b border-border last:border-0"
                                                    style={{ borderLeftColor: league.color || "#F5C518", borderLeftWidth: 2 }}
                                                >
                                                    {league.name}
                                                    {league.country && <span className="text-[10px] opacity-50 ml-auto">{league.country}</span>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* CENTER — Opinions feed */}
                    <div className="flex flex-col gap-4">
                        {/* Topic header */}
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-2xl border border-border"
                                style={{ background: (topic?.color || "#F5C518") + "20" }}>
                                {topic?.icon}
                            </div>
                            <div>
                                <h1 className="font-headline text-2xl font-bold text-foreground">{topic?.name}</h1>
                                <p className="text-xs text-muted-foreground">{opinions.length} open calls</p>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {filters.map(f => (
                                <button key={f.id} onClick={() => setActiveFilter(f.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${activeFilter === f.id
                                            ? "bg-foreground text-background border-foreground"
                                            : "border-border text-muted-foreground hover:border-gold/50 hover:text-gold"
                                        }`}
                                >
                                    {f.icon} {f.label}
                                </button>
                            ))}
                        </div>

                        {/* Cards */}
                        {opLoading ? (
                            <div className="flex flex-col gap-3">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="h-32 rounded-2xl bg-secondary animate-pulse" />
                                ))}
                            </div>
                        ) : opinions.length > 0 ? (
                            <motion.div className="flex flex-col gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                {opinions.map((op, i) => (
                                    <div key={op.id}
                                        onClick={() => { setSelectedOpinion(op); }}
                                        className={`cursor-pointer transition-all ${selectedOpinion?.id === op.id ? "ring-2 ring-gold rounded-2xl" : ""}`}
                                    >
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

                    {/* RIGHT — Selected opinion call panel */}
                    <div className="hidden lg:block">
                        <div className="sticky top-24 flex flex-col gap-4">
                            {selectedOpinion ? (
                                <div className="bg-card border border-gold/30 rounded-2xl p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="h-7 w-7 rounded-full bg-gold/10 flex items-center justify-center text-sm border border-gold/30">
                                            {selectedOpinion.topics?.icon || "📰"}
                                        </div>
                                        <span className="text-xs font-semibold text-gold uppercase">
                                            {selectedOpinion.topics?.name || "General"}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-foreground text-sm leading-snug mb-4 line-clamp-3">
                                        {selectedOpinion.statement}
                                    </h3>

                                    <div className="flex flex-col gap-2 mb-4">
                                        {selectedOptions.map((opt: any, i: number) => {
                                            const colors = [
                                                "border-gold/40 bg-gold/10 text-gold hover:bg-gold/20 hover:shadow-[0_0_14px_rgba(245,197,24,0.3)]",
                                                "border-green-500/40 bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:shadow-[0_0_14px_rgba(34,197,94,0.3)]",
                                                "border-blue-500/40 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 hover:shadow-[0_0_14px_rgba(59,130,246,0.3)]",
                                                "border-purple-500/40 bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 hover:shadow-[0_0_14px_rgba(168,85,247,0.3)]",
                                            ];
                                            return (
                                                <button key={i}
                                                    onClick={() => navigate(`/opinion/${selectedOpinion.id}`)}
                                                    className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${colors[i % colors.length]}`}
                                                >
                                                    <span>{opt.label}</span>
                                                    <span>{opt.percent}%</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => navigate(`/opinion/${selectedOpinion.id}`)}
                                        className="w-full py-3 rounded-xl bg-gold text-primary-foreground text-sm font-bold hover:bg-gold-hover transition-all animate-gold-pulse"
                                    >
                                        Make Your Call
                                    </button>

                                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Users className="h-3 w-3" /> {selectedOpinion.call_count || 0} callers
                                        </span>
                                        <span>
                                            {selectedOpinion.end_time
                                                ? new Date(selectedOpinion.end_time) > new Date()
                                                    ? `${Math.ceil((new Date(selectedOpinion.end_time).getTime() - Date.now()) / 86400000)}d left`
                                                    : "Ended"
                                                : "30 days left"}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-card border border-border rounded-2xl p-5 text-center">
                                    <p className="text-muted-foreground text-sm">Select an opinion to make your call</p>
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