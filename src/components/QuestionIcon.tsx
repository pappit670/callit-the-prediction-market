// src/components/QuestionIcon.tsx
// Uses pre-mapped Wikipedia portrait URLs — no async fetch needed.
// Person photos → circle crop (news headshot style)
// Logos (SVG) → dark bg, inverted to white
// Logos (PNG) → dark bg, contained
// Flags → full bleed
// Fallback → letter with deterministic color

import { useState } from "react";
import { resolveQuestionIcon, getIconMeta } from "@/lib/questionIcons";

interface Props {
    iconUrl?: string | null;
    statement: string;
    size?: number;
    className?: string;

}

function letterColor(letter: string) {
    const hues = [220, 250, 280, 160, 30, 190, 340, 45, 200, 320, 15, 265];
    const hue = hues[letter.charCodeAt(0) % hues.length];
    return {
        bg: `hsl(${hue} 55% 18%)`,
        border: `1px solid hsl(${hue} 55% 28%)`,
        color: `hsl(${hue} 80% 72%)`,
    };
}

export function QuestionIcon({ iconUrl, statement, size = 48, className = "" }: Props) {
    const [error, setError] = useState(false);
    const resolved = resolveQuestionIcon(iconUrl, statement);
    const box = { width: size, height: size, minWidth: size, minHeight: size } as const;

    // ── Fallback ────────────────────────────────────────────────
    if (!resolved || error) {
        const letter = statement.trim()[0]?.toUpperCase() || "?";
        const colors = letterColor(letter);
        return (
            <div className={`shrink-0 rounded-xl flex items-center justify-center font-bold select-none ${className}`}
                style={{ ...box, ...colors, fontSize: size * 0.42 }}>
                {letter}
            </div>
        );
    }

    const { type } = getIconMeta(resolved);

    // ── Person portrait → circle ────────────────────────────────
    if (type === "person") {
        return (
            <div className={`shrink-0 overflow-hidden ${className}`}
                style={{ ...box, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(128,128,128,0.15)" }}>
                <img src={resolved} alt="" onError={() => setError(true)} loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
            </div>
        );
    }

    // ── Flag → full bleed ────────────────────────────────────────
    if (type === "flag") {
        return (
            <div className={`shrink-0 rounded-xl overflow-hidden ${className}`} style={box}>
                <img src={resolved} alt="" onError={() => setError(true)} loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
        );
    }

    // ── Logo → dark container ────────────────────────────────────
    return (
        <div className={`shrink-0 rounded-xl flex items-center justify-center ${className}`}
            style={{ ...box, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", padding: Math.round(size * 0.13) }}>
            <img src={resolved} alt="" onError={() => setError(true)} loading="lazy"
                style={{
                    width: "100%", height: "100%", objectFit: "contain",
                    filter: type === "logo-svg" ? "brightness(0) invert(1) opacity(0.88)" : "none",
                }} />
        </div>
    );
}
