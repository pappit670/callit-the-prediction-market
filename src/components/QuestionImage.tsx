import { useState } from "react";
import { resolveQuestionImage } from "@/lib/questionImages";

interface Props {
    imageUrl?: string | null;
    topicSlug?: string | null;
    statement: string;
    height?: number;
    className?: string;
}

export function QuestionImage({ imageUrl, topicSlug, statement, height = 140, className = "" }: Props) {
    const [error, setError] = useState(false);
    const resolved = resolveQuestionImage(imageUrl, topicSlug, statement);

    if (!resolved || error) return null;

    return (
        <div
            className={`w-full overflow-hidden rounded-xl ${className}`}
            style={{ height }}>
            <img
                src={resolved}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setError(true)}
                loading="lazy"
            />
        </div>
    );
}