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
          <div className="flex justify-center">
            <img src={sportsDigBlimpLogo} alt="SportsDig" className="h-32 md:h-40" />
          </div>
          <p className="text-lg md:text-xl text-gray-800 font-medium">
            Your Personalized Sports News Feed
          </p>
          <ul className="text-sm md:text-base text-gray-700 space-y-2 text-left max-w-md mx-auto">
            <li>✔ Follow your favorite teams, players &amp; leagues</li>
            <li>✔ One combined feed from 100+ trusted sources</li>
            <li>✔ NFL, NBA, MLB, NHL, MLS, NCAA &amp; more</li>
            <li>✔ Free to use — no ads in your way</li>
          </ul>

          <div className="pt-4 flex flex-col md:flex-row gap-4 justify-center w-full">
            <Button className="w-full md:w-48" size="lg" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button className="w-full md:w-48" size="lg" variant="outline" onClick={() => navigate('/auth?mode=signup')}>
              Register
            </Button>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-gray-500 space-y-1">
        <p>SportsDig™ — Personalized Sports News</p>
        <p>© 2026 SportsDig. All rights reserved.</p>
        <div className="flex justify-center gap-4 pt-1">
          <a href="mailto:info@sportsdig.com" className="underline hover:text-gray-700">Contact</a>
          <a href="/privacy" className="underline hover:text-gray-700">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
};

export default Index;