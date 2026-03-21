import { useState } from "react";

// Map of common team names to their logo URLs via Wikipedia
const TEAM_LOGOS: Record<string, string> = {
    // EPL
    "arsenal": "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg",
    "chelsea": "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg",
    "liverpool": "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg",
    "manchester city": "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg",
    "manchester united": "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg",
    "tottenham": "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg",
    "newcastle": "https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg",
    "aston villa": "https://upload.wikimedia.org/wikipedia/en/9/9f/Aston_Villa_FC_crest_%282016%29.svg",
    // La Liga
    "real madrid": "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg",
    "barcelona": "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
    "atletico madrid": "https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg",
    // Bundesliga
    "bayern munich": "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282002%E2%80%932017%29.svg",
    "borussia dortmund": "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg",
    // Serie A
    "juventus": "https://upload.wikimedia.org/wikipedia/commons/1/15/Juventus_FC_2017_icon_%28black%29.svg",
    "ac milan": "https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg",
    "inter milan": "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg",
    // NBA
    "lakers": "https://upload.wikimedia.org/wikipedia/commons/3/3c/Los_Angeles_Lakers_logo.svg",
    "warriors": "https://upload.wikimedia.org/wikipedia/en/0/01/Golden_State_Warriors_logo.svg",
    "celtics": "https://upload.wikimedia.org/wikipedia/en/8/8b/Boston_Celtics.svg",
    "heat": "https://upload.wikimedia.org/wikipedia/en/f/fb/Miami_Heat_logo.svg",
};

function getTeamLogo(name: string): string | null {
    const lower = name.toLowerCase().trim();
    for (const [key, url] of Object.entries(TEAM_LOGOS)) {
        if (lower.includes(key) || key.includes(lower)) return url;
    }
    return null;
}

interface Props {
    teamName: string;
    size?: number;
    className?: string;
}

export function TeamLogo({ teamName, size = 32, className = "" }: Props) {
    const [error, setError] = useState(false);
    const logo = getTeamLogo(teamName);

    if (!logo || error) {
        // Fallback: initials badge
        const initials = teamName.split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase();
        return (
            <div
                className={`rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0 ${className}`}
                style={{ width: size, height: size, fontSize: size * 0.28 }}>
                {initials}
            </div>
        );
    }

    return (
        <img
            src={logo}
            alt={teamName}
            onError={() => setError(true)}
            loading="lazy"
            className={`object-contain shrink-0 ${className}`}
            style={{ width: size, height: size }}
        />
    );
}