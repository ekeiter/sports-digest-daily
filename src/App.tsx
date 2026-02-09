import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { initializeAds } from "@/lib/adInit";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Profile from "./pages/Profile";
import Preferences from "./pages/Preferences";
import OlympicsPreferences from "./pages/OlympicsPreferences";
import Feed from "./pages/Feed";
import MyFeeds from "./pages/MyFeeds";
import PlayerPreferences from "./pages/PlayerPreferences";
import WhySportsDig from "./pages/WhySportsDig";
import Instructions from "./pages/Instructions";
import Splash from "./pages/Splash";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Layout wrapper that persists the sidebar
const PersistentLayout = () => (
  <AppLayout>
    <Outlet />
  </AppLayout>
);

const App = () => {
  // Initialize ads on app start
  useEffect(() => {
    initializeAds().catch(console.error);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Routes with persistent sidebar */}
            <Route element={<PersistentLayout />}>
              <Route path="/" element={<Navigate to="/feed" replace />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/preferences" element={<Preferences />} />
              <Route path="/olympics-preferences" element={<OlympicsPreferences />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/my-feeds" element={<MyFeeds />} />
              <Route path="/player-preferences" element={<PlayerPreferences />} />
              <Route path="/why-sportsdig" element={<WhySportsDig />} />
              <Route path="/instructions" element={<Instructions />} />
            </Route>
            
            {/* Routes without sidebar */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/splash" element={<Splash />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;