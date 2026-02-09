import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { User } from '@supabase/supabase-js';
import sportsDigBlimpLogo from "@/assets/sportsdig-blimp-logo.png";
import { MobileSidebar } from "@/components/MobileSidebar";

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  time_zone: string | null;
  subscription_tier: string | null;
  notification_frequency: string | null;
  is_active: boolean | null;
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);

      // Ensure subscriber record exists (idempotent)
      await supabase.rpc("ensure_my_subscriber");

      // Fetch subscriber profile
      const { data: subscriberData, error } = await supabase
        .from("subscribers")
        .select("id,email,name,time_zone,subscription_tier,notification_frequency,is_active")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      setSubscriber(subscriberData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const needsConfirm = user && !user.email_confirmed_at;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#D5D5D5' }}>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#D5D5D5' }}>
      {/* Mobile header: menu left, logo centered */}
      <header className="py-2 md:hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            <div className="w-10 flex justify-start">
              <MobileSidebar />
            </div>
            <div className="flex-1 flex justify-center">
              <img src={sportsDigBlimpLogo} alt="SportsDig" className="h-10" />
            </div>
            <div className="w-10" />
          </div>
        </div>
      </header>

      {/* PC/Tablet header with logo */}
      <header className="hidden md:block py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center">
            <img src={sportsDigBlimpLogo} alt="SportsDig" className="h-12" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-6">
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl md:text-2xl text-center">Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {needsConfirm && (
              <Alert>
                <AlertDescription>
                  Please confirm your email to continue. Check your inbox for the confirmation link.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <div className="text-base">
                <span className="font-medium">Email:</span> {subscriber?.email}
              </div>
              <div className="text-base">
                <span className="font-medium">Subscription:</span> {subscriber?.subscription_tier || 'free'}
              </div>
              <div className="text-base">
                <span className="font-medium">Notifications:</span> {subscriber?.notification_frequency || 'daily'}
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <Button onClick={handleSignOut} className="bg-black hover:bg-black/80 text-white px-8">
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
