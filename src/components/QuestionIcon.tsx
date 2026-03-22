// src/components/QuestionIcon.tsx
// Square icon shown on the left of every OpinionCard.
// Resolves from: stored iconUrl → keyword match → letter fallback.
// Handles three visual types automatically:
//   - Logos (crypto, tech, clubs): transparent bg, object-contain
//   - Flags (country): rounded, object-cover
//   - Fallback: first letter in a styled square

import { useState } from "react";
import { resolveQuestionIcon } from "@/lib/questionIcons";

interface Props {
    iconUrl?: string | null;
    statement: string;
    size?: number;
    className?: string;
}

// Detect if a URL is a flag (flagcdn.com)
const isFlag = (url: string) => url.includes("flagcdn.com");

// Detect if a URL is likely a logo on transparent bg (svg logos)
const isSvgLogo = (url: string) => url.endsWith(".svg");

export function QuestionIcon({ iconUrl, statement, size = 48, className = "" }: Props) {
    const [error, setError] = useState(false);
    const resolved = resolveQuestionIcon(iconUrl, statement);

    const containerStyle: React.CSSProperties = {
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
    };

    // ── No icon resolved OR image failed → letter fallback ──────
    if (!resolved || error) {
        const letter = statement.trim()[0]?.toUpperCase() || "?";
        // Pick a deterministic color from the first char
        const hues = [220, 250, 280, 160, 30, 190, 340, 45];
        const hue = hues[letter.charCodeAt(0) % hues.length];
        return (
            <div
                className={`shrink-0 rounded-xl flex items-center justify-center font-bold select-none ${className}`}
                style={{
                    ...containerStyle,
                    background: `hsl(${hue} 60% 20%)`,
                    border: `1px solid hsl(${hue} 60% 30%)`,
                    color: `hsl(${hue} 80% 75%)`,
                    fontSize: size * 0.42,
                }}
            >
                {letter}
            </div>
        );
    }

    // ── Flag icon ────────────────────────────────────────────────
    if (isFlag(resolved)) {
        return (
            <div
                className={`shrink-0 rounded-xl overflow-hidden ${className}`}
                style={containerStyle}
            >
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

    // ── Logo icon (club crests, crypto, tech) ───────────────────
    // Transparent bg with subtle dark container so logos pop on dark theme
    return (
        <div
            className={`shrink-0 rounded-xl flex items-center justify-center ${className}`}
            style={{
                ...containerStyle,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: size * 0.12,
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
                    // SVG logos that are black-on-transparent need inversion on dark bg
                    filter: isSvgLogo(resolved) ? "brightness(0) invert(1) opacity(0.85)" : "none",
                }}
            />
        </div>
    );
}
