import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import sportsDigLogo from "@/assets/sportsdig-logo.jpg";
const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
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
    });
    return () => subscription.unsubscribe();
  }, []);
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
    return <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-6 p-4 md:p-8 max-w-3xl w-full">
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            My Sports Digest
          </h1>
          <p className="text-base md:text-xl text-muted-foreground">
            Get personalized daily emails with sports articles from your favorite teams, players, and sports. 
            Stay updated with AI-generated summaries of the latest news.
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
            <p className="text-sm text-muted-foreground">
              Free for one topic • Monthly subscription for multiple teams
            </p>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <img src={sportsDigLogo} alt="SportsDigg" className="h-8 md:h-10" />
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 pt-4 text-center">
        <p className="text-sm text-muted-foreground">
          {user.email}
        </p>
      </div>
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold">Dashboard</h2>
          <p className="text-base md:text-lg text-muted-foreground">
            Welcome to SportsDig!
Set up your preferences to start receiving personalized sports news.
          </p>
          
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
              Manage Player Preferences
            </Button>
            <Button className="w-full" size="lg" variant="outline" onClick={() => navigate("/why-sportsdig")}>
              Why SportsDig
            </Button>
            <Button className="w-full" size="lg" variant="outline" onClick={() => navigate('/profile')}>
              Profile
            </Button>
            <Button className="w-full" size="lg" variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </main>
    </div>;
};
export default Index;