// Maps keywords to small icon URLs (20-28px, shown left of topic label)
// Priority: stored icon_url > keyword match > topic slug > null

const KEYWORD_ICONS: [string[], string][] = [
    // Crypto
    [["bitcoin", "btc"],
        "https://cryptologos.cc/logos/bitcoin-btc-logo.png"],
    [["ethereum", "eth"],
        "https://cryptologos.cc/logos/ethereum-eth-logo.png"],
    [["solana", "sol"],
        "https://cryptologos.cc/logos/solana-sol-logo.png"],
    [["bnb", "binance"],
        "https://cryptologos.cc/logos/bnb-bnb-logo.png"],
    [["xrp", "ripple"],
        "https://cryptologos.cc/logos/xrp-xrp-logo.png"],

    // Football clubs
    [["arsenal"],
        "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg"],
    [["chelsea"],
        "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg"],
    [["liverpool"],
        "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg"],
    [["manchester city", "man city"],
        "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg"],
    [["manchester united", "man utd", "man united"],
        "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg"],
    [["tottenham", "spurs"],
        "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg"],
    [["real madrid"],
        "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg"],
    [["barcelona", "barca"],
        "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg"],
    [["atletico madrid"],
        "https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg"],
    [["bayern munich", "bayern"],
        "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282002%E2%80%932017%29.svg"],
    [["dortmund", "bvb"],
        "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg"],
    [["juventus", "juve"],
        "https://upload.wikimedia.org/wikipedia/commons/1/15/Juventus_FC_2017_icon_%28black%29.svg"],
    [["ac milan", "milan"],
        "https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg"],
    [["inter milan", "inter"],
        "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg"],

    // Leagues / competitions
    [["champions league", "ucl"],
        "https://upload.wikimedia.org/wikipedia/en/b/bf/UEFA_Champions_League_logo_2.svg"],
    [["premier league", "epl"],
        "https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg"],
    [["la liga"],
        "https://upload.wikimedia.org/wikipedia/commons/1/13/Laliga_logo.svg"],
    [["bundesliga"],
        "https://upload.wikimedia.org/wikipedia/en/d/df/Bundesliga_logo_%282017%29.svg"],
    [["serie a"],
        "https://upload.wikimedia.org/wikipedia/en/e/e1/Serie_A_logo_%282019%29.svg"],
    [["world cup", "fifa"],
        "https://upload.wikimedia.org/wikipedia/en/e/e3/2022_FIFA_World_Cup.svg"],
    [["nba", "basketball"],
        "https://upload.wikimedia.org/wikipedia/en/0/0c/NBA_Logo.svg"],
    [["warriors", "golden state"],
        "https://upload.wikimedia.org/wikipedia/en/0/01/Golden_State_Warriors_logo.svg"],
    [["lakers"],
        "https://upload.wikimedia.org/wikipedia/commons/3/3c/Los_Angeles_Lakers_logo.svg"],
    [["celtics"],
        "https://upload.wikimedia.org/wikipedia/en/8/8b/Boston_Celtics.svg"],
    [["nfl", "super bowl"],
        "https://upload.wikimedia.org/wikipedia/en/a/a2/National_Football_League_logo.svg"],

    // Tech
    [["openai", "gpt", "chatgpt"],
        "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg"],
    [["twitter", "x.com"],
        "https://upload.wikimedia.org/wikipedia/commons/5/5a/X_icon_2.svg"],
    [["google", "alphabet"],
        "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg"],
    [["apple", "iphone"],
        "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"],
    [["tesla"],
        "https://upload.wikimedia.org/wikipedia/commons/b/bd/Tesla_Motors.svg"],
    [["meta", "facebook", "instagram"],
        "https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg"],

    // People / politics
    [["ruto", "kenya", "nairobi", "parliament", "kra", "fuel", "shilling"],
        "https://flagcdn.com/w40/ke.png"],
    [["trump", "usa", "america", "white house"],
        "https://flagcdn.com/w40/us.png"],
    [["ukraine"],
        "https://flagcdn.com/w40/ua.png"],
    [["russia"],
        "https://flagcdn.com/w40/ru.png"],
    [["china"],
        "https://flagcdn.com/w40/cn.png"],
    [["india"],
        "https://flagcdn.com/w40/in.png"],
    [["nigeria"],
        "https://flagcdn.com/w40/ng.png"],
    [["south africa"],
        "https://flagcdn.com/w40/za.png"],
    [["egypt"],
        "https://flagcdn.com/w40/eg.png"],
    [["ghana"],
        "https://flagcdn.com/w40/gh.png"],
    [["gaza", "palestine", "ceasefire"],
        "https://flagcdn.com/w40/ps.png"],
    [["israel"],
        "https://flagcdn.com/w40/il.png"],
    [["iran"],
        "https://flagcdn.com/w40/ir.png"],

    // Entertainment
    [["grammy", "grammy award"],
        "https://upload.wikimedia.org/wikipedia/commons/5/5c/Grammy_logo.svg"],
    [["oscar", "academy award"],
        "https://upload.wikimedia.org/wikipedia/commons/6/6e/Oscar_Award.png"],

    // Messi / Ronaldo
    [["messi"],
        "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg"],
    [["ronaldo"],
        "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg"],
];

export function resolveQuestionIcon(
    iconUrl: string | null | undefined,
    statement: string,
): string | null {
    if (iconUrl) return iconUrl;
    const lower = statement.toLowerCase();
    for (const [keywords, url] of KEYWORD_ICONS) {
        if (keywords.some(k => lower.includes(k))) return url;
    }
    return null;
}