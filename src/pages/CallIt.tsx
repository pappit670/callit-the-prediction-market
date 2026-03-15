import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Bitcoin, Trophy, Laptop, Landmark, PenTool, Flame, Check, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner";

const categories = ["Crypto", "Sports", "Tech", "Politics", "Economy", "Culture", "Entertainment", "Random"];

const templates = [
  { id: "crypto", title: "Crypto Prediction", example: "Will Bitcoin reach $100k before 2027?", icon: <Bitcoin className="h-6 w-6" />, category: "Crypto" },
  { id: "sports", title: "Sports Prediction", example: "Will Arsenal win the Champions League this season?", icon: <Trophy className="h-6 w-6" />, category: "Sports" },
  { id: "tech", title: "Tech Prediction", example: "Will Apple release a foldable iPhone before 2027?", icon: <Laptop className="h-6 w-6" />, category: "Tech" },
  { id: "politics", title: "Politics Prediction", example: "Will the current president be re-elected?", icon: <Landmark className="h-6 w-6" />, category: "Politics" },
  { id: "custom", title: "Custom Prediction", example: "Create your own unique Call.", icon: <PenTool className="h-6 w-6" />, category: "Random" },
];

const trendingIdeas = [
  "Will Tesla release a humanoid robot before 2030?",
  "Will Ethereum flip Bitcoin in market cap by 2026?",
  "Will the next World Cup be held in more than 3 countries?",
];

const CallIt = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useApp();
  const [step, setStep] = useState(1);
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState("Random");
  const [resDate, setResDate] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["Yes", "No"]);
  const [newOption, setNewOption] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) { toast.error("Please log in to make a call."); navigate("/auth"); }
  }, [isLoggedIn, navigate]);

  const handleTemplateSelect = (template: typeof templates[0]) => {
    setQuestion(template.example === "Create your own unique Call." ? "" : template.example);
    setCategory(template.category);
    setStep(2);
  };

  const addOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions([...options, newOption.trim()]);
      setNewOption("");
    }
  };

  const removeOption = (opt: string) => {
    if (options.length > 2) setOptions(options.filter(o => o !== opt));
  };

  const isReady = question.trim().length > 10 && resDate && options.length >= 2;

  const handleLaunch = async () => {
    if (!isReady) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { data: topicData } = await supabase
        .from("topics")
        .select("id")
        .ilike("name", category)
        .single();

      const { data, error } = await supabase.from("opinions").insert({
        creator_id: user.id,
        topic_id: topicData?.id || null,
        statement: question,
        description: description || null,
        options: options,
        end_time: new Date(resDate).toISOString(),
        status: "open",
        ai_generated: false,
        auto_generated: false,
      }).select().single();

      if (error) throw error;
      toast.success("Call launched successfully!");
      navigate(`/opinion/${data.id}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to launch call");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12 pb-24">

        {/* Progress */}
        <div className="mb-12 flex flex-col items-center">
          <div className="flex items-center gap-4 mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= s ? "bg-gold text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}>
                  {step > s ? <Check className="h-5 w-5" /> : s}
                </div>
                {s < 3 && <div className={`h-1 w-12 md:w-24 transition-all ${step > s ? "bg-gold" : "bg-secondary"}`} />}
              </div>
            ))}
          </div>
          <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Step {step} of 3</span>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1 */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-12">
              <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">What type of Call do you want to make?</h1>
                <p className="text-lg text-muted-foreground">Choose a format or start from a trending idea.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((t) => (
                  <button key={t.id} onClick={() => handleTemplateSelect(t)}
                    className="flex flex-col items-start text-left p-6 rounded-2xl border border-border bg-card hover:border-gold hover:shadow-lg transition-all group">
                    <div className="p-3 rounded-xl bg-secondary text-gold mb-6 group-hover:bg-gold group-hover:text-primary-foreground transition-colors">
                      {t.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{t.title}</h3>
                    <p className="text-sm text-muted-foreground italic">"{t.example}"</p>
                  </button>
                ))}
              </div>
              <div className="pt-8 px-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-gold" /> Trending Ideas
                </h2>
                <div className="grid gap-4">
                  {trendingIdeas.map((idea, i) => (
                    <button key={i} onClick={() => { setQuestion(idea); setStep(2); }}
                      className="w-full p-4 rounded-xl border border-border bg-secondary/30 text-left hover:bg-secondary hover:border-gold/50 transition-all font-semibold flex justify-between items-center group">
                      <span>{idea}</span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-gold transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="max-w-2xl mx-auto space-y-10">
              <div className="flex items-center gap-4">
                <button onClick={() => setStep(1)} className="p-2 rounded-full hover:bg-secondary text-muted-foreground">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <h1 className="text-3xl font-bold">Edit Your Call</h1>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Your Question</label>
                <textarea value={question} onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. Will Bitcoin reach $100k before 2027?"
                  className="w-full text-2xl font-bold bg-transparent border-b-2 border-border focus:border-gold outline-none py-4 placeholder:text-muted-foreground/30 resize-none transition-all"
                  rows={2} />
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                <h3 className="font-bold text-lg">Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-secondary rounded-xl px-4 py-3 border border-border focus:border-gold outline-none transition-all">
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Resolution Date</label>
                    <input type="date" value={resDate} onChange={(e) => setResDate(e.target.value)}
                      className="w-full bg-secondary rounded-xl px-4 py-3 border border-border focus:border-gold outline-none transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Description (Optional)</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain what this Call means..."
                    className="w-full bg-secondary rounded-xl px-4 py-3 border border-border focus:border-gold outline-none transition-all resize-none" rows={3} />
                </div>
              </div>

              {/* Options Builder */}
              <div className="space-y-4">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Call Options</label>
                <p className="text-sm text-muted-foreground">What can people call? Add up to 6 options.</p>
                <div className="flex flex-col gap-2">
                  {options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-3 bg-secondary rounded-xl px-4 py-3 border border-border">
                      <span className="flex-1 font-semibold text-foreground">{opt}</span>
                      {options.length > 2 && (
                        <button onClick={() => removeOption(opt)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {options.length < 6 && (
                    <div className="flex gap-2">
                      <input value={newOption} onChange={(e) => setNewOption(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addOption()}
                        placeholder="Add an option..."
                        className="flex-1 bg-secondary rounded-xl px-4 py-3 border border-border focus:border-gold outline-none transition-all text-sm" />
                      <button onClick={addOption} className="px-4 py-3 rounded-xl bg-gold text-primary-foreground hover:bg-gold-hover transition-all">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button onClick={() => setStep(3)} disabled={!isReady}
                className={`w-full py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all ${isReady ? "bg-gold text-primary-foreground hover:bg-gold-hover" : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                  }`}>
                Preview Your Call <ChevronRight className="h-5 w-5" />
              </button>
            </motion.div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="max-w-2xl mx-auto space-y-10">
              <div className="flex items-center gap-4">
                <button onClick={() => setStep(2)} className="p-2 rounded-full hover:bg-secondary text-muted-foreground">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <h1 className="text-3xl font-bold">Preview Your Call</h1>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-3 py-1 rounded-full bg-gold/10 text-gold font-semibold">{category}</span>
                  <span className="text-xs text-muted-foreground">Ends {new Date(resDate).toLocaleDateString()}</span>
                </div>
                <h2 className="text-xl font-bold text-foreground">{question}</h2>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {options.map((opt, i) => (
                    <div key={i} className="px-4 py-3 rounded-xl border border-border bg-secondary text-center">
                      <span className="font-semibold text-foreground text-sm">{opt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={handleLaunch} disabled={submitting}
                className="w-full py-5 rounded-full bg-gold text-primary-foreground font-black text-xl hover:bg-gold-hover hover:scale-[1.02] transition-all animate-gold-pulse uppercase tracking-widest disabled:opacity-60">
                {submitting ? "Launching..." : "Launch Call"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default CallIt;