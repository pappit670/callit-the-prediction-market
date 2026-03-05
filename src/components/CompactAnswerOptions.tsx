import { useState } from "react";
import { motion } from "framer-motion";
import type { SuggestedAnswer } from "./AnswerOptions";

interface CompactAnswerOptionsProps {
  answers: SuggestedAnswer[];
  optionsLocked: boolean;
  onCallClick: (side: "yes" | "no", optionLabel: string) => void;
}

const CompactAnswerOptions = ({ answers, optionsLocked, onCallClick }: CompactAnswerOptionsProps) => {
  const [showAddInput, setShowAddInput] = useState(false);
  const [newAnswer, setNewAnswer] = useState("");

  return (
    <div className="mb-2 space-y-1">
      {answers.map((answer) => (
        <div
          key={answer.id}
          className="flex items-center gap-2 rounded-lg bg-secondary/50 px-2.5 py-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-[13px] font-semibold text-foreground font-body min-w-0 truncate flex-1">
            {answer.label}
          </span>
          <div className="flex h-1 w-16 rounded-full overflow-hidden bg-muted shrink-0">
            <div className="h-full bg-yes rounded-l-full" style={{ width: `${answer.yesPercent}%` }} />
            <div className="h-full bg-no rounded-r-full" style={{ width: `${answer.noPercent}%` }} />
          </div>
          <span className="text-[11px] font-bold text-gold shrink-0">{answer.coins}</span>
          {answer.status !== "resolved" && (
            <div className="flex gap-1 shrink-0">
              <button
                className="rounded-full border border-yes bg-yes/20 px-2 py-0.5 text-[10px] font-semibold text-yes hover:bg-yes hover:text-white transition-all"
                onClick={() => onCallClick("yes", answer.label)}
              >
                Yes {answer.yesPercent}%
              </button>
              <button
                className="rounded-full border border-no bg-no/20 px-2 py-0.5 text-[10px] font-semibold text-no hover:bg-no hover:text-white transition-all"
                onClick={() => onCallClick("no", answer.label)}
              >
                No {answer.noPercent}%
              </button>
            </div>
          )}
        </div>
      ))}

      {optionsLocked ? (
        <p className="text-[11px] text-muted-foreground">Options locked</p>
      ) : showAddInput ? (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <input
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            placeholder="Your answer..."
            className="flex-1 rounded-full border border-gold bg-background px-3 py-1 text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
          />
          <span className="text-[10px] text-muted-foreground shrink-0">50 coin min</span>
        </div>
      ) : (
        <button
          className="rounded-full border border-gold px-3 py-1 text-xs font-medium text-gold hover:bg-gold hover:text-primary-foreground transition-all"
          onClick={(e) => { e.stopPropagation(); setShowAddInput(true); }}
        >
          + Add your answer
        </button>
      )}
    </div>
  );
};

export default CompactAnswerOptions;
