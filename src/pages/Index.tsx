import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import sportsDigLogo from "@/assets/sportsdig-logo.png";
import dashboardBg from "@/assets/dashboard-bg.png";
import { usePrefetchUserPreferences, prefetchArticleFeed } from "@/hooks/useUserPreferences";
import { usePrefetchArticleFeed } from "@/hooks/useArticleFeed";
const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const prefetchPreferences = usePrefetchUserPreferences();
  const prefetchFeed = usePrefetchArticleFeed();

  // Prefetch both preferences and feed (fire-and-forget)
  const warmCaches = useCallback((userId: string) => {
    prefetchPreferences(userId);
    prefetchFeed(userId);
    prefetchArticleFeed(userId); // Also warm DB cache directly
  }, [prefetchPreferences, prefetchFeed]);
  useEffect(() => {
    // Set up auth state listener
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Prefetch on login
      if (session?.user) {
        warmCaches(session.user.id);
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Prefetch for existing session
      if (session?.user) {
        warmCaches(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, [warmCaches]);

  // Prefetch when tab becomes visible again (user returns to app)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        prefetchArticleFeed(user.id); // Warm DB cache
        prefetchFeed(user.id); // Warm React Query cache
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, prefetchFeed]);
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut({
        scope: 'global'
      });
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading...</p>
        </div>
      </div>;
  }
  if (!user) {
    return <div 
      className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${dashboardBg})` }}
    >
        <div className="text-center space-y-6 p-4 md:p-8 max-w-3xl w-full">
          <h1 className="font-racing text-5xl md:text-7xl text-gray-950">
            SportsDig
          </h1>
          <p className="text-base md:text-xl text-gray-800">
            Create your personalized sports news feed from your favorite sports, leagues, teams, and players/coaches.
          </p>
          
          <div className="pt-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-center w-full">
              <Button className="w-full md:w-auto" size="lg" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button className="w-full md:w-auto" size="lg" variant="outline" onClick={() => navigate('/auth')}>
                Register
              </Button>
            </div>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{
    backgroundImage: `url(${dashboardBg})`
  }}>
      <header className="border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <img src={sportsDigLogo} alt="SportsDig" className="h-12 md:h-16" />
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-4 text-gray-950 max-w-3xl">
        <div className="text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold">Dashboard</h2>
          <p className="text-base md:text-lg text-slate-950">Welcome to SportsDig! Set up your selection preferences to receive personalized sports news.</p>
          
          <div className="mt-8 flex flex-col gap-4 max-w-md mx-auto w-full">
            <Button className="w-full" size="lg" onClick={() => navigate("/feed")}>
              Go To My Sports Feed
            </Button>
            <Button className="w-full" size="lg" variant="outline" onClick={() => navigate("/my-feeds")}>
              My Current Feed Selections 
            </Button>
            <Button className="w-full" size="lg" variant="outline" onClick={() => navigate("/preferences")}>
              Manage Sports/Leagues/Teams
            </Button>
            <Button className="w-full" size="lg" variant="outline" onClick={() => navigate("/player-preferences")}>
              Manage Player &amp; Coach Preferences
            </Button>
            <Button className="w-full" size="lg" variant="outline" onClick={() => navigate("/why-sportsdig")}>
              Why SportsDig?
            </Button>
            <Button className="w-full" size="lg" variant="outline" onClick={() => navigate('/profile')}>
              Profile
            </Button>
            <Button className="w-full" size="lg" variant="outline" onClick={handleSignOut}>
              Sign Out ({user.email})
            </Button>
          </div>
        </div>
      </main>
    </div>;
};
export default Index;