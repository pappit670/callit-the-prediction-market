import { useState } from "react";
import { motion } from "framer-motion";
import { Share2, User, Star, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { calculateNetWin } from "@/lib/callit";
import CompactAnswerOptions from "./CompactAnswerOptions";
import StakeModal from "./StakeModal";

export interface OpinionCardData {
  id: number;
  question: string;
  yesPercent: number;
  noPercent: number;
  coins: number;
  timeLeft: string;
  genre: string;
  creator: string;
  postedDaysAgo?: number;
  callerCount?: number;
  isResolved?: boolean;
  winner?: "yes" | "no";
  resolutionType?: "crowd" | "event" | "metric";
  status?: "open" | "locked" | "resolved" | "draw";
  cardType?: "breaking" | "callit-pick" | "community";
  socialSource?: { platform: "twitter" | "instagram" | "tiktok" | "news"; label: string; url?: string };
  isSystemGenerated?: boolean;
  generatedFrom?: string;
  suggestedAnswers?: import("./AnswerOptions").SuggestedAnswer[];
  optionsLocked?: boolean;
}

const resolutionTypeLabels: Record<string, string> = {
  crowd: "Crowd",
  event: "Event",
  metric: "Metric",
};

const statusConfig: Record<string, { label: string; classes: string }> = {
  open: { label: "Open", classes: "bg-yes/15 text-yes" },
  locked: { label: "Closing", classes: "bg-gold/15 text-gold" },
  resolved: { label: "Resolved", classes: "bg-muted text-muted-foreground" },
  draw: { label: "Draw", classes: "bg-no/15 text-no" },
};

const OpinionCard = ({ data, index }: { data: OpinionCardData; index: number }) => {
  const { question, yesPercent, noPercent, coins, timeLeft, genre, creator, resolutionType = "crowd", status = "open", callerCount } = data;
  const navigate = useNavigate();
  const [stakeModal, setStakeModal] = useState<{ side: "yes" | "no"; optionLabel?: string } | null>(null);

  const { netWin } = calculateNetWin(100, yesPercent);
  const statusInfo = statusConfig[status] || statusConfig.open;
  const isActive = status === "open" || status === "locked";
  const hasSuggestedAnswers = data.suggestedAnswers && data.suggestedAnswers.length > 0;

  const openStake = (side: "yes" | "no", optionLabel?: string) => {
    setStakeModal({ side, optionLabel });
  };

  return (
    <>
      <motion.div
        className="compact-card bg-card relative cursor-pointer"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        {/* TOP ROW */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="rounded bg-gold/10 px-1.5 py-0.5 text-[10px] font-medium text-gold leading-none">
              {genre}
            </span>
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground leading-none">
              {resolutionTypeLabels[resolutionType] || "Crowd"}
            </span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium leading-none ${statusInfo.classes}`}>
              {statusInfo.label}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {data.isSystemGenerated || data.cardType === "callit-pick" ? (
              <span className="flex items-center gap-0.5 text-[10px] font-medium text-gold">
                <Star className="h-3 w-3 fill-gold text-gold" /> Pick
              </span>
            ) : data.cardType === "community" ? (
              <span className="flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground">
                <User className="h-3 w-3" />
              </span>
            ) : null}
          </div>
        </div>

        {/* QUESTION ROW */}
        <div
          className="mb-2"
          onClick={() => navigate(`/opinion/${data.id}`)}
        >
          <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 font-body">
            {data.cardType === "community" && (
              <span className="text-xs font-normal text-muted-foreground mr-1">@{creator} ·</span>
            )}
            {question}
          </p>
        </div>

        {/* SUGGESTED ANSWERS or YES/NO BAR */}
        {hasSuggestedAnswers ? (
          <CompactAnswerOptions
            answers={data.suggestedAnswers!}
            optionsLocked={data.optionsLocked ?? false}
            onCallClick={openStake}
          />
        ) : (
          <>
            {/* YES/NO BAR ROW */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-yes shrink-0">{yesPercent}%</span>
              <div className="flex h-1 w-full rounded-full overflow-hidden bg-secondary">
                <motion.div
                  className="h-full bg-yes rounded-l-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${yesPercent}%` }}
                  transition={{ duration: 0.5, delay: index * 0.05 + 0.1 }}
                />
                <motion.div
                  className="h-full bg-no rounded-r-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${noPercent}%` }}
                  transition={{ duration: 0.5, delay: index * 0.05 + 0.1 }}
                />
              </div>
              <span className="text-xs font-bold text-no shrink-0">{noPercent}%</span>
            </div>
          </>
        )}

        {/* BOTTOM ROW */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 text-[11px]">
            <span className="flex items-center gap-1 font-bold text-gold shrink-0">
              <Coins className="h-3 w-3" />
              {coins.toLocaleString()}
            </span>
            {callerCount !== undefined && (
              <span className="text-muted-foreground shrink-0">{callerCount} callers</span>
            )}
            <span className="text-muted-foreground shrink-0">{timeLeft}</span>
            {isActive && !hasSuggestedAnswers && (
              <span className="text-gold font-medium shrink-0">→ +{Math.round(netWin)}</span>
            )}
          </div>

          {/* ACTION BUTTONS */}
          {isActive && !hasSuggestedAnswers && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                className="rounded-full border border-yes bg-yes/20 px-2.5 py-1 text-[11px] font-semibold text-yes hover:bg-yes hover:text-white transition-all"
                onClick={(e) => { e.stopPropagation(); openStake("yes"); }}
              >
                Call Yes
              </button>
              <button
                className="rounded-full border border-no bg-no/20 px-2.5 py-1 text-[11px] font-semibold text-no hover:bg-no hover:text-white transition-all"
                onClick={(e) => { e.stopPropagation(); openStake("no"); }}
              >
                Call No
              </button>
            </div>
          )}

          {!isActive && (
            <span className="text-[11px] font-medium text-muted-foreground shrink-0">
              {status === "resolved" ? `${data.winner === "yes" ? "Yes" : "No"} Won` : "Draw"}
            </span>
          )}
        </div>
      </motion.div>

      {/* STAKE MODAL */}
      {stakeModal && (
        <StakeModal
          side={stakeModal.side}
          optionLabel={stakeModal.optionLabel}
          question={question}
          yesPercent={yesPercent}
          noPercent={noPercent}
          poolCoins={coins}
          onClose={() => setStakeModal(null)}
        />
      )}
    </>
  );
};

export default OpinionCard;
