import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppContextProvider, useApp } from "@/context/AppContext";
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

const AuthRoute = () => {
  const { isLoggedIn } = useApp();
  return isLoggedIn ? <Navigate to="/" replace /> : <Auth />;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn } = useApp();
  return isLoggedIn ? <>{children}</> : <Navigate to="/auth" replace />;
};

const AppRoutes = () => (
  <div className="relative min-h-screen flex flex-col bg-background">
    <div className="fixed inset-0 z-0 pointer-events-none">
      <DotPattern className="fill-muted-foreground/10 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
    </div>

    {/* Subtle logo watermark */}
    <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center opacity-[0.06]">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="600" height="600">
        <rect width="80" height="80" rx="20" fill="#F5C518" />
        <path d="M55 22 A22 22 0 1 0 55 58" fill="none" stroke="#111111" stroke-width="6" stroke-linecap="round" />
        <g transform="translate(40,40) rotate(-12)">
          <path d="M-9 0 L-3 7 L9 -5" fill="none" stroke="#111111" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
        </g>
      </svg>
    </div>

    <div className="flex-1 relative z-10">
      <Routes>
        <Route path="/auth" element={<AuthRoute />} />
        <Route path="/" element={<Index />} />
        <Route path="/call-it" element={<ProtectedRoute><CallIt /></ProtectedRoute>} />
        <Route path="/topics" element={<Topics />} />
        <Route path="/opinion/:id" element={<OpinionDetail />} />
        <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/user/:username" element={<UserProfile />} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/help-center" element={<HelpCenter />} />
        <Route path="/saved-calls" element={<ProtectedRoute><SavedCalls /></ProtectedRoute>} />
        <Route path="/my-calls" element={<ProtectedRoute><MyCalls /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
    <Footer />
    <MobileNav />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppContextProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AppContextProvider>
  </QueryClientProvider>
);

export default App;