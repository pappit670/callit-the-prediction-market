import { Link } from "react-router-dom";
import { Twitter, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full border-t border-border bg-background py-10 px-4 md:px-6 relative z-10">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        
        {/* Brand & Tagline */}
        <div className="flex flex-col gap-2">
          <Link to="/" className="font-headline text-3xl font-bold tracking-tight text-foreground select-none">
            Callit
          </Link>
          <p className="font-body text-sm font-medium text-muted-foreground">
            My opinion. My call. My validation.
          </p>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-6 font-body text-sm font-medium text-foreground">
          <Link to="#" className="hover:text-gold transition-colors">About</Link>
          <Link to="#" className="hover:text-gold transition-colors">How It Works</Link>
          <Link to="#" className="hover:text-gold transition-colors">Terms</Link>
          <Link to="#" className="hover:text-gold transition-colors">Privacy</Link>
        </div>

        {/* Social Icons */}
        <div className="flex items-center gap-4">
          <a href="#" className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-gold/20 transition-all">
            <Twitter className="h-4 w-4" />
          </a>
          <a href="#" className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-gold/20 transition-all">
            <Instagram className="h-4 w-4" />
          </a>
          <a href="#" className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-gold/20 transition-all">
            <Linkedin className="h-4 w-4" />
          </a>
        </div>
        
      </div>
      
      <div className="mx-auto max-w-7xl mt-8 pt-6 border-t border-border/50 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Callit. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
