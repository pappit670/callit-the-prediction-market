import { useState, useEffect } from "react";
import { Search, Menu, X, User, Bookmark, List, Bell, Settings, HelpCircle, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/supabaseClient";

const tickerItems = [
  "US Fed expected to cut rates by 25bps next month",
  "Bitcoin surges past $95k following institutional adoption",
  "Tech giants announce new AI safety standards agreement",
  "Local markets show resilience amid global volatility"
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [navTopics, setNavTopics] = useState<any[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, user, logout, hasSeenHero, theme, toggleTheme } = useApp();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    supabase
      .from("topics")
      .select("name, slug, icon")
      .eq("type", "category")
      .eq("active", true)
      .order("name")
      .then(({ data }) => {
        if (data) setNavTopics(data);
      });
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const query = e.currentTarget.value;
      if (query.trim()) {
        toast(`Searching for: ${query}`);
        e.currentTarget.value = "";
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsDrawerOpen(false);
    navigate("/");
    toast("Logged out successfully");
  };

  const drawerLinks = [
    { name: "Profile", icon: <User className="h-5 w-5" />, path: "/profile" },
    { name: "Saved Calls", icon: <Bookmark className="h-5 w-5" />, path: "/saved-calls" },
    { name: "My Calls", icon: <List className="h-5 w-5" />, path: "/my-calls" },
    { name: "Notifications", icon: <Bell className="h-5 w-5" />, path: "/notifications" },
    { name: "Settings", icon: <Settings className="h-5 w-5" />, path: "/settings" },
    { name: "Help Center", icon: <HelpCircle className="h-5 w-5" />, path: "/help-center" },
  ];

  return (
    <>
      <motion.nav
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled || hasSeenHero ? "bg-background border-b border-border shadow-sm" : "bg-transparent"
          }`}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {!hasSeenHero ? (
          <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-center px-4">
            <Link to="/" className="font-headline text-3xl font-bold tracking-tight text-foreground hover:text-gold transition-colors">
              Callit
            </Link>
          </div>
        ) : (
          <>
            {/* Top Header Row */}
            <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 md:px-6 gap-4">

              {/* Logo */}
              <Link to="/" className="font-headline text-2xl font-bold tracking-tight text-foreground select-none shrink-0 hover:text-gold transition-colors">
                Callit
              </Link>

              {/* Search */}
              <div className="hidden md:flex items-center justify-start flex-1 max-w-[320px]">
                <div className="relative w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search calls..."
                    onKeyDown={handleSearch}
                    className="w-full rounded-full border border-border bg-secondary/30 pl-11 pr-4 py-2 text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 transition-all"
                  />
                </div>
              </div>

              {/* Ticker */}
              <div className="hidden lg:flex flex-1 max-w-[280px] items-center gap-3 overflow-hidden bg-secondary/20 rounded-full px-3 py-1.5 border border-border/50">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Live</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <motion.div
                    className="whitespace-nowrap flex gap-8"
                    animate={{ x: [0, -1000] }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                  >
                    {Array(5).fill(tickerItems).flat().map((item, i) => (
                      <span key={i} className="text-[12px] font-medium text-foreground/80">{item}</span>
                    ))}
                  </motion.div>
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center justify-end gap-3 shrink-0">
                {!isLoggedIn ? (
                  <div className="flex items-center gap-3">
                    <Link to="/how-it-works" className="hidden sm:block text-xs font-bold text-muted-foreground hover:text-gold transition-colors uppercase tracking-wider">
                      How it works
                    </Link>
                    <Link to="/auth" className="rounded-full border border-border px-4 py-1.5 text-xs font-bold hover:border-gold hover:text-gold transition-all">
                      Log In
                    </Link>
                    <Link to="/auth" className="rounded-full bg-gold text-primary-foreground px-4 py-1.5 text-xs font-bold hover:bg-gold-hover transition-all">
                      Sign Up
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-full border border-border mr-2">
                      <span className="text-gold text-sm font-bold">🪙 {user.balance.toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => navigate("/notifications")}
                      className="p-2 text-muted-foreground hover:text-gold transition-colors relative"
                    >
                      <Bell className="h-5 w-5" />
                      <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-gold rounded-full border-2 border-background"></span>
                    </button>
                    <Link to="/call-it" className="hidden md:flex rounded-full bg-gold text-primary-foreground px-5 py-1.5 text-sm font-bold hover:bg-gold-hover transition-all animate-gold-pulse">
                      Call It
                    </Link>
                    <Link to="/profile" className="flex items-center gap-2 group ml-1">
                      <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-muted-foreground group-hover:border-gold transition-colors overflow-hidden">
                        {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : user.initials}
                      </div>
                    </Link>
                  </div>
                )}
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="p-1.5 text-foreground hover:text-gold transition-colors bg-secondary/50 rounded-lg ml-1"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Topic Navigation Bar — real Supabase topics */}
            <div className="w-full border-t border-border bg-background">
              <div className="mx-auto max-w-7xl px-4 md:px-6">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
                  {/* Trending always first */}
                  <button
                    onClick={() => navigate("/topic/trending")}
                    className={`whitespace-nowrap text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${location.pathname === "/topic/trending"
                        ? "bg-gold text-primary-foreground"
                        : "text-muted-foreground hover:text-gold hover:bg-gold/10"
                      }`}
                  >
                    🔥 Trending
                  </button>

                  {navTopics.map((topic) => (
                    <button
                      key={topic.slug}
                      onClick={() => navigate(`/topic/${topic.slug}`)}
                      className={`whitespace-nowrap text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${location.pathname === `/topic/${topic.slug}`
                          ? "bg-gold text-primary-foreground"
                          : "text-muted-foreground hover:text-gold hover:bg-gold/10"
                        }`}
                    >
                      {topic.icon} {topic.name}
                    </button>
                  ))}

                  {/* All Topics link */}
                  <button
                    onClick={() => navigate("/topics")}
                    className="whitespace-nowrap text-sm font-medium px-3 py-1.5 rounded-full text-muted-foreground hover:text-gold hover:bg-gold/10 transition-colors ml-2 border border-border"
                  >
                    All Topics →
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </motion.nav>

      {/* SIDEBAR DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-full max-w-sm bg-card border-l border-border shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="font-headline text-2xl font-bold">Menu</h2>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 -mr-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 px-4">
                {isLoggedIn ? (
                  <div className="space-y-1">
                    {drawerLinks.map((link) => (
                      <Link
                        key={link.name}
                        to={link.path}
                        className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-foreground font-semibold hover:bg-secondary hover:text-gold transition-colors group"
                      >
                        <span className="text-muted-foreground group-hover:text-gold transition-colors">{link.icon}</span>
                        {link.name}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 px-4 pb-8 border-b border-border mb-6">
                    <p className="text-sm text-muted-foreground text-center mb-2">Sign in to validate opinions and track your calls.</p>
                    <Link to="/auth" className="w-full py-3.5 rounded-full bg-gold text-primary-foreground font-bold text-center hover:bg-gold-hover transition-colors">
                      Log In
                    </Link>
                    <Link to="/auth" className="w-full py-3.5 rounded-full border border-border bg-background text-foreground font-bold text-center hover:border-gold hover:text-gold transition-colors">
                      Sign Up
                    </Link>
                  </div>
                )}

                {/* Topics in drawer */}
                <div className="mt-6">
                  <div className="px-4 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Topics</span>
                  </div>
                  <button
                    onClick={() => navigate("/topic/trending")}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-muted-foreground font-medium hover:bg-secondary hover:text-gold transition-colors"
                  >
                    🔥 Trending
                  </button>
                  {navTopics.map((topic) => (
                    <button
                      key={topic.slug}
                      onClick={() => navigate(`/topic/${topic.slug}`)}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-muted-foreground font-medium hover:bg-secondary hover:text-gold transition-colors"
                    >
                      {topic.icon} {topic.name}
                    </button>
                  ))}
                </div>

                <div className="space-y-1 mt-6 border-t border-border pt-6">
                  <div className="px-4 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resources</span>
                  </div>
                  <Link to="/how-it-works" className="flex items-center px-4 py-3 rounded-xl text-muted-foreground font-medium hover:bg-secondary hover:text-foreground transition-colors">
                    How Callit Works
                  </Link>
                </div>

                <div className="px-4 pb-2 pt-6 border-t border-border mt-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Appearance</span>
                </div>
                <div className="px-4 py-2 flex items-center justify-between">
                  <span className="text-sm font-semibold">Dark Mode</span>
                  <button
                    onClick={toggleTheme}
                    className={`h-6 w-11 rounded-full p-1 transition-colors relative ${theme === "dark" ? "bg-gold" : "bg-muted"}`}
                  >
                    <motion.div
                      animate={{ x: theme === "dark" ? 20 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="h-4 w-4 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>
              </div>

              {isLoggedIn && (
                <div className="p-6 border-t border-border bg-background">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-destructive font-semibold hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    Log Out
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;