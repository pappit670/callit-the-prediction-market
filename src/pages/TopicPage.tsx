import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import OpinionCard from "@/components/OpinionCard";
import { supabase } from "@/supabaseClient";
import { ArrowLeft, Flame, Clock, TrendingUp, BarChart3 } from "lucide-react";

const filters = [
    { id: "trending", label: "Trending", icon: <Flame className="h-3.5 w-3.5" /> },
    { id: "newest", label: "Newest", icon: <Clock className="h-3.5 w-3.5" /> },
    { id: "volume", label: "Top Volume", icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { id: "closing", label: "Closing Soon", icon: <BarChart3 className="h-3.5 w-3.5" /> },
];

const sportEmojis: Record<string, string> = {
    football: "⚽", basketball: "🏀", tennis: "🎾",
    cricket: "🏏", athletics: "🏅", esports: "🎮",
};

interface League {
    id: string;
    name: string;
    slug: string;
    sport: string | null;
    country: string | null;
    color: string | null;
    icon: string | null;
}

const TopicPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [topic, setTopic] = useState<any>(null);
    const [subtopics, setSubtopics] = useState<any[]>([]);
    const [leagues, setLeagues] = useState<League[]>([]);
    const [activeSubtopic, setActiveSubtopic] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState("trending");
    const [opinions, setOpinions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [opLoading, setOpLoading] = useState(false);

    useEffect(() => {
        if (slug) fetchTopicData(slug);
    }, [slug]);

    useEffect(() => {
        if (topic) fetchOpinions();
    }, [topic, activeSubtopic, activeFilter]);

    const fetchTopicData = async (topicSlug: string) => {
        const isTrending = topicSlug === "trending";

        if (isTrending) {
            setTopic({ name: "Trending", slug: "trending", icon: "🔥", description: "Hottest opinions right now", color: "#F5C518" });
            setLoading(false);
            return;
        }

        const { data: topicData } = await supabase
            .from("topics").select("*").eq("slug", topicSlug).single();

        if (topicData) {
            setTopic(topicData);

            const { data: subs } = await supabase
                .from("topics").select("*")
                .eq("subtopic_of", topicData.slug)
                .eq("active", true).order("name");
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
        } catch (e) {
            console.error(e);
        } finally {
            setOpLoading(false);
        }
    };

    const mapToCard = (op: any) => ({
        id: op.id,
        question: op.statement,
        yesPercent: 50, noPercent: 50,
        coins: (op.call_count || 0) * 100,
        timeLeft: op.end_time
            ? new Date(op.end_time) > new Date()
                ? `${Math.ceil((new Date(op.end_time).getTime() - Date.now()) / 86400000)} days left`
                : "Ended"
            : "30 days",
        genre: op.topics?.name || "General",
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

    if (!topic) return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <p className="text-muted-foreground">Topic not found</p>
                <button onClick={() => navigate("/topics")} className="text-gold font-semibold">Back to topics</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="mx-auto max-w-7xl px-4 md:px-6 py-8">

                <button
                    onClick={() => navigate("/topics")}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors mb-6"
                >
                    <ArrowLeft className="h-4 w-4" /> All topics
                </button>

                <div className="mb-8 flex items-center gap-4">
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border border-border"
                        style={{ background: (topic.color || "#F5C518") + "20" }}
                    >
                        {topic.icon}
                    </div>
                    <div>
                        <h1 className="font-headline text-4xl font-bold text-foreground">{topic.name}</h1>
                        <p className="text-muted-foreground text-sm mt-0.5">{topic.description}</p>
                    </div>
                </div>

                {/* SPORTS — leagues grouped by sport */}
                {topic.slug === "sports" && leagues.length > 0 && (
                    <div className="mb-10">
                        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                            Leagues & Competitions
                        </h2>
                        <div className="flex flex-col gap-6">
                            {(Object.entries(groupedLeagues) as [string, League[]][]).map(([sport, sportLeagues]) => (
                                <div key={sport}>
                                    <h3 className="text-sm font-bold text-foreground capitalize flex items-center gap-2 mb-3">
                                        <span>{sportEmojis[sport] || "🏆"}</span> {sport}
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {sportLeagues.map((league) => (
                                            <button
                                                key={league.id}
                                                onClick={() => navigate(`/topic/${league.slug}`)}
                                                className="flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm font-semibold text-muted-foreground hover:border-gold hover:text-gold transition-all"
                                                style={{ borderLeftColor: league.color || "#F5C518", borderLeftWidth: 3 }}
                                            >
                                                {league.name}
                                                {league.country && <span className="text-[10px] opacity-60">{league.country}</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SUBTOPICS */}
                {topic.slug !== "sports" && subtopics.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Subtopics</h2>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setActiveSubtopic(null)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${activeSubtopic === null
                                        ? "bg-gold text-primary-foreground border-gold"
                                        : "border-border text-muted-foreground hover:border-gold/50 hover:text-foreground"
                                    }`}
                            >
                                All {topic.name}
                            </button>
                            {subtopics.map(sub => (
                                <button
                                    key={sub.id}
                                    onClick={() => setActiveSubtopic(sub.slug)}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${activeSubtopic === sub.slug
                                            ? "bg-gold text-primary-foreground border-gold"
                                            : "border-border text-muted-foreground hover:border-gold/50 hover:text-foreground"
                                        }`}
                                >
                                    <span style={{ fontSize: 13 }}>{sub.icon}</span> {sub.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar">
                    {filters.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setActiveFilter(f.id)}
                            className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border transition-all ${activeFilter === f.id
                                    ? "bg-foreground text-background border-foreground"
                                    : "border-border text-muted-foreground hover:border-gold/50 hover:text-gold"
                                }`}
                        >
                            {f.icon} {f.label}
                        </button>
                    ))}
                </div>

                {/* Cards Grid */}
                {opLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-64 rounded-2xl bg-secondary animate-pulse" />
                        ))}
                    </div>
                ) : opinions.length > 0 ? (
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    >
                        {opinions.map((op, i) => (
                            <OpinionCard key={op.id} data={mapToCard(op)} index={i} />
                        ))}
                    </motion.div>
                ) : (
                    <div className="py-20 text-center border border-dashed border-border rounded-2xl">
                        <p className="text-3xl mb-3">{topic.icon}</p>
                        <p className="text-muted-foreground">No opinions yet in {topic.name}.</p>
                        <button onClick={() => navigate("/call-it")} className="mt-4 text-gold font-bold hover:underline">
                            Be the first to call it →
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default TopicPage;