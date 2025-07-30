import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 p-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Sports Digest Daily
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Get personalized daily emails with sports articles from your favorite teams, players, and sports. 
            Stay updated with AI-generated summaries of the latest news.
          </p>
          <div className="space-y-4">
            <Button size="lg" onClick={() => navigate('/auth')}>
              Get Started
            </Button>
            <p className="text-sm text-muted-foreground">
              Free for one topic • Monthly subscription for multiple teams
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Sports Digest Daily</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user.email}
            </span>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <p className="text-lg text-muted-foreground">
            Welcome to your Sports Digest! Set up your preferences to start receiving personalized sports news.
          </p>
          
          <div className="mb-8 space-y-4">
            <Button size="lg" onClick={() => navigate('/news')}>
              View Latest Sports News
            </Button>
            <div>
              <Button variant="outline" onClick={() => navigate('/news-settings')}>
                News Settings
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Teams</h3>
              <p className="text-muted-foreground mb-4">
                Follow your favorite teams from MLB, NFL, NBA, and NHL
              </p>
              <Button variant="outline" className="w-full" onClick={() => navigate('/manage-teams')}>
                Manage Teams
              </Button>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Sports</h3>
              <p className="text-muted-foreground mb-4">
                Stay updated on golf, auto racing, tennis, and more
              </p>
              <Button variant="outline" className="w-full" onClick={() => navigate('/manage-sports')}>
                Manage Sports
              </Button>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Players</h3>
              <p className="text-muted-foreground mb-4">
                Get news about your favorite individual players
              </p>
              <Button variant="outline" className="w-full" onClick={() => navigate('/manage-players')}>
                Manage Players
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
