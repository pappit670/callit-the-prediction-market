import { useState } from "react";
import { resolveQuestionIcon } from "@/lib/questionIcons";

interface Props {
    iconUrl?: string | null;
    statement: string;
    size?: number; // default 24
    className?: string;
}

export function QuestionIcon({ iconUrl, statement, size = 24, className = "" }: Props) {
    const [error, setError] = useState(false);
    const resolved = resolveQuestionIcon(iconUrl, statement);

    if (!resolved || error) {
        // Fallback: first letter of statement in a colored box
        const letter = statement.trim()[0]?.toUpperCase() || "?";
        return (
            <div
                className={`shrink-0 rounded-md bg-secondary border border-border flex items-center justify-center font-bold text-muted-foreground ${className}`}
                style={{ width: size, height: size, fontSize: size * 0.45 }}>
                {letter}
            </div>
        );
    }

    return (
        <img
            src={resolved}
            alt=""
            onError={() => setError(true)}
            loading="lazy"
            className={`shrink-0 rounded-md object-contain ${className}`}
            style={{ width: size, height: size }}
        />
    );
}