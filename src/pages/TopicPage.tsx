import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import OpinionCard from "@/components/OpinionCard";
import { supabase } from "@/supabaseClient";
import { ArrowLeft, Flame, Clock, TrendingUp, BarChart3 } from "lucide-react";
import { sampleCards } from "@/data/sampleCards";
import { systemGeneratedCards } from "@/data/systemGeneratedCards";

const filters = [
    { id: "trending", label: "Trending", icon: <Flame className="h-3.5 w-3.5" /> },
    { id: "newest", label: "Newest", icon: <Clock className="h-3.5 w-3.5" /> },
    { id: "volume", label: "Top Volume", icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { id: "closing", label: "Closing Soon", icon: <BarChart3 className="h-3.5 w-3.5" /> },
];

const TopicPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [topic, setTopic] = useState<any>(null);
    const [subtopics, setSubtopics] = useState<any[]>([]);
    const [activeSubtopic, setActiveSubtopic] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState("trending");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (slug) fetchTopicData(slug);
    }, [slug]);

    const fetchTopicData = async (topicSlug: string) => {
        const { data: topicData } = await supabase
            .from("topics")
            .select("*")
            .eq("slug", topicSlug)
            .single();

        if (topicData) {
            setTopic(topicData);
            const { data: subs } = await supabase
                .from("topics")
                .select("*")
                .eq("subtopic_of", topicData.slug)
                .eq("active", true)
                .order("name");
            setSubtopics(subs || []);
        }
        setLoading(false);
    };

    const allCards = [...sampleCards, ...systemGeneratedCards];
    const filteredCards = allCards.filter(card =>
        topic ? card.genre.toLowerCase().includes(topic.slug.split("-")[0].toLowerCase()) : true
    );

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
                <button onClick={() => navigate("/topics")} className="text-gold font-semibold">
                    Back to topics
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="mx-auto max-w-7xl px-4 md:px-6 py-8">

                {/* Back button */}
                <button
                    onClick={() => navigate("/topics")}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors mb-6"
                >
                    <ArrowLeft className="h-4 w-4" /> All topics
                </button>

                {/* Topic Hero */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-3">
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border border-border"
                            style={{ background: topic.color + '20' }}
                        >
                            {topic.icon}
                        </div>
                        <div>
                            <h1 className="font-headline text-4xl font-bold text-foreground">{topic.name}</h1>
                            <p className="text-muted-foreground text-sm mt-0.5">{topic.description}</p>
                        </div>
                    </div>
                </div>

                {/* Subtopics Pills */}
                {subtopics.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                            Subtopics
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setActiveSubtopic(null)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${activeSubtopic === null
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
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${activeSubtopic === sub.slug
                                            ? "bg-gold text-primary-foreground border-gold"
                                            : "border-border text-muted-foreground hover:border-gold/50 hover:text-foreground"
                                        }`}
                                >
                                    <span style={{ fontSize: 14 }}>{sub.icon}</span>
                                    {sub.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filter Row */}
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
                {filteredCards.length > 0 ? (
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {filteredCards.map((card, i) => (
                            <OpinionCard key={card.id} data={card} index={i} />
                        ))}
                    </motion.div>
                ) : (
                    <div className="py-20 text-center border border-dashed border-border rounded-2xl">
                        <p className="text-3xl mb-3">{topic.icon}</p>
                        <p className="text-muted-foreground">No opinions yet in {topic.name}.</p>
                        <button
                            onClick={() => navigate("/call-it")}
                            className="mt-4 text-gold font-bold hover:underline"
                        >
                            Be the first to call it →
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default TopicPage;