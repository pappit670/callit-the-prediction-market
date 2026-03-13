import { motion } from "framer-motion";
import {
  ArrowLeft,
  MessageSquare,
  CheckCircle2,
  TrendingUp,
  Clock,
  Trophy,
  BarChart3,
  MessageCircle,
  Bookmark
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.6, ease: "easeOut" as any }
};

const sections = [
  {
    icon: <MessageSquare className="h-8 w-8 text-gold" />,
    title: "Make a Call",
    description: "Users create predictions about future events across sports, technology, markets, culture, and global events. Each prediction is called a \"Call\". Calls must be clear, measurable, and time-bound."
  },
  {
    icon: <div className="flex gap-1"><CheckCircle2 className="h-8 w-8 text-yes" /><XIcon className="h-8 w-8 text-no" /></div>,
    title: "Validate Opinions",
    description: "Other users interact with Calls by choosing whether they agree or disagree. Agree = you believe the prediction will happen. Disagree = you believe it will not happen. The platform calculates the overall sentiment as more users participate."
  },
  {
    icon: <TrendingUp className="h-8 w-8 text-gold" />,
    title: "Track Sentiment",
    description: "Every Call includes a live graph showing how public opinion changes over time. You can see sentiment shifts as new information appears or events unfold."
  },
  {
    icon: <Clock className="h-8 w-8 text-gold" />,
    title: "Wait for the Outcome",
    description: "When the prediction deadline arrives, the Call resolves as either Correct or Incorrect. This allows users to see who consistently makes accurate predictions."
  },
  {
    icon: <Trophy className="h-8 w-8 text-gold" />,
    title: "Build Credibility",
    description: "Users gain reputation by making accurate predictions. Top predictors appear on leaderboards and gain recognition within the community."
  }
];

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}

const HowItWorks = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 md:px-6 py-16 md:py-24">
        {/* Page Header */}
        <motion.div
          className="text-center mb-20 md:mb-32"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground transition-colors absolute left-4 md:static"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tight text-foreground">
              How Callit Works
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-muted-foreground font-body max-w-2xl mx-auto leading-relaxed">
            Callit is a platform where people make predictions about the future and validate their opinions with others.
          </p>
        </motion.div>

        {/* Content Sections */}
        <div className="space-y-32">
          {sections.map((section, index) => (
            <motion.section
              key={index}
              className={`flex flex-col md:flex-row gap-8 md:gap-16 items-start md:items-center ${index % 2 === 1 ? "md:flex-row-reverse" : ""}`}
              {...fadeInUp}
              transition={{ ...fadeInUp.transition, delay: 0.1 }}
            >
              <div className="shrink-0 flex items-center justify-center h-20 w-20 rounded-3xl bg-secondary border border-border">
                {section.icon}
              </div>
              <div className="flex-1">
                <h2 className="font-headline text-3xl md:text-4xl font-bold text-foreground mb-4">
                  {section.title}
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground font-body leading-relaxed">
                  {section.description}
                </p>
              </div>
            </motion.section>
          ))}
        </div>

        {/* Example Call Section */}
        <motion.div
          className="mt-40 md:mt-56"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          {/* Example Call Card code unchanged */}
        </motion.div>

        {/* Final CTA */}
        <motion.div
          className="mt-40 md:mt-56 text-center border-t border-border pt-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-foreground mb-8">
            Think you know what happens next?
          </h2>
          <button
            onClick={() => navigate("/auth")}
            className="rounded-full bg-gold px-12 py-5 text-sm font-bold text-primary-foreground hover:bg-gold-hover transition-all animate-gold-pulse shadow-xl shadow-gold/20"
          >
            Start Callin →
          </button>
        </motion.div>

      </main>
    </div>
  );
};

export default HowItWorks;