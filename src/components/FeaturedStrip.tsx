import { useNavigate } from "react-router-dom";
import { OpinionCardData } from "./OpinionCard";

const resolutionTypeLabels: Record<string, string> = {
  crowd: "Crowd Based",
  event: "Event Based",
  metric: "Metric Based",
};

const FeaturedStrip = ({ cards }: { cards: OpinionCardData[] }) => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[13px] font-semibold text-gold font-body">
          Callit's Top Picks
        </h2>
        <button
          onClick={() => navigate("/")}
          className="text-[13px] font-medium text-gold hover:text-gold/80 transition-colors font-body"
        >
          See all
        </button>
      </div>

      <div
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => navigate(`/opinion/${card.id}`)}
            className="min-w-[260px] max-w-[260px] rounded-xl border border-gold/30 bg-card p-4 cursor-pointer hover:border-gold transition-colors"
            style={{ scrollSnapAlign: "start" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-medium text-gold">⭐ Callit Pick</span>
            </div>

            <h3 className="font-body text-sm font-semibold text-foreground mb-2 leading-snug line-clamp-2">
              {card.question}
            </h3>

            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-medium text-gold">
                {card.genre}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {resolutionTypeLabels[card.resolutionType ?? "crowd"]}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gold">
                {card.coins.toLocaleString()} coins
              </span>
              <span className="text-[10px] text-muted-foreground">
                {card.timeLeft}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedStrip;
