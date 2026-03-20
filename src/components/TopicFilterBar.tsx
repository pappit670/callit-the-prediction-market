import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Curated flat list — most relevant, no images, plain text pills
const TOPIC_PILLS = [
    { label: "All", slug: null },
    { label: "Kenya", slug: "politics-kenya" },
    { label: "KPL", slug: "kpl" },
    { label: "Bitcoin", slug: "crypto-bitcoin" },
    { label: "Ethereum", slug: "crypto-ethereum" },
    { label: "AI", slug: "tech-ai" },
    { label: "EPL", slug: "epl" },
    { label: "UCL", slug: "ucl" },
    { label: "NBA", slug: "nba" },
    { label: "Elections", slug: "politics-elections" },
    { label: "Economy", slug: "business-kenya" },
    { label: "Stocks", slug: "business-stocks" },
    { label: "Conflict", slug: "world-conflict" },
    { label: "Ruto", slug: "ruto-presidency" },
    { label: "La Liga", slug: "la-liga" },
    { label: "Bundesliga", slug: "bundesliga" },
    { label: "Serie A", slug: "serie-a" },
    { label: "NFL", slug: "nfl" },
    { label: "Solana", slug: "crypto-solana" },
    { label: "Altcoins", slug: "crypto-altcoins" },
    { label: "Music", slug: "entertainment-music" },
    { label: "Film & TV", slug: "entertainment-film" },
    { label: "Climate", slug: "world-climate" },
    { label: "Startups", slug: "tech-startups" },
    { label: "Social Media", slug: "tech-social" },
    { label: "Tesla", slug: "tech-tesla" },
    { label: "Space", slug: "tech-space" },
    { label: "DeFi", slug: "crypto-defi" },
    { label: "Africa", slug: "world-africa" },
    { label: "USA", slug: "politics-usa" },
    { label: "Middle East", slug: "politics-middle-east" },
    { label: "AFCON", slug: "afcon" },
    { label: "World Cup", slug: "world-cup" },
    { label: "Wimbledon", slug: "wimbledon" },
    { label: "Fuel Prices", slug: "kenya-fuel" },
    { label: "Parliament", slug: "kenya-parliament" },
];

interface TopicFilterBarProps {
    activeTopic: string | null;
    onChange: (slug: string | null) => void;
}

export function TopicFilterBar({ activeTopic, onChange }: TopicFilterBarProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 10);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
    };

    useEffect(() => {
        checkScroll();
        const el = scrollRef.current;
        el?.addEventListener("scroll", checkScroll);
        return () => el?.removeEventListener("scroll", checkScroll);
    }, []);

    const scroll = (dir: "left" | "right") => {
        scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
    };

    return (
        <div className="relative flex items-center bg-background border-b border-border">
            {/* Left fade + arrow */}
            <AnimatePresence>
                {canScrollLeft && (
                    <motion.button
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => scroll("left")}
                        className="absolute left-0 z-10 h-full px-2 bg-gradient-to-r from-background via-background/90 to-transparent flex items-center"
                    >
                        <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Scrollable pills */}
            <div
                ref={scrollRef}
                className="flex items-center gap-1.5 overflow-x-auto scrollbar-none px-4 py-2.5"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                {TOPIC_PILLS.map((pill) => {
                    const isActive = activeTopic === pill.slug;
                    return (
                        <button
                            key={pill.slug ?? "all"}
                            onClick={() => onChange(pill.slug)}
                            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${isActive
                                    ? "bg-foreground text-background"
                                    : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                                }`}
                        >
                            {pill.label}
                        </button>
                    );
                })}
            </div>

            {/* Right fade + arrow */}
            <AnimatePresence>
                {canScrollRight && (
                    <motion.button
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => scroll("right")}
                        className="absolute right-0 z-10 h-full px-2 bg-gradient-to-l from-background via-background/90 to-transparent flex items-center"
                    >
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
} import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Curated flat list — most relevant, no images, plain text pills
const TOPIC_PILLS = [
    { label: "All", slug: null },
    { label: "Kenya", slug: "politics-kenya" },
    { label: "KPL", slug: "kpl" },
    { label: "Bitcoin", slug: "crypto-bitcoin" },
    { label: "Ethereum", slug: "crypto-ethereum" },
    { label: "AI", slug: "tech-ai" },
    { label: "EPL", slug: "epl" },
    { label: "UCL", slug: "ucl" },
    { label: "NBA", slug: "nba" },
    { label: "Elections", slug: "politics-elections" },
    { label: "Economy", slug: "business-kenya" },
    { label: "Stocks", slug: "business-stocks" },
    { label: "Conflict", slug: "world-conflict" },
    { label: "Ruto", slug: "ruto-presidency" },
    { label: "La Liga", slug: "la-liga" },
    { label: "Bundesliga", slug: "bundesliga" },
    { label: "Serie A", slug: "serie-a" },
    { label: "NFL", slug: "nfl" },
    { label: "Solana", slug: "crypto-solana" },
    { label: "Altcoins", slug: "crypto-altcoins" },
    { label: "Music", slug: "entertainment-music" },
    { label: "Film & TV", slug: "entertainment-film" },
    { label: "Climate", slug: "world-climate" },
    { label: "Startups", slug: "tech-startups" },
    { label: "Social Media", slug: "tech-social" },
    { label: "Tesla", slug: "tech-tesla" },
    { label: "Space", slug: "tech-space" },
    { label: "DeFi", slug: "crypto-defi" },
    { label: "Africa", slug: "world-africa" },
    { label: "USA", slug: "politics-usa" },
    { label: "Middle East", slug: "politics-middle-east" },
    { label: "AFCON", slug: "afcon" },
    { label: "World Cup", slug: "world-cup" },
    { label: "Wimbledon", slug: "wimbledon" },
    { label: "Fuel Prices", slug: "kenya-fuel" },
    { label: "Parliament", slug: "kenya-parliament" },
];

interface TopicFilterBarProps {
    activeTopic: string | null;
    onChange: (slug: string | null) => void;
}

export function TopicFilterBar({ activeTopic, onChange }: TopicFilterBarProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 10);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
    };

    useEffect(() => {
        checkScroll();
        const el = scrollRef.current;
        el?.addEventListener("scroll", checkScroll);
        return () => el?.removeEventListener("scroll", checkScroll);
    }, []);

    const scroll = (dir: "left" | "right") => {
        scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
    };

    return (
        <div className="relative flex items-center bg-background border-b border-border">
            {/* Left fade + arrow */}
            <AnimatePresence>
                {canScrollLeft && (
                    <motion.button
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => scroll("left")}
                        className="absolute left-0 z-10 h-full px-2 bg-gradient-to-r from-background via-background/90 to-transparent flex items-center"
                    >
                        <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Scrollable pills */}
            <div
                ref={scrollRef}
                className="flex items-center gap-1.5 overflow-x-auto scrollbar-none px-4 py-2.5"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                {TOPIC_PILLS.map((pill) => {
                    const isActive = activeTopic === pill.slug;
                    return (
                        <button
                            key={pill.slug ?? "all"}
                            onClick={() => onChange(pill.slug)}
                            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${isActive
                                    ? "bg-foreground text-background"
                                    : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                                }`}
                        >
                            {pill.label}
                        </button>
                    );
                })}
            </div>

            {/* Right fade + arrow */}
            <AnimatePresence>
                {canScrollRight && (
                    <motion.button
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => scroll("right")}
                        className="absolute right-0 z-10 h-full px-2 bg-gradient-to-l from-background via-background/90 to-transparent flex items-center"
                    >
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}