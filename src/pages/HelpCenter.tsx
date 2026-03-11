import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle, FileText, Bug } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";

const faqs = [
  {
    q: "How do I validate an opinion?",
    a: "Click 'Call Yes' or 'Call No' on any opinion card and stake your coins. If the crowd or event resolves in your favor, you win a portion of the pool."
  },
  {
    q: "What happens if a call is a draw?",
    a: "If an opinion resolves exactly 50/50, or an event doesn't happen by the locked deadline, the call is considered a draw. All staked coins are returned to their original callers."
  },
  {
    q: "How do I get more coins?",
    a: "You get 1,000 coins for signing up. Beyond that, the only way to earn more is by consistently making accurate calls and validating correctly."
  }
];

const HelpCenter = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <main className="mx-auto max-w-4xl px-4 md:px-6 pt-12">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-8">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Help Center
          </span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="font-headline text-4xl md:text-5xl font-bold text-foreground mb-4"
        >
          How can we help?
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="text-lg text-muted-foreground font-body max-w-2xl mb-12"
        >
          Find answers, contact our support team, or report issues on the platform.
        </motion.p>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16"
        >
          <div className="bg-secondary/30 rounded-2xl p-6 border border-border group hover:border-gold transition-colors cursor-pointer">
            <div className="h-10 w-10 bg-background rounded-full flex items-center justify-center border border-border mb-4 group-hover:bg-gold group-hover:text-primary-foreground group-hover:border-gold transition-colors">
               <FileText className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground font-body mb-2">Documentation</h3>
            <p className="text-sm text-muted-foreground font-body">Read our detailed guides on how resolutions and staking works.</p>
          </div>
          <div className="bg-secondary/30 rounded-2xl p-6 border border-border group hover:border-gold transition-colors cursor-pointer">
            <div className="h-10 w-10 bg-background rounded-full flex items-center justify-center border border-border mb-4 group-hover:bg-gold group-hover:text-primary-foreground group-hover:border-gold transition-colors">
               <MessageCircle className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground font-body mb-2">Contact Support</h3>
            <p className="text-sm text-muted-foreground font-body">Talk directly to our operations team for account issues.</p>
          </div>
          <div className="bg-secondary/30 rounded-2xl p-6 border border-border group hover:border-gold transition-colors cursor-pointer">
            <div className="h-10 w-10 bg-background rounded-full flex items-center justify-center border border-border mb-4 group-hover:bg-gold group-hover:text-primary-foreground group-hover:border-gold transition-colors">
               <Bug className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground font-body mb-2">Report a Bug</h3>
            <p className="text-sm text-muted-foreground font-body">Help us improve the prediction market platform by finding squashing bugs.</p>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="font-headline text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-gold/10 text-gold flex items-center justify-center text-sm font-bold">?</span>
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground font-body mb-3 text-lg leading-tight">{faq.q}</h3>
                <p className="text-muted-foreground font-body leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>
        
      </main>
    </div>
  );
};

export default HelpCenter;
