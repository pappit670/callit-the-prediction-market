import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppContextProvider } from "@/context/AppContext";
import { DotPattern } from "@/components/ui/dot-pattern";
import Index from "./pages/Index";
import CallIt from "./pages/CallIt";
import OpinionDetail from "./pages/OpinionDetail";
import Portfolio from "./pages/Portfolio";
import Wallet from "./pages/Wallet";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import MobileNav from "./components/MobileNav";
import Footer from "./components/Footer";
import HowItWorks from "./pages/HowItWorks";
import HelpCenter from "./pages/HelpCenter";
import SavedCalls from "./pages/SavedCalls";
import MyCalls from "./pages/MyCalls";
import Topics from "./pages/Topics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppContextProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="relative min-h-screen flex flex-col bg-background">
            {/* Global Dot Pattern Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
              <DotPattern className="fill-muted-foreground/10 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
            </div>
            
            {/* Main Content wrapper */}
            <div className="flex-1 relative z-10">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/call-it" element={<CallIt />} />
                <Route path="/topics" element={<Topics />} />
                <Route path="/opinion/:id" element={<OpinionDetail />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/user/:username" element={<UserProfile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/help-center" element={<HelpCenter />} />
                <Route path="/saved-calls" element={<SavedCalls />} />
                <Route path="/my-calls" element={<MyCalls />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>

            <Footer />
            <MobileNav />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AppContextProvider>
  </QueryClientProvider>
);

export default App;
