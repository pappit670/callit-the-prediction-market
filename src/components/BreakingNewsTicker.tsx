import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const headlines = [
  "Harambee Stars confirm squad for AFCON qualifiers",
  "CBK holds interest rates steady",
  "Nairobi traffic: major jam on Mombasa Road",
  "KPL matchday results in",
];

const BreakingNewsTicker = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/call-it");
    toast("Be first to call this", { duration: 3000 });
  };

  const tickerContent = headlines.map((h, i) => (
    <span
      key={i}
      onClick={handleClick}
      className="cursor-pointer hover:text-gold transition-colors whitespace-nowrap"
    >
      {h} <span className="mx-3 text-muted-foreground">·</span>
    </span>
  ));

  return (
    <div className="w-full h-11 bg-[hsl(0,0%,4%)] dark:bg-[hsl(0,0%,11%)] flex items-center overflow-hidden">
      {/* Breaking pill */}
      <div className="flex items-center gap-1.5 px-4 shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(0,84%,60%)] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(0,84%,60%)]" />
        </span>
        <span className="text-xs font-semibold text-white">Breaking</span>
      </div>

      {/* Scrolling ticker */}
      <div className="flex-1 overflow-hidden relative">
        <div className="flex animate-ticker text-xs text-white/80">
          <div className="flex shrink-0">{tickerContent}</div>
          <div className="flex shrink-0">{tickerContent}</div>
        </div>
      </div>
    </div>
  );
};

export default BreakingNewsTicker;
