// Maps topic slugs and keywords to relevant Unsplash images
// Used when opinion.image_url is null

const TOPIC_IMAGES: Record<string, string> = {
    // Crypto
    "crypto-bitcoin": "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&q=80",
    "crypto-ethereum": "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=400&q=80",
    "crypto-altcoins": "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&q=80",
    "crypto-defi": "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&q=80",
    "crypto-solana": "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&q=80",
    // Sports
    "epl": "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&q=80",
    "ucl": "https://images.unsplash.com/photo-1535207010348-71e47296838a?w=400&q=80",
    "la-liga": "https://images.unsplash.com/photo-1540747913346-19212a4cf528?w=400&q=80",
    "bundesliga": "https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?w=400&q=80",
    "serie-a": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&q=80",
    "nba": "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&q=80",
    "nfl": "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400&q=80",
    "kpl": "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&q=80",
    "afcon": "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&q=80",
    "world-cup": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&q=80",
    // Politics
    "politics": "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&q=80",
    "ruto-presidency": "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&q=80",
    "kenya-parliament": "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&q=80",
    "politics-usa": "https://images.unsplash.com/photo-1541872705-1f73c6400ec9?w=400&q=80",
    // Tech
    "tech-ai": "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&q=80",
    "tech-social": "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&q=80",
    "tech-startups": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&q=80",
    "tech-space": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=80",
    // Business
    "business-kenya": "https://images.unsplash.com/photo-1615092296061-e2ccfeb2f3d6?w=400&q=80",
    "business-stocks": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80",
    "kenya-fuel": "https://images.unsplash.com/photo-1615092296061-e2ccfeb2f3d6?w=400&q=80",
    // World
    "world-conflict": "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=80",
    "world-climate": "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=80",
    "world-africa": "https://images.unsplash.com/photo-1627584804366-5d32ef6c0f17?w=400&q=80",
    // Entertainment
    "entertainment-music": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80",
    "entertainment-film": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80",
};

// Keyword fallbacks — checked against statement text
const KEYWORD_IMAGES: [string[], string][] = [
    [["bitcoin", "btc"], "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&q=80"],
    [["ethereum", "eth"], "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=400&q=80"],
    [["crypto", "blockchain"], "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&q=80"],
    [["arsenal", "chelsea", "liverpool", "manchester", "premier league"], "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&q=80"],
    [["champions league", "ucl"], "https://images.unsplash.com/photo-1535207010348-71e47296838a?w=400&q=80"],
    [["messi", "ronaldo", "football", "soccer"], "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&q=80"],
    [["nba", "basketball", "lakers", "warriors"], "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&q=80"],
    [["ruto", "kenya", "nairobi"], "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&q=80"],
    [["fuel", "shilling", "kra"], "https://images.unsplash.com/photo-1615092296061-e2ccfeb2f3d6?w=400&q=80"],
    [["openai", "gpt", "chatgpt", "ai", "llm"], "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&q=80"],
    [["twitter", "x.com", "elon", "musk"], "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&q=80"],
    [["election", "vote", "parliament", "politics"], "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&q=80"],
    [["gaza", "war", "conflict", "ceasefire"], "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=80"],
    [["grammy", "music", "artist", "song"], "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80"],
    [["nigeria", "africa", "south africa"], "https://images.unsplash.com/photo-1627584804366-5d32ef6c0f17?w=400&q=80"],
    [["stock", "market", "shares", "invest"], "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80"],
    [["space", "nasa", "rocket", "mars"], "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=80"],
];

export function resolveQuestionImage(
    imageUrl: string | null | undefined,
    topicSlug: string | null | undefined,
    statement: string,
): string | null {
    // 1. Use stored image first
    if (imageUrl) return imageUrl;

    // 2. Topic slug match
    if (topicSlug && TOPIC_IMAGES[topicSlug]) return TOPIC_IMAGES[topicSlug];

    // 3. Keyword match against statement
    const lower = statement.toLowerCase();
    for (const [keywords, url] of KEYWORD_IMAGES) {
        if (keywords.some(k => lower.includes(k))) return url;
    }

    return null;
}

export function resolveTopicLogo(
    logoUrl: string | null | undefined,
    topicSlug: string | null | undefined,
): string | null {
    if (logoUrl) return logoUrl;
    if (topicSlug && TOPIC_IMAGES[topicSlug]) return TOPIC_IMAGES[topicSlug];
    return null;
}