import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import sportsDigBlimpLogo from "@/assets/sportsdig-blimp-logo.png";
import ExampleFeed from "@/components/ExampleFeed";

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if this is an auth redirect (hash contains access_token from confirmation or recovery)
    const hash = window.location.hash;
    if (hash && (hash.includes('type=recovery') || hash.includes('type=signup') || hash.includes('type=email'))) {
      // Forward the entire hash to the callback page
      navigate('/auth/callback' + hash, { replace: true });
      return;
    }

    const checkAuthAndRedirect = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return; // Show landing page
      }

      // Authenticated — redirect based on favorites
      const { count, error } = await supabase
        .from("subscriber_interests")
        .select("id", { count: "exact", head: true })
        .eq("subscriber_id", user.id);

      if (!error && count && count > 0) {
        navigate("/feed", { replace: true });
      } else {
        navigate("/preferences", { replace: true });
      }
    };

    checkAuthAndRedirect();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page-bg">
        <h1 className="font-racing text-5xl md:text-7xl text-foreground animate-fade-in">
          SportsDig
        </h1>
      </div>
    );
  }

  // Landing page for unauthenticated users
  return (
    <div className="min-h-screen flex flex-col bg-page-bg overscroll-none">
      <main className="flex-1 flex items-start pt-4 md:items-start md:pt-16 lg:items-center lg:pt-0 justify-center px-4">
        <div className="text-center space-y-3 md:space-y-6 p-2 md:p-8 max-w-3xl w-full">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            A Smarter Way to Follow the Sports You Care About
          </h1>
          <div className="flex justify-center">
            <img src={sportsDigBlimpLogo} alt="SportsDig" className="h-14 md:h-32" />
          </div>
          <h2 className="text-base md:text-lg font-bold text-foreground">
            Your Personalized Sports News Feed
          </h2>
          <ul className="text-sm md:text-base text-muted-foreground space-y-1.5 md:space-y-2 text-left max-w-lg mx-auto">
            <li className="flex gap-2"><span className="text-[#1B3A6B] shrink-0">✔</span><span><strong>Unmatched customization</strong> — follow sports, leagues, teams, colleges, and major events</span></li>
            <li className="flex gap-2"><span className="text-[#1B3A6B] shrink-0">✔</span><span><strong>Track individual athletes</strong> — a unique way to follow player-specific news across leagues</span></li>
            <li className="flex gap-2"><span className="text-[#1B3A6B] shrink-0">✔</span><span><strong>Comprehensive coverage</strong> — thousands of trusted sources, updated within minutes of publication</span></li>
            <li className="flex gap-2"><span className="text-[#1B3A6B] shrink-0">✔</span><span><strong>Built for serious fans, fantasy players, and sports bettors</strong></span></li>
            <li className="flex gap-2"><span className="text-[#1B3A6B] shrink-0">✔</span><span><strong>An ideal alternative to algorithm-driven social media feeds</strong></span></li>
          </ul>
          <p className="text-base md:text-lg italic text-foreground font-medium">
            We find the stories — so you don't have to.
          </p>

          <div className="pt-1 md:pt-4 flex flex-row gap-4 justify-center w-full">
            <Button className="flex-1 md:flex-none md:w-48 h-9 md:h-11" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button className="flex-1 md:flex-none md:w-48 h-9 md:h-11" variant="outline" onClick={() => navigate('/auth?mode=signup')}>
              Register
            </Button>
          </div>

          <div className="pt-1 md:pt-4 text-center text-xs text-foreground space-y-1">
            <p>SportsDig™ — Personalized Sports News</p>
            <p>© 2026 SportsDig. All rights reserved.</p>
            <div className="flex justify-center gap-4 pt-1">
              <a href="/contact" className="underline hover:text-muted-foreground">Contact</a>
              <a href="/privacy" className="underline hover:text-muted-foreground">Privacy Policy</a>
            </div>
          </div>

          <ExampleFeed />
        </div>
      </main>
    </div>
  );
};

export default Index;