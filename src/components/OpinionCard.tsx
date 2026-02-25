import { motion } from "framer-motion";
import { Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  stakerCount?: number;
  isResolved?: boolean;
  winner?: "yes" | "no";
  resolutionType?: "crowd" | "event" | "metric";
  status?: "open" | "locked" | "resolved" | "draw";
}

const resolutionTypeLabels: Record<string, string> = {
  crowd: "Crowd Based",
  event: "Event Based",
  metric: "Metric Based",
};

const statusConfig: Record<string, { label: string; classes: string }> = {
  open: { label: "Open", classes: "bg-yes/15 text-yes" },
  locked: { label: "Closing", classes: "bg-gold/15 text-gold" },
  resolved: { label: "Resolved", classes: "bg-muted text-muted-foreground" },
  draw: { label: "Draw — Refunded", classes: "bg-no/15 text-no" },
};

const OpinionCard = ({ data, index }: { data: OpinionCardData; index: number }) => {
  const { question, yesPercent, noPercent, coins, timeLeft, genre, creator, resolutionType = "crowd", status = "open" } = data;
  const navigate = useNavigate();

  const potentialWin = Math.round(100 * (100 / yesPercent) * 0.9 - 100);
  const statusInfo = statusConfig[status] || statusConfig.open;
  const isActive = status === "open" || status === "locked";

  return (
    <motion.div
      className="card-gold bg-card p-6 relative cursor-pointer"
      onClick={() => navigate(`/opinion/${data.id}`)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
            {genre}
          </span>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {resolutionTypeLabels[resolutionType] || "Crowd Based"}
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusInfo.classes}`}>
            {statusInfo.label}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">{timeLeft}</span>
          <button
            className="text-muted-foreground hover:text-gold transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Question */}
      <h3 className="font-body text-base font-semibold text-foreground mb-3 leading-snug">
        {question}
      </h3>

      {/* Creator */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-5 w-5 rounded-full bg-secondary border border-border flex items-center justify-center text-[8px] font-bold text-muted-foreground">
          {creator[0].toUpperCase()}
        </div>
        <span className="text-xs text-muted-foreground">@{creator}</span>
      </div>

      {/* Progress bar */}
      <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-secondary mb-3">
        <motion.div
          className="h-full bg-yes rounded-l-full"
          initial={{ width: 0 }}
          animate={{ width: `${yesPercent}%` }}
          transition={{ duration: 0.6, delay: index * 0.08 + 0.2, ease: "easeOut" }}
        />
        <motion.div
          className="h-full bg-no rounded-r-full"
          initial={{ width: 0 }}
          animate={{ width: `${noPercent}%` }}
          transition={{ duration: 0.6, delay: index * 0.08 + 0.2, ease: "easeOut" }}
        />
      </div>

      {/* Percentages */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold text-yes">Yes {yesPercent}%</span>
        <span className="text-sm font-bold text-no">No {noPercent}%</span>
      </div>

      {/* Weighted label */}
      <p className="text-[10px] text-muted-foreground mb-3">Weighted by coins staked</p>

      {/* Coins */}
      <div className="mb-3">
        <span className="text-sm font-semibold text-gold">{coins.toLocaleString()}</span>
        <span className="text-xs text-muted-foreground ml-1">in pool</span>
      </div>

      {/* Potential return */}
      {isActive && (
        <p className="text-xs text-muted-foreground mb-3">
          Stake 100 → potential win <span className="text-gold font-semibold">{potentialWin}</span> coins
        </p>
      )}

      {/* Action buttons */}
      {isActive ? (
        <div className="flex gap-3">
          <button
            className="flex-1 rounded-lg border border-yes bg-yes-faded py-2 text-sm font-semibold text-yes hover:bg-yes hover:text-white transition-all duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            Stake Yes
          </button>
          <button
            className="flex-1 rounded-lg border border-no bg-no-faded py-2 text-sm font-semibold text-no hover:bg-no hover:text-white transition-all duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            Stake No
          </button>
        </div>
      ) : (
        <div className="rounded-lg bg-muted py-2 text-center text-sm font-medium text-muted-foreground">
          {status === "resolved" ? `${data.winner === "yes" ? "Yes" : "No"} Won` : "Draw — Stakes Refunded"}
        </div>
      )}
    </motion.div>
  );
};

export default OpinionCard;
