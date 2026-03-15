import { Link } from "react-router-dom";
import { Twitter, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full border-t border-border bg-background py-10 px-4 md:px-6 relative z-10">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="flex flex-col gap-2">
          <Link to="/" className="font-headline text-3xl font-bold tracking-tight text-foreground">Callit</Link>
          <p className="text-sm font-medium text-muted-foreground">My opinion. My call. My validation.</p>
        </div>

        <div className="flex items-center gap-6 text-sm font-medium text-foreground flex-wrap">
          <Link to="/how-it-works" className="hover:text-gold transition-colors">How It Works</Link>
          <Link to="/topics" className="hover:text-gold transition-colors">Topics</Link>
          <Link to="/leaderboard" className="hover:text-gold transition-colors">Leaderboard</Link>
          <Link to="/terms" className="hover:text-gold transition-colors">Terms</Link>
          <Link to="/privacy" className="hover:text-gold transition-colors">Privacy</Link>
          <Link to="/help-center" className="hover:text-gold transition-colors">Help</Link>
        </div>

        <div className="flex items-center gap-4">
          <a href="https://twitter.com/callitapp_" target="_blank" rel="noopener noreferrer"
            className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-gold/20 transition-all">
            <Twitter className="h-4 w-4" />
          </a>
          <a href="https://instagram.com/callitapp_" target="_blank" rel="noopener noreferrer"
            className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-gold/20 transition-all">
            <Instagram className="h-4 w-4" />
          </a>
          <a href="https://linkedin.com/company/callitapp" target="_blank" rel="noopener noreferrer"
            className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-gold/20 transition-all">
            <Linkedin className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-7xl mt-8 pt-6 border-t border-border/50 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Callit. All rights reserved. · Built in Nairobi 🇰🇪
        </p>
      </div>
    </footer>
  );
};

export default Footer;