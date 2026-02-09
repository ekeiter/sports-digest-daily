import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import sportsDigBlimpLogo from "@/assets/sportsdig-blimp-logo.png";

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return; // Show landing page
      }

      // Authenticated — redirect based on favorites
      const { count } = await supabase
        .from("subscriber_interests")
        .select("id", { count: "exact", head: true })
        .eq("subscriber_id", user.id);

      if (count && count > 0) {
        navigate("/feed", { replace: true });
      } else {
        navigate("/preferences", { replace: true });
      }
    };

    checkAuthAndRedirect();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#D5D5D5]">
        <h1 className="font-racing text-5xl md:text-7xl text-black animate-fade-in">
          SportsDig
        </h1>
      </div>
    );
  }

  // Landing page for unauthenticated users
  return (
    <div className="min-h-screen flex flex-col bg-[#D5D5D5]">
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center space-y-6 p-4 md:p-8 max-w-3xl w-full">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            A Smarter Way to Follow the Sports You Care About
          </h1>
          <div className="flex justify-center">
            <img src={sportsDigBlimpLogo} alt="SportsDig" className="h-24 md:h-32" />
          </div>
          <h2 className="text-base md:text-lg font-bold text-gray-800">
            Your Personalized Sports News Feed
          </h2>
          <ul className="text-sm md:text-base text-gray-700 space-y-2 text-left max-w-lg mx-auto">
            <li className="flex gap-2"><span className="text-[#1B3A6B] shrink-0">✔</span><span><strong>Unmatched customization</strong> — follow sports, leagues, teams, colleges, and major events</span></li>
            <li className="flex gap-2"><span className="text-[#1B3A6B] shrink-0">✔</span><span><strong>Track individual athletes</strong> — a unique way to follow player-specific news across leagues</span></li>
            <li className="flex gap-2"><span className="text-[#1B3A6B] shrink-0">✔</span><span><strong>Comprehensive coverage</strong> — thousands of trusted sources, updated within minutes of publication</span></li>
            <li className="flex gap-2"><span className="text-[#1B3A6B] shrink-0">✔</span><span><strong>Built for serious fans, fantasy players, and sports bettors</strong></span></li>
            <li className="flex gap-2"><span className="text-[#1B3A6B] shrink-0">✔</span><span><strong>An ideal alternative to algorithm-driven social media feeds</strong></span></li>
          </ul>
          <p className="text-base md:text-lg italic text-gray-900 font-medium">
            We find the stories — so you don't have to.
          </p>

          <div className="pt-4 flex flex-col md:flex-row gap-4 justify-center w-full">
            <Button className="w-full md:w-48" size="lg" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button className="w-full md:w-48" size="lg" variant="outline" onClick={() => navigate('/auth?mode=signup')}>
              Register
            </Button>
          </div>

          <div className="pt-4 text-center text-xs text-gray-900 space-y-1">
            <p>SportsDig™ — Personalized Sports News</p>
            <p>© 2026 SportsDig. All rights reserved.</p>
            <div className="flex justify-center gap-4 pt-1">
              <a href="mailto:info@sportsdig.com" className="underline hover:text-gray-700">Contact</a>
              <a href="/privacy" className="underline hover:text-gray-700">Privacy Policy</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;