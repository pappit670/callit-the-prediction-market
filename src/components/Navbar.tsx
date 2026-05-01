import { useState, useEffect } from "react";
import { Search, Menu, X, User, Bookmark, List, Bell, Settings, HelpCircle, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { SlidingNumber } from "@/components/ui/sliding-number";
import { SearchModal } from "@/components/SearchModal";

const NAV_TOPICS = [
  { label: "Politics", slug: "politics" },
  { label: "Sports", slug: "sports" },
  { label: "Crypto", slug: "crypto-bitcoin" },
  { label: "Business", slug: "business" },
  { label: "Tech", slug: "tech" },
  { label: "Entertainment", slug: "entertainment" },
  { label: "World", slug: "world" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, user, logout, hasSeenHero, theme, toggleTheme } = useApp();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setIsDrawerOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    setIsDrawerOpen(false);
    setShowProfilePopover(false);
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

  const profileMenuItems = [
    { label: "View Profile", path: "/profile" },
    { label: "My Calls", path: "/my-calls" },
    { label: "Portfolio", path: "/portfolio" },
    { label: "Saved Calls", path: "/saved-calls" },
    { label: "Settings", path: "/settings" },
  ];

  return (
    <>
      <motion.nav
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled || hasSeenHero ? "bg-background border-b border-border shadow-sm" : "bg-transparent"
          }`}
        initial={{ y: -80 }} animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {!hasSeenHero ? (
          <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-center px-4">
            <Link to="/" className="font-headline text-3xl font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity">
              Callit
            </Link>
          </div>
        ) : (
          <>
            {/* ── Main bar ── */}
            <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 md:px-6 gap-4">
              <Link to="/"
                className="font-headline text-2xl font-bold tracking-tight text-foreground select-none shrink-0 hover:opacity-80 transition-opacity">
                Callit
              </Link>

              {/* Search button — opens SearchModal */}
              <div className="hidden md:flex items-center justify-start max-w-[240px] xl:max-w-[320px] w-full">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="w-full flex items-center gap-3 rounded-full border border-border bg-secondary/30 px-4 py-2 text-[14px] text-muted-foreground hover:border-foreground/30 hover:bg-secondary/50 transition-all text-left">
                  <Search className="h-[18px] w-[18px] shrink-0" />
                  <span>Search calls...</span>
                </button>
              </div>

              {/* Inline Breaking News Ticker */}
              <div className="hidden lg:flex flex-1 max-w-[280px] h-9 items-center bg-secondary/30 border border-border rounded-full px-3 overflow-hidden">
                <div className="flex items-center gap-2 shrink-0 pr-3 border-r border-border/50">
                  <div className="h-2 w-2 rounded-full bg-[#DC2626] animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Live</span>
                </div>
                <div className="flex-1 overflow-hidden relative ml-3 flex items-center">
                  <div className="whitespace-nowrap animate-ticker text-xs font-semibold text-foreground/80">
                    Senate passes AI regulation bill • Bitcoin crosses $90k milestone • Kenya Supreme Court ruling expected today
                  </div>
                </div>
              </div>

              {/* Right actions */}
              <div className="flex items-center justify-end gap-3 shrink-0 ml-auto">
                {!isLoggedIn ? (
                  <div className="flex items-center gap-3">
                    <Link to="/auth"
                      className="rounded-full border border-border px-4 py-1.5 text-xs font-bold hover:border-foreground/40 hover:text-foreground transition-all">
                      Log In
                    </Link>
                    <Link to="/auth"
                      className="rounded-full bg-foreground text-background px-4 py-1.5 text-xs font-bold hover:brightness-110 transition-all">
                      Sign Up
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {/* Theme Toggle */}
                    <button onClick={toggleTheme} className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors mr-1">
                      {theme === 'dark' ? '☀️' : '🌙'}
                    </button>

                    {/* Notifications */}
                    <button onClick={() => navigate("/notifications")}
                      className="p-2 text-muted-foreground hover:text-foreground transition-colors relative">
                      <Bell className="h-5 w-5" />
                      <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-foreground rounded-full border-2 border-background" />
                    </button>

                    {/* Call It CTA */}
                    <Link to="/call-it"
                      className="hidden md:flex rounded-full bg-foreground text-background px-5 py-1.5 text-sm font-bold hover:brightness-110 transition-all">
                      Call It
                    </Link>

                    {/* Profile popover */}
                    <div className="relative ml-1"
                      onMouseEnter={() => setShowProfilePopover(true)}
                      onMouseLeave={() => setShowProfilePopover(false)}>
                      <button className="flex items-center group">
                        <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-muted-foreground group-hover:border-foreground/40 transition-colors overflow-hidden">
                          {user.avatar
                            ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                            : user.initials || "?"}
                        </div>
                      </button>

                      <AnimatePresence>
                        {showProfilePopover && (
                          <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.97 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-10 w-64 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden"
                          >
                            <div className="p-4 border-b border-border">
                              <div className="flex items-center gap-3">
                                <div className="h-11 w-11 rounded-full bg-secondary border-2 border-border flex items-center justify-center text-sm font-bold text-foreground flex-shrink-0 overflow-hidden">
                                  {user.avatar
                                    ? <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                                    : user.initials || "?"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-foreground truncate">{user.username || "Caller"}</p>
                                  <p className="text-xs text-muted-foreground">{user.joinDate}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
                                {[
                                  { val: user.wins || 0, label: "Wins", cls: "text-[#22C55E]" },
                                  { val: user.losses || 0, label: "Losses", cls: "text-destructive" },
                                  { val: user.total_calls || 0, label: "Calls", cls: "text-foreground" },
                                ].map(s => (
                                  <div key={s.label} className="text-center">
                                    <div className={`text-sm font-bold ${s.cls} flex items-center justify-center`}>
                                      <SlidingNumber value={s.val} />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="p-2">
                              {profileMenuItems.map(item => (
                                <button key={item.path}
                                  onClick={() => { navigate(item.path); setShowProfilePopover(false); }}
                                  className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-xl transition-colors">
                                  {item.label}
                                </button>
                              ))}
                            </div>
                            <div className="p-2 border-t border-border">
                              <button onClick={handleLogout}
                                className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-xl transition-colors font-semibold flex items-center gap-2">
                                <LogOut className="h-4 w-4" /> Log Out
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                <button onClick={() => setIsDrawerOpen(true)}
                  className="p-1.5 text-foreground hover:opacity-70 transition-opacity bg-secondary/50 rounded-lg ml-1">
                  <Menu className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* ── Second bar — text-only category topics, NO icons ── */}
            <div className="w-full border-t border-border bg-background">
              <div className="mx-auto max-w-7xl px-4 md:px-6">
                <div className="flex items-center gap-0.5 overflow-x-auto py-1.5" style={{ scrollbarWidth: "none" }}>
                  {NAV_TOPICS.map(t => (
                    <button key={t.slug}
                      onClick={() => navigate(`/topic/${t.slug}`)}
                      className={`whitespace-nowrap text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${location.pathname === `/topic/${t.slug}`
                          ? "text-foreground bg-secondary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        }`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </motion.nav>

      {/* ── Side drawer ── */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-full max-w-sm bg-card border-l border-border shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="font-headline text-2xl font-bold">Menu</h2>
                <button onClick={() => setIsDrawerOpen(false)}
                  className="p-2 -mr-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-all">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 px-4">
                {isLoggedIn ? (
                  <>
                    <div className="flex items-center gap-3 px-4 pb-5 mb-4 border-b border-border">
                      <div className="h-11 w-11 rounded-full bg-secondary border-2 border-border flex items-center justify-center text-sm font-bold text-foreground flex-shrink-0">
                        {user.initials || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground truncate">{user.username}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <SlidingNumber value={user.wins || 0} /> wins · <SlidingNumber value={user.losses || 0} /> losses
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {drawerLinks.map(link => (
                        <Link key={link.name} to={link.path}
                          className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-foreground font-semibold hover:bg-secondary transition-colors group">
                          <span className="text-muted-foreground group-hover:text-foreground transition-colors">{link.icon}</span>
                          {link.name}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-4 px-4 pb-8 border-b border-border mb-6">
                    <p className="text-sm text-muted-foreground text-center mb-2">
                      Sign in to validate opinions and track your calls.
                    </p>
                    <Link to="/auth"
                      className="w-full py-3.5 rounded-full bg-foreground text-background font-bold text-center hover:brightness-110 transition-all">
                      Log In
                    </Link>
                    <Link to="/auth"
                      className="w-full py-3.5 rounded-full border border-border bg-background text-foreground font-bold text-center hover:border-foreground/40 transition-all">
                      Sign Up
                    </Link>
                  </div>
                )}

                <div className="space-y-1 mt-6 border-t border-border pt-6">
                  <div className="px-4 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resources</span>
                  </div>
                  <Link to="/how-it-works"
                    className="flex items-center px-4 py-3 rounded-xl text-muted-foreground font-medium hover:bg-secondary hover:text-foreground transition-colors">
                    How Callit Works
                  </Link>
                </div>

                <div className="px-4 pb-2 pt-6 border-t border-border mt-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Appearance</span>
                </div>
                <div className="px-4 py-2 flex items-center justify-between">
                  <span className="text-sm font-semibold">Dark Mode</span>
                  <button onClick={toggleTheme}
                    className={`h-6 w-11 rounded-full p-1 transition-colors relative ${theme === "dark" ? "bg-foreground" : "bg-muted"}`}>
                    <motion.div animate={{ x: theme === "dark" ? 20 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="h-4 w-4 bg-background rounded-full shadow-sm" />
                  </button>
                </div>

                {/* Mobile search */}
                <div className="mt-6 border-t border-border pt-6 px-4">
                  <button onClick={() => { setIsDrawerOpen(false); setSearchOpen(true); }}
                    className="w-full flex items-center gap-3 rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground hover:border-foreground/30 transition-all">
                    <Search className="h-4 w-4 shrink-0" />
                    <span>Search calls...</span>
                  </button>
                </div>
              </div>

              {isLoggedIn && (
                <div className="p-6 border-t border-border bg-background">
                  <button onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-destructive font-semibold hover:bg-destructive/10 transition-colors">
                    <LogOut className="h-5 w-5" /> Log Out
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search modal */}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
};

export default Navbar;