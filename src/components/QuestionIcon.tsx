// src/components/QuestionIcon.tsx
// Square icon shown left of every OpinionCard question.
// Three visual modes handled automatically:
//   PNG logos (crypto)  → dark bg container, object-contain
//   SVG logos (clubs)   → dark bg container, inverted to white
//   Flags               → full-bleed, object-cover
//   Fallback            → first letter, deterministic color

import { useState } from "react";
import { resolveQuestionIcon } from "@/lib/questionIcons";

interface Props {
    iconUrl?: string | null;
    statement: string;
    size?: number;
    className?: string;
}

const isFlag = (url: string) => url.includes("flagcdn.com");
const isSvgLogo = (url: string) => url.toLowerCase().includes(".svg");

export function QuestionIcon({ iconUrl, statement, size = 48, className = "" }: Props) {
    const [error, setError] = useState(false);
    const resolved = resolveQuestionIcon(iconUrl, statement);

    const box: React.CSSProperties = { width: size, height: size, minWidth: size, minHeight: size };

    // ── Letter fallback ────────────────────────────────────────
    if (!resolved || error) {
        const letter = statement.trim()[0]?.toUpperCase() || "?";
        const hues = [220, 250, 280, 160, 30, 190, 340, 45];
        const hue = hues[letter.charCodeAt(0) % hues.length];
        return (
            <div
                className={`shrink-0 rounded-xl flex items-center justify-center font-bold select-none ${className}`}
                style={{
                    ...box,
                    background: `hsl(${hue} 55% 18%)`,
                    border: `1px solid hsl(${hue} 55% 28%)`,
                    color: `hsl(${hue} 80% 72%)`,
                    fontSize: size * 0.42,
                }}
            >
                {letter}
            </div>
        );
    }

    // ── Flag — full bleed ──────────────────────────────────────
    if (isFlag(resolved)) {
        return (
            <div className={`shrink-0 rounded-xl overflow-hidden ${className}`} style={box}>
                <img
                    src={resolved}
                    alt=""
                    onError={() => setError(true)}
                    loading="lazy"
                    className="w-full h-full object-cover"
                />
            </div>
        );
    }

    // ── Logo (PNG or SVG) — contained on dark bg ───────────────
    return (
        <div
            className={`shrink-0 rounded-xl flex items-center justify-center ${className}`}
            style={{
                ...box,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.09)",
                padding: Math.round(size * 0.13),
            }}
        >
            <img
                src={resolved}
                alt=""
                onError={() => setError(true)}
                loading="lazy"
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    // SVG club crests are black-on-transparent → invert for dark theme
                    filter: isSvgLogo(resolved)
                        ? "brightness(0) invert(1) opacity(0.88)"
                        : "none",
                }}
            />
        </div>
    );
}
