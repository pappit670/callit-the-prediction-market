import { useState } from "react";
import { motion } from "framer-motion";
import { calculateNetWin } from "@/lib/callit";

export interface SuggestedAnswer {
  id: string;
  label: string;
  yesPercent: number;
  noPercent: number;
  coins: number;
  callerCount: number;
  status: "open" | "locked" | "resolved";
}

interface AnswerOptionsProps {
  answers: SuggestedAnswer[];
  optionsLocked: boolean;
  index: number;
}

const AnswerOptions = ({ answers, optionsLocked, index }: AnswerOptionsProps) => {
  const [showAddInput, setShowAddInput] = useState(false);
  const [newAnswer, setNewAnswer] = useState("");

  return (
    <div className="mb-3">
      <div className="space-y-2">
        {answers.map((answer, i) => {
          const { netWin } = calculateNetWin(100, answer.yesPercent);
          return (
            <motion.div
              key={answer.id}
              className="rounded-lg border border-border bg-secondary/50 p-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.08 + i * 0.05 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Option name + pool */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-semibold text-foreground font-body">
                  {answer.label}
                </span>
                <span className="text-[11px] font-bold text-gold font-body">
                  {answer.coins.toLocaleString()} coins
                </span>
              </div>

              {/* Thin bar */}
              <div className="flex h-1 w-full rounded-full overflow-hidden bg-muted mb-1.5">
                <motion.div
                  className="h-full bg-yes rounded-l-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${answer.yesPercent}%` }}
                  transition={{ duration: 0.5, delay: index * 0.08 + 0.2 }}
                />
                <motion.div
                  className="h-full bg-no rounded-r-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${answer.noPercent}%` }}
                  transition={{ duration: 0.5, delay: index * 0.08 + 0.2 }}
                />
              </div>

              {/* Percentages + compact call buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-yes">{answer.yesPercent}%</span>
                  <span className="text-[11px] font-bold text-no">{answer.noPercent}%</span>
                  <span className="text-[10px] text-muted-foreground">{answer.callerCount} callers</span>
                </div>
                {answer.status !== "resolved" && (
                  <div className="flex gap-1.5">
                    <button className="rounded-full border border-yes bg-yes/10 px-2.5 py-0.5 text-[10px] font-semibold text-yes hover:bg-yes hover:text-white transition-all">
                      Call Yes
                    </button>
                    <button className="rounded-full border border-no bg-no/10 px-2.5 py-0.5 text-[10px] font-semibold text-no hover:bg-no hover:text-white transition-all">
                      Call No
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add answer button or locked notice */}
      {optionsLocked ? (
        <p className="text-[11px] text-muted-foreground mt-2">Options locked</p>
      ) : showAddInput ? (
        <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
          <input
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            placeholder="Your answer option..."
            className="flex-1 rounded-full border border-gold bg-background px-3 py-1 text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
          />
          <span className="text-[10px] text-muted-foreground shrink-0">50 coin min</span>
        </div>
      ) : (
        <button
          className="mt-2 rounded-full border border-gold px-3 py-1 text-xs font-medium text-gold hover:bg-gold hover:text-primary-foreground transition-all"
          onClick={(e) => {
            e.stopPropagation();
            setShowAddInput(true);
          }}
        >
          + Add your answer
        </button>
      )}
    </div>
  );
};

export default AnswerOptions;
