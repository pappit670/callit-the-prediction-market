import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { supabase } from "@/supabaseClient"; // fixed import

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

const Auth = () => {
  const navigate = useNavigate();
  const { setUser } = useApp(); // no setIsLoggedIn
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
        const { data: supaUser, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: name } },
        });
        if (signUpError) throw signUpError;

        // Give initial 1000 coins in profiles table
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: supaUser.user?.id,
            username: name,
            balance: 1000,
          })
          .select()
          .single();
        if (profileError) throw profileError;

        // Update context
        setUser({
          username: profile.username,
          displayName: profile.username,
          initials: profile.username.slice(0, 2).toUpperCase(),
          bio: profile.bio || "Calling it like I see it",
          balance: profile.balance || 1000,
          joinDate: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          wins: profile.wins || 0,
          losses: profile.losses || 0,
          total_calls: profile.total_calls || 0,
          avatar: profile.avatar_url || "",
        });

        setShowGift(true);
      } else {
        const { data: loginUser, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError) throw loginError;

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", loginUser.user?.id)
          .single();
        if (profileError) throw profileError;

        setUser({
          username: profile.username,
          displayName: profile.username,
          initials: profile.username.slice(0, 2).toUpperCase(),
          bio: profile.bio || "Calling it like I see it",
          balance: profile.balance || 0,
          joinDate: new Date(profile.created_at).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
          wins: profile.wins || 0,
          losses: profile.losses || 0,
          total_calls: profile.total_calls || 0,
          avatar: profile.avatar_url || "",
        });

        toast.success("Successfully logged in");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      {/* your signup/login form UI goes here unchanged */}
      {/* Coin gift modal remains unchanged */}
    </div>
  );
};

export default Auth;