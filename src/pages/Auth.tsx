import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, ArrowLeft, Mail, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { supabase } from "@/supabaseClient";

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

type AuthStep = "auth" | "verify-email" | "verify-otp";

const Auth = () => {
  const navigate = useNavigate();
  const { setUser } = useApp();
  const [tab, setTab] = useState<"signup" | "login">("signup");
  const [step, setStep] = useState<AuthStep>("auth");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showGift, setShowGift] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
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
        const { data: supaUser, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: name } },
        });
        if (signUpError) throw signUpError;

        if (supaUser.user && !supaUser.user.confirmed_at) {
          // Email confirmation required — show OTP screen
          setStep("verify-email");
          toast.success("Check your email for a confirmation code!");
        } else {
          // Email confirmation not required (dev mode)
          await createProfile(supaUser.user?.id!, name);
        }

      } else {
        const { data: loginUser, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError) {
          if (loginError.message.includes("Email not confirmed")) {
            // Resend OTP and show verify screen
            await supabase.auth.resend({ type: "signup", email });
            setStep("verify-email");
            toast.info("Please verify your email first. A new code was sent!");
          } else {
            throw loginError;
          }
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles").select("*").eq("id", loginUser.user?.id).single();
        if (profileError) throw profileError;

        setUser({
          username: profile.username,
          displayName: profile.username,
          initials: profile.username.slice(0, 2).toUpperCase(),
          bio: profile.bio || "Calling it like I see it",
          balance: profile.balance || 0,
          joinDate: new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          wins: profile.wins || 0,
          losses: profile.losses || 0,
          total_calls: profile.total_calls || 0,
          avatar: profile.avatar_url || "",
        });

        toast.success("Welcome back!");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) { toast.error("Enter the 6-digit code"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });
      if (error) throw error;

      if (tab === "signup") {
        await createProfile(data.user?.id!, name);
      } else {
        const { data: profile } = await supabase
          .from("profiles").select("*").eq("id", data.user?.id).single();
        if (profile) {
          setUser({
            username: profile.username,
            displayName: profile.username,
            initials: profile.username.slice(0, 2).toUpperCase(),
            bio: profile.bio || "Calling it like I see it",
            balance: profile.balance || 0,
            joinDate: new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
            wins: profile.wins || 0,
            losses: profile.losses || 0,
            total_calls: profile.total_calls || 0,
            avatar: profile.avatar_url || "",
          });
          toast.success("Welcome back!");
          navigate("/");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (userId: string, username: string) => {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: userId, username, balance: 1000 })
      .select().single();
    if (profileError) throw profileError;

    setUser({
      username: profile.username,
      displayName: profile.username,
      initials: profile.username.slice(0, 2).toUpperCase(),
      bio: profile.bio || "Calling it like I see it",
      balance: profile.balance || 1000,
      joinDate: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      wins: 0, losses: 0, total_calls: 0, avatar: "",
    });
    setShowGift(true);
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await supabase.auth.resend({ type: "signup", email });
      toast.success("New code sent to your email!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setResending(false);
    }
  };

  // OTP Verification Screen
  if (step === "verify-email") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16 relative">
        <button
          onClick={() => setStep("auth")}
          className="absolute top-6 left-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center">
              <Mail className="h-8 w-8 text-gold" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="font-headline text-3xl font-bold text-foreground mb-2">
              Check your email
            </h1>
            <p className="text-muted-foreground text-sm">
              We sent a 6-digit code to
            </p>
            <p className="text-gold font-semibold text-sm mt-1">{email}</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Confirmation Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={8}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="00000000"
                className="w-full rounded-lg border border-border bg-secondary px-4 py-4 text-3xl font-bold text-center text-foreground tracking-[0.5em] placeholder:text-muted-foreground/30 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleVerifyOtp}
              disabled={loading || otp.length < 8}
              className="w-full rounded-full bg-gold py-3.5 text-sm font-semibold text-primary-foreground hover:bg-gold-hover transition-colors animate-gold-pulse disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <KeyRound className="h-4 w-4" />
              {loading ? "Verifying..." : "Verify & Continue"}
            </motion.button>

            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">Didn't receive it?</p>
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-gold text-sm font-semibold hover:text-gold-hover transition-colors disabled:opacity-50"
              >
                {resending ? "Sending..." : "Resend code"}
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Code expires in 10 minutes
          </p>
        </motion.div>
      </div>
    );
  }

  // Main Auth Screen
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16 relative">
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <h1 className="font-headline text-4xl font-bold text-foreground">Callit</h1>
          <p className="text-sm text-muted-foreground mt-2">
            The prediction market for opinions everyone has.
          </p>
        </div>

        <div className="flex bg-secondary rounded-full p-1 mb-8">
          {(["signup", "login"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 capitalize ${tab === t
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
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Display Name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="What should we call you?"
                    className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
                  />
                  {errors.name && <p className="text-[11px] text-destructive mt-1">{errors.name}</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
            />
            {errors.email && <p className="text-[11px] text-destructive mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
            />
            {errors.password && <p className="text-[11px] text-destructive mt-1">{errors.password}</p>}
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-2 rounded-full bg-gold py-3.5 text-sm font-semibold text-primary-foreground hover:bg-gold-hover transition-colors animate-gold-pulse disabled:opacity-60"
          >
            {loading ? "Please wait..." : tab === "signup" ? "Create Account" : "Log In"}
          </motion.button>

          {tab === "signup" && (
            <p className="text-[11px] text-muted-foreground text-center">
              By signing up you agree to our{" "}
              <button onClick={() => navigate("/terms")} className="text-gold hover:underline">Terms</button>
              {" "}and{" "}
              <button onClick={() => navigate("/privacy")} className="text-gold hover:underline">Privacy Policy</button>
            </p>
          )}

          {tab === "login" && (
            <button className="text-xs text-gold hover:text-gold-hover transition-colors w-full text-center">
              Forgot password?
            </button>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {tab === "signup" ? "Already have an account? " : "New here? "}
          <button
            onClick={() => setTab(tab === "signup" ? "login" : "signup")}
            className="text-gold font-semibold hover:text-gold-hover transition-colors"
          >
            {tab === "signup" ? "Log in" : "Sign up free"}
          </button>
        </p>
      </motion.div>

      {/* Gift animation */}
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
                +<CountUp target={1000} /> coins
              </motion.p>
              <motion.p
                className="text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                Welcome, {name || "caller"}. Your opinions matter here.
              </motion.p>
              <motion.button
                onClick={() => { setShowGift(false); navigate("/"); }}
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