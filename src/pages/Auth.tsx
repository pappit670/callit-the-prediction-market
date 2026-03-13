import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

const CoinParticle = ({ delay, x }: { delay: number; x: number }) => (
  <motion.div
    className="absolute text-gold text-2xl pointer-events-none"
    initial={{ top: -40, left: `${x}%`, opacity: 1, rotate: 0 }}
    animate={{ top: "110%", opacity: 0, rotate: 360 }}
    transition={{ duration: 2.5, delay, ease: "easeOut" }}
  >
    <Coins className="h-6 w-6" />
  </motion.div>
);

const coinParticles = Array.from({ length: 18 }, (_, i) => ({
  delay: i * 0.12,
  x: Math.random() * 90 + 5,
}));

const CountUp = ({ target }: { target: number }) => {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const steps = 40;
    const increment = target / steps;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setCurrent(step >= steps ? target : Math.round(increment * step));
      if (step >= steps) clearInterval(interval);
    }, 1500 / steps);
    return () => clearInterval(interval);
  }, [target]);
  return <span>{current.toLocaleString()}</span>;
};

const Auth = () => {
  const navigate = useNavigate();
  const { login, signup } = useApp();
  const [tab, setTab] = useState<"signup" | "login">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showGift, setShowGift] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (tab === "signup" && !name.trim()) e.name = "Name is required";
    if (!email.includes("@")) e.email = "Enter a valid email";
    if (password.length < 6) e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (tab === "signup") {
        await signup(email, password, name);
        setShowGift(true);
      } else {
        await login(email, password);
        toast.success("Successfully logged in");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <h1 className="font-headline text-4xl font-bold text-foreground">Callit</h1>
          <p className="text-sm text-muted-foreground font-body mt-2">
            The prediction market for opinions everyone has.
          </p>
        </div>

        <div className="flex bg-secondary rounded-full p-1 mb-8">
          {(["signup", "login"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 font-body capitalize ${tab === t
                ? "bg-gold text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {t === "signup" ? "Sign Up" : "Log In"}
            </button>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 space-y-4">
          <AnimatePresence mode="wait">
            {tab === "signup" && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 font-body">
                    Display Name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="What should we call you?"
                    className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
                  />
                  {errors.name && (
                    <p className="text-[11px] text-destructive mt-1 font-body">{errors.name}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 font-body">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
            />
            {errors.email && (
              <p className="text-[11px] text-destructive mt-1 font-body">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 font-body">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
            />
            {errors.password && (
              <p className="text-[11px] text-destructive mt-1 font-body">{errors.password}</p>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-2 rounded-full bg-gold py-3.5 text-sm font-semibold text-primary-foreground hover:bg-gold-hover transition-colors animate-gold-pulse disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : tab === "signup"
                ? "Create Account"
                : "Log In"}
          </motion.button>

          {tab === "signup" && (
            <p className="text-[11px] text-muted-foreground text-center font-body">
              By signing up you agree to our Terms and Privacy Policy
            </p>
          )}

          {tab === "login" && (
            <button className="text-xs text-gold hover:text-gold-hover transition-colors w-full text-center font-body">
              Forgot password?
            </button>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6 font-body">
          {tab === "signup" ? "Already have an account? " : "New here? "}
          <button
            onClick={() => setTab(tab === "signup" ? "login" : "signup")}
            className="text-gold font-semibold hover:text-gold-hover transition-colors"
          >
            {tab === "signup" ? "Log in" : "Sign up free"}
          </button>
        </p>
      </motion.div>

      <AnimatePresence>
        {showGift && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {coinParticles.map((p, i) => (
                <CoinParticle key={i} delay={p.delay} x={p.x} />
              ))}
            </div>

            <div className="relative z-10 text-center space-y-6 px-6 max-w-md w-full">
              <motion.h1
                className="font-headline text-4xl sm:text-5xl text-foreground"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                You're in.
              </motion.h1>

              <motion.p
                className="font-headline text-5xl sm:text-6xl font-bold text-gold"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
              >
                Welcome, {name || "caller"} 🔥
              </motion.p>

              <motion.p
                className="text-sm font-body text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                Your opinions matter here. Start calling!
              </motion.p>

              <motion.button
                onClick={() => {
                  setShowGift(false);
                  navigate("/");
                }}
                className="w-full rounded-full bg-gold py-3.5 text-base font-semibold text-primary-foreground hover:bg-gold-hover transition-colors animate-gold-pulse"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
              >
                Make My First Call
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Auth;