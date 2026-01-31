import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import sportsDigBlimpLogo from "@/assets/sportsdig-blimp-logo.png";
import { usePrefetchUserPreferences, prefetchArticleFeed } from "@/hooks/useUserPreferences";
import { usePrefetchArticleFeed } from "@/hooks/useArticleFeed";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInstructionsDialog, setShowInstructionsDialog] = useState(false);
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
    return <div className="min-h-screen flex items-center justify-center bg-[#D5D5D5]">
        <div className="text-center">
          <p className="text-lg text-black">Loading...</p>
        </div>
      </div>;
  }
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center px-4 bg-[#D5D5D5]">
        <div className="text-center space-y-6 p-4 md:p-8 max-w-3xl w-full">
          <div className="flex justify-center">
            <img src={sportsDigBlimpLogo} alt="SportsDig" className="h-32 md:h-40" />
          </div>
          <p className="text-base md:text-xl text-gray-800">
            Create your personalized sports news feed from your favorite sports, leagues, teams, and players/coaches.
          </p>
          
          <div className="pt-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-center w-full">
              <Button className="w-full md:w-48" size="lg" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button className="w-full md:w-48" size="lg" variant="outline" onClick={() => navigate('/auth?mode=signup')}>
                Register
              </Button>
            </div>
          </div>
        </div>
      </div>;
  }
  return <div className="h-screen overflow-hidden flex flex-col bg-[#D5D5D5] overscroll-none">
      <header className="border-b border-white/20 flex-shrink-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <img src={sportsDigBlimpLogo} alt="SportsDig" className="h-20 md:h-24" />
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-2 text-gray-950 max-w-3xl">
        <div className="text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold">Dashboard</h2>
          
          <div className="mt-8 flex flex-col gap-4 max-w-md mx-auto w-full">
            <Button className="w-full" size="lg" variant="outline" onClick={() => navigate("/feed")}>
              Go To My Combined Sports News Feed   
            </Button>
            <Button className="w-full justify-between" size="lg" variant="outline" onClick={() => navigate("/preferences")}>
              <img src={sportsDigBlimpLogo} alt="" className="h-7 w-auto" />
              <span>Feed Topic Manager</span>
              <img src={sportsDigBlimpLogo} alt="" className="h-7 w-auto" />
            </Button>
            
            <div className="border-t border-gray-400 my-1" />
            
            <Button className="w-full" size="lg" variant="outline" onClick={() => setShowInstructionsDialog(true)}>
              Instructions
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
            
            <p className="text-xs text-foreground text-center pt-4">
              SportsDig™ — Personalized Sports News<br />
              © 2026 SportsDig. All rights reserved.
            </p>
          </div>
        </div>
      </main>

      {/* Instructions Dialog */}
      <Dialog open={showInstructionsDialog} onOpenChange={setShowInstructionsDialog}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>How to Use the Feed Topic Manager</DialogTitle>
            <DialogDescription className="sr-only">
              Instructions for using the Feed Topic Manager
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p><span className="font-bold text-foreground">Browsing Topics</span> - Clicking any item opens a focused news feed for that topic. Select any menu button to drill down into more specific categories including teams, schools, etc.</p>
            <p><span className="font-bold text-foreground">Searching</span> - Use the search box to find any topic quickly. Search includes teams, players, coaches, schools, and leagues. Click any search result to view its focused news feed.</p>
            <p><span className="font-bold text-foreground">Favoriting Topics</span> - Click the heart icon to favorite any topic. Favorites appear at the top of the screen for quick access. Click any favorite to see its focused news feed.</p>
            <p><span className="font-bold text-foreground">Removing Favorites</span> - Click the heart again to remove from favorites. Mobile/Tablet: Press and hold a favorite card, then tap the X. Desktop: Click the X button on the favorite card.</p>
            <p><span className="font-bold text-foreground">Combined Feed</span> - Click "Combined Feed" button to see a news feed from all of your favorite topics. Your feed can include any mix of players, teams, leagues, and more.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default Index;