import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ThemeProvider } from "next-themes";
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
import Index from "./pages/Index";

import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";

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
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Routes with persistent sidebar */}
              <Route element={<PersistentLayout />}>
                <Route path="/feed" element={<Feed />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/preferences" element={<Preferences />} />
                <Route path="/olympics-preferences" element={<OlympicsPreferences />} />
                <Route path="/my-feeds" element={<MyFeeds />} />
                <Route path="/player-preferences" element={<PlayerPreferences />} />
                <Route path="/why-sportsdig" element={<WhySportsDig />} />
                <Route path="/instructions" element={<Instructions />} />
              </Route>
              
              {/* Routes without sidebar */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              {/* /splash now redirects to /feed since the branded loader is built-in */}
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;