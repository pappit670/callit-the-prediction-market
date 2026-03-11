import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import OpinionCard from "@/components/OpinionCard";
import { sampleCards } from "@/data/sampleCards";

const SavedCalls = () => {
  const navigate = useNavigate();
  // Mock subset of saved calls
  const savedCards = useMemo(() => sampleCards.slice(0, 3), []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 md:px-6 pt-12">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-8">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Saved Calls
          </span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-10 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center border border-gold">
            <Bookmark className="h-6 w-6 text-gold" />
          </div>
          <div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-foreground leading-tight">
              Bookmarked Opinions
            </h1>
            <p className="text-sm border border-border px-2 py-0.5 rounded-full w-max text-muted-foreground mt-2 font-mono">
               {savedCards.length} saved
            </p>
          </div>
        </motion.div>

        {savedCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {savedCards.map((card, i) => (
              <motion.div 
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <OpinionCard data={card} index={i} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-2xl bg-secondary/20">
            <Bookmark className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-headline text-xl font-bold text-foreground mb-2">No saved calls</h3>
            <p className="text-muted-foreground font-body max-w-md">
              You haven't bookmarked any opinions yet. Click the bookmark icon on any call card to save it here for later.
            </p>
            <button 
              onClick={() => navigate("/")}
              className="mt-6 rounded-full bg-foreground text-background px-6 py-2.5 text-sm font-semibold hover:bg-foreground/90 transition-all font-body"
            >
              Explore Feed
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default SavedCalls;
