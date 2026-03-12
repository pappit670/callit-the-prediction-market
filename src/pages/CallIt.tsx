import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, ChevronRight, ChevronLeft, Bitcoin, Trophy, Laptop, Landmark, PenTool, Flame, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import OpinionCard from "@/components/OpinionCard";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

const categories = [
  "Crypto", "Sports", "Tech", "Politics", "Economy", "Culture", "Entertainment", "Random"
];

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

const resolutionSources = ["Official News", "Government Data", "Sports Result", "Market Price", "Community Consensus"];

const CallIt = () => {
  const navigate = useNavigate();
  const { postCall, isLoggedIn } = useApp();
  const [step, setStep] = useState(1);

  // Form State
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState("Random");
  const [resDate, setResDate] = useState("");
  const [resSource, setResSource] = useState("Official News");
  const [description, setDescription] = useState("");
  const [agreeReason, setAgreeReason] = useState("");
  const [disagreeReason, setDisagreeReason] = useState("");
  const [stake, setStake] = useState("10");
  const [visibility, setVisibility] = useState<"Public" | "Friends" | "Community">("Public");

  useEffect(() => {
    if (!isLoggedIn) {
      toast.error("Please log in to make a call.");
      navigate("/auth");
    }
  }, [isLoggedIn, navigate]);

  const handleTemplateSelect = (template: typeof templates[0]) => {
    setQuestion(template.example === "Create your own unique Call." ? "" : template.example);
    setCategory(template.category);
    setStep(2);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setQuestion(suggestion);
    setStep(2);
  };

  const isReady = question.trim().length > 10 && resDate && stake;

  const previewData = useMemo(() => ({
    id: Date.now(),
    question: question || "Your prediction will appear here...",
    yesPercent: 50,
    noPercent: 50,
    coins: Number(stake),
    timeLeft: resDate ? `Ends ${resDate}` : "TBD",
    genre: category,
    status: "open" as const,
  }), [question, stake, resDate, category]);

  return (
    <div className="min-h-screen bg-background transition-colors duration-400">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-12 pb-24">
        {/* Progress Header */}
        <div className="mb-12 flex flex-col items-center">
          <div className="flex items-center gap-4 mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div 
                  className={`h-10 w-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                    step >= s ? "bg-gold text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {step > s ? <Check className="h-5 w-5" /> : s}
                </div>
                {s < 3 && (
                  <div className={`h-1 w-12 md:w-24 transition-all duration-300 ${step > s ? "bg-gold" : "bg-secondary"}`} />
                )}
              </div>
            ))}
          </div>
          <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Step {step} of 3</span>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: SELECT TEMPLATE */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-12"
            >
              <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">What type of Call do you want to make?</h1>
                <p className="text-lg text-muted-foreground">Choose a format or start from a trending idea.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleTemplateSelect(t)}
                    className="flex flex-col items-start text-left p-6 rounded-2xl border border-border bg-card hover:border-gold hover:shadow-lg transition-all group"
                  >
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
                  <Flame className="h-4 w-4 text-gold" /> Trending Calls You Could Create
                </h2>
                <div className="grid gap-4">
                  {trendingIdeas.map((idea, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionSelect(idea)}
                      className="w-full p-4 rounded-xl border border-border bg-secondary/30 text-left hover:bg-secondary hover:border-gold/50 transition-all font-semibold flex justify-between items-center group"
                    >
                      <span>{idea}</span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-gold transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: CUSTOMIZE */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-2xl mx-auto space-y-10"
            >
              <div className="flex items-center gap-4">
                <button onClick={() => setStep(1)} className="p-2 rounded-full hover:bg-secondary text-muted-foreground">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <h1 className="text-3xl font-bold">Edit Your Call</h1>
              </div>

              {/* Main Question Input */}
              <div className="space-y-4">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Prediction Question</label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. Will Bitcoin reach $100k before 2027?"
                  className="w-full text-2xl font-bold bg-transparent border-b-2 border-border focus:border-gold outline-none py-4 placeholder:text-muted-foreground/30 resize-none transition-all"
                  rows={2}
                />
              </div>

              {/* Market Details Card */}
              <div className="bg-card border border-border rounded-3xl p-8 space-y-6 shadow-sm">
                <h3 className="font-bold text-lg flex items-center gap-2">
                   Market Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Category</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-secondary rounded-xl px-4 py-3 border border-border focus:border-gold outline-none transition-all"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Resolution Date</label>
                    <input 
                      type="date"
                      value={resDate}
                      onChange={(e) => setResDate(e.target.value)}
                      className="w-full bg-secondary rounded-xl px-4 py-3 border border-border focus:border-gold outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Resolution Source</label>
                  <select 
                    value={resSource}
                    onChange={(e) => setResSource(e.target.value)}
                    className="w-full bg-secondary rounded-xl px-4 py-3 border border-border focus:border-gold outline-none transition-all"
                  >
                    {resolutionSources.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Description (Optional)</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain what this Call means..."
                    className="w-full bg-secondary rounded-xl px-4 py-3 border border-border focus:border-gold outline-none transition-all resize-none"
                    rows={3}
                  />
                </div>
              </div>

              {/* Argument Builder */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold">Prediction Arguments</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-yes uppercase tracking-wider">Why might this happen?</label>
                    <textarea 
                      value={agreeReason}
                      onChange={(e) => setAgreeReason(e.target.value)}
                      placeholder="e.g. BTC is gaining institucional adoption..."
                      className="w-full bg-yes/5 border border-yes/20 rounded-2xl p-4 outline-none focus:border-yes transition-all resize-none text-sm"
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-no uppercase tracking-wider">Why might this NOT happen?</label>
                    <textarea 
                      value={disagreeReason}
                      onChange={(e) => setDisagreeReason(e.target.value)}
                      placeholder="e.g. Regulatory hurdles could slow down growth..."
                      className="w-full bg-no/5 border border-no/20 rounded-2xl p-4 outline-none focus:border-no transition-all resize-none text-sm"
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setStep(3)}
                  disabled={!isReady}
                  className={`w-full py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                    isReady ? "bg-gold text-primary-foreground shadow-lg hover:bg-gold-hover scale-100" : "bg-muted text-muted-foreground scale-95 opacity-50 cursor-not-allowed"
                  }`}
                >
                  Preview Your Call <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: PREVIEW & LAUNCH */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-2xl mx-auto space-y-12"
            >
              <div className="flex items-center gap-4">
                <button onClick={() => setStep(2)} className="p-2 rounded-full hover:bg-secondary text-muted-foreground">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <h1 className="text-3xl font-bold">Preview Your Call</h1>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-center">Live Feed Preview</p>
                <div className="pointer-events-none">
                   <OpinionCard data={previewData} index={0} />
                </div>
              </div>

              {/* Launch Settings */}
              <div className="bg-card border border-border rounded-3xl p-8 space-y-8 shadow-sm">
                 <div className="space-y-4 text-center pb-6 border-b border-border">
                    <p className="text-xs font-bold uppercase text-muted-foreground">Founding Stake</p>
                    <div className="flex items-center justify-center gap-3">
                       <Coins className="h-8 w-8 text-gold" />
                       <input 
                         type="number" 
                         value={stake}
                         onChange={(e) => setStake(e.target.value)}
                         className="bg-transparent text-5xl font-bold w-32 border-none focus:ring-0 outline-none text-center"
                       />
                    </div>
                    <p className="text-sm text-muted-foreground">Seed the pool to start the market.</p>
                 </div>

                 <div className="space-y-4">
                    <p className="text-xs font-bold uppercase text-muted-foreground">Visibility</p>
                    <div className="flex p-1 bg-secondary rounded-2xl gap-1">
                       {["Public", "Friends", "Community"].map((v) => (
                         <button
                           key={v}
                           onClick={() => setVisibility(v as any)}
                           className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                             visibility === v ? "bg-background shadow-md text-foreground" : "text-muted-foreground hover:text-foreground"
                           }`}
                         >
                           {v}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>

              <button
                onClick={() => {
                   postCall({
                     question,
                     declared: "yes", // Originator starts as Yes for now in this flow
                     category,
                     duration: `until ${resDate}`,
                     stake: Number(stake),
                     resolutionType: "event",
                   });
                   toast.success("Call launched successfully!");
                   navigate("/");
                }}
                className="w-full py-5 rounded-full bg-gold text-primary-foreground font-black text-xl shadow-xl hover:bg-gold-hover hover:scale-[1.02] transition-all animate-gold-pulse uppercase tracking-widest"
              >
                Launch Call
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default CallIt;
