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