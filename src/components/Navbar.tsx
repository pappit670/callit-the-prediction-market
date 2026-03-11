import { useState, useEffect } from "react";
import { Search, Menu, X, User, Bookmark, List, Bell, Settings, HelpCircle, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";

const topics = [
  "Local (KE Trending)", "Breaking", "Sports", "Crypto", "Tech",
  "Politics", "Culture", "Economy", "Science", "Markets"
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, user, logout } = useApp();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const query = e.currentTarget.value;
      if (query.trim()) {
        toast(`Searching for: ${query}`);
        e.currentTarget.value = "";
      }
    }
  };

  const handleLogout = () => {
    logout();
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
        className={`sticky top-0 z-50 w-full transition-all duration-300 bg-background border-b border-border ${
          scrolled ? "shadow-sm" : ""
        }`}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Top Header Row */}
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 md:px-6">
          
          {/* Left side: Logo */}
          <Link to="/" className="font-headline text-2xl font-bold tracking-tight text-foreground select-none shrink-0 w-[140px] hover:text-gold transition-colors">
            Callit
          </Link>

          {/* Center: Search */}
          <div className="hidden md:flex items-center justify-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground" />
              <input
                type="text"
                placeholder="What are people calling?"
                onKeyDown={handleSearch}
                className="w-full rounded-full border border-border bg-secondary/50 pl-12 pr-4 py-2.5 text-[15px] font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
              />
            </div>
          </div>

          {/* Right side navigation */}
          <div className="flex items-center justify-end gap-3 sm:gap-5 shrink-0 w-auto">
            <Link to="/how-it-works" className="hidden lg:block text-sm font-semibold text-muted-foreground hover:text-gold transition-colors pr-2">
              How It Works
            </Link>
            
            {!isLoggedIn ? (
              <>
                <Link to="/auth" className="hidden md:block text-sm font-semibold text-foreground hover:text-gold transition-colors">
                  Log In
                </Link>
                <Link to="/auth" className="hidden md:block rounded-full bg-foreground text-background px-4 py-1.5 text-sm font-semibold hover:bg-gold hover:text-primary-foreground transition-all">
                  Sign Up
                </Link>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-3 pr-2">
                <Link to="/profile" className="flex items-center gap-2 group">
                  <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-muted-foreground group-hover:border-gold transition-colors">
                    {user.initials}
                  </div>
                  <span className="text-sm font-bold text-foreground group-hover:text-gold transition-colors">
                    {user.balance.toLocaleString()} <span className="text-muted-foreground font-normal">coins</span>
                  </span>
                </Link>
              </div>
            )}

            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="p-1.5 text-foreground hover:text-gold transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Topic Navigation Bar */}
        <div className="w-full border-t border-border bg-background">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-2.5">
              {topics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => {
                    toast(`Filtering by topic: ${topic}`);
                    navigate("/call-it");
                  }}
                  className="whitespace-nowrap text-sm font-medium text-muted-foreground hover:text-gold transition-colors py-1 cursor-pointer"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ── SIDEBAR DRAWER ── */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm"
            />
            
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-full max-w-sm bg-card border-l border-border shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="font-headline text-2xl font-bold">Menu</h2>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 -mr-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto py-6 px-4">
                {isLoggedIn ? (
                  <div className="space-y-1">
                    {drawerLinks.map((link) => (
                      <Link
                        key={link.name}
                        to={link.path}
                        className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-foreground font-body font-semibold hover:bg-secondary hover:text-gold transition-colors group"
                      >
                        <span className="text-muted-foreground group-hover:text-gold transition-colors">{link.icon}</span>
                        {link.name}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 px-4 pb-8 border-b border-border mb-6">
                    <p className="text-sm text-muted-foreground font-body text-center mb-2">Sign in to validate opinions and track your calls.</p>
                    <Link 
                      to="/auth" 
                      className="w-full py-3.5 rounded-full bg-gold text-primary-foreground font-bold font-body text-center hover:bg-gold-hover transition-colors shadow-lg"
                    >
                      Log In
                    </Link>
                    <Link 
                      to="/auth" 
                      className="w-full py-3.5 rounded-full border border-border bg-background text-foreground font-bold font-body text-center hover:border-gold hover:text-gold transition-colors"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
                
                {/* Public links always shown */}
                <div className="space-y-1 mt-6">
                  <div className="px-4 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resources</span>
                  </div>
                  <Link to="/how-it-works" className="flex items-center px-4 py-3 rounded-xl text-muted-foreground font-body font-medium hover:bg-secondary hover:text-foreground transition-colors">
                    How Callit Works
                  </Link>
                  <Link to="/about" className="flex items-center px-4 py-3 rounded-xl text-muted-foreground font-body font-medium hover:bg-secondary hover:text-foreground transition-colors">
                    About Us
                  </Link>
                </div>
              </div>
              
              {/* Drawer Footer */}
              {isLoggedIn && (
                <div className="p-6 border-t border-border bg-background">
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-destructive font-body font-semibold hover:bg-destructive/10 transition-colors"
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
