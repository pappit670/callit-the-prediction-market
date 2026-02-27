import { useState, useEffect } from "react";
import { Search, Bell, ChevronDown, Coins, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "glass-nav" : "bg-background border-b border-border"
      }`}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link to="/" className="font-headline text-xl font-bold tracking-tight text-foreground select-none">
          Callit
        </Link>

        {/* Search */}
        <div className="hidden md:flex items-center mx-6 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="What are people calling?"
              className="w-full rounded-full border border-border bg-secondary pl-10 pr-4 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/40 transition-all"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Link to="/portfolio" className="hidden lg:inline text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
            Portfolio
          </Link>

          {/* Coin balance */}
          <div className="hidden sm:flex items-center gap-1.5 text-gold font-semibold text-sm">
            <Coins className="h-4 w-4" />
            <span>2,500</span>
          </div>

          {/* Deposit */}
          <div className="hidden lg:flex items-center gap-1.5 relative">
            <button className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Wallet className="h-3.5 w-3.5" />
              Deposit
            </button>
            <span className="absolute -top-2 -right-3 rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground leading-none">
              Soon
            </span>
          </div>

          {/* Bell */}
          <button className="relative p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-gold" />
          </button>

          {/* Call It CTA */}
          <button
            onClick={() => navigate("/call-it")}
            className="rounded-full bg-gold px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-gold-hover transition-colors"
          >
            Call It
          </button>

          {/* Avatar */}
          <button className="flex items-center gap-1">
            <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-semibold text-muted-foreground">
              JD
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
