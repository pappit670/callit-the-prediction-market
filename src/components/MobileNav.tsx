import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Compass, PlusCircle, BarChart2, User } from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Compass, label: "Explore", path: "/leaderboard" },
  { icon: PlusCircle, label: "Call It", path: "/call-it", highlight: true },
  { icon: BarChart2, label: "Portfolio", path: "/portfolio" },
  { icon: User, label: "Profile", path: "/profile" },
];

const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-card/95 backdrop-blur-md">
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-0.5 flex-1 py-1 relative"
            >
              {item.highlight ? (
                <div className="h-12 w-12 rounded-full bg-gold flex items-center justify-center shadow-lg -mt-5">
                  <item.icon className="h-5 w-5 text-primary-foreground" />
                </div>
              ) : (
                <item.icon
                  className={`h-5 w-5 transition-colors ${isActive ? "text-gold" : "text-muted-foreground"}`}
                />
              )}
              <span
                className={`text-[10px] font-medium font-body transition-colors ${
                  item.highlight
                    ? "text-gold mt-0.5"
                    : isActive
                    ? "text-gold"
                    : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>

              {isActive && !item.highlight && (
                <motion.div
                  layoutId="mobile-nav-dot"
                  className="absolute top-1 h-1 w-1 rounded-full bg-gold"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
