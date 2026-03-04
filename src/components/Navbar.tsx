import { useState, useEffect } from "react";
import { Search, Bell, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const headlines = [
  "Harambee Stars confirm squad for AFCON qualifiers",
  "CBK holds interest rates steady",
  "Nairobi traffic: major jam on Mombasa Road",
  "KPL matchday results in",
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tickerContent = headlines.map((h, i) => (
    <span
      key={i}
      onClick={() => navigate("/call-it")}
      className="cursor-pointer hover:text-gold transition-colors whitespace-nowrap"
    >
      {h} <span className="mx-3 text-muted-foreground">·</span>
    </span>
  ));

  return (
    <motion.nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "glass-nav" : "bg-background border-b border-border"
      }`}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link to="/" className="font-headline text-xl font-bold tracking-tight text-foreground select-none shrink-0">
          Callit
        </Link>

        {/* Search */}
        <div className="hidden md:flex items-center mx-4 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="What are people calling?"
              className="w-full rounded-full border border-border bg-secondary pl-10 pr-4 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/40 transition-all"
            />
          </div>
        </div>

        {/* Inline breaking news ticker */}
        <div className="hidden lg:flex items-center max-w-[280px] overflow-hidden shrink-0 mx-2">
          <span className="relative flex h-2 w-2 shrink-0 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(0,84%,60%)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(0,84%,60%)]" />
          </span>
          <div className="flex-1 overflow-hidden">
            <div className="flex animate-ticker text-xs text-muted-foreground">
              <div className="flex shrink-0">{tickerContent}</div>
              <div className="flex shrink-0">{tickerContent}</div>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle />

          <button className="relative p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-gold" />
          </button>

          <button
            onClick={() => navigate("/call-it")}
            className="rounded-full bg-gold px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-gold-hover transition-colors"
          >
            Call It
          </button>

          <Link to="/profile" className="flex items-center gap-1">
            <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-semibold text-muted-foreground">
              JD
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
