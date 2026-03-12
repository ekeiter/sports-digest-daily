import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { User } from '@supabase/supabase-js';
import sportsDigBlimpLogo from "@/assets/sportsdig-blimp-logo.png";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


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
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) return;
    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser(
        { email: newEmail.trim() },
        { emailRedirectTo: window.location.origin + "/auth/callback" }
      );
      if (error) throw error;
      setShowEmailDialog(false);
      setNewEmail("");
      toast({
        title: "Confirmation Sent",
        description: "Check your new email inbox to confirm the change.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setEmailLoading(false);
    }
  };

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
      <div className="h-screen flex items-center justify-center bg-page-bg">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-page-bg w-full max-w-5xl mx-auto">
      <header className="py-2 flex-shrink-0">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            <img src={sportsDigBlimpLogo} alt="SportsDig" className="h-11 w-11 object-contain flex-shrink-0" />
            <div className="flex-1 flex items-center justify-center">
              <span className="text-lg font-bold text-foreground">Profile</span>
            </div>
            <div className="w-11 flex-shrink-0" />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto container mx-auto px-4 pb-6 max-w-lg">
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg md:text-2xl text-center">Your Profile</CardTitle>
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
              <div className="text-sm md:text-base">
                <span className="font-medium">Email:</span> {subscriber?.email}
              </div>
              <div className="text-sm md:text-base">
                <span className="font-medium">Subscription:</span> {subscriber?.subscription_tier || 'free'}
              </div>
            </div>

            <div className="pt-2 border-t space-y-1.5">
              <span className="font-medium text-sm md:text-base">Appearance</span>
              <div className="flex gap-2">
                {[
                  { value: 'light', label: 'Light', emoji: '☀️' },
                  { value: 'dark', label: 'Dark', emoji: '🌙' },
                  { value: 'system', label: 'System', emoji: '🖥️' },
                ].map(({ value, label, emoji }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      theme === value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-foreground hover:bg-accent'
                    }`}
                  >
                    <span className="text-base">{emoji}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <Button onClick={() => setShowEmailDialog(true)} variant="outline" className="px-6 text-sm md:text-base">
                Change Email
              </Button>
              <Button onClick={handleSignOut} className="bg-primary text-primary-foreground hover:bg-primary/80 px-6 text-sm md:text-base">
                Sign Out
              </Button>
            </div>

            <div className="pt-4 border-t space-y-2">
              <Button variant="outline" className="w-full justify-start text-sm" onClick={() => navigate('/instructions')}>
                <BookOpen className="h-4 w-4 mr-2" /> Instructions
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm" onClick={() => navigate('/why-sportsdig')}>
                <HelpCircle className="h-4 w-4 mr-2" /> Why SportsDig
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-xs text-muted-foreground text-center space-y-1 pt-4 pb-2">
          <p className="font-medium">SportsDig™ — Personalized Sports News</p>
          <p>© 2026 SportsDig. All rights reserved.</p>
          <div className="flex justify-center gap-4 pt-1">
            <span className="underline cursor-pointer hover:text-foreground transition-colors" onClick={() => navigate('/contact')}>Contact</span>
            <span className="underline cursor-pointer hover:text-foreground transition-colors" onClick={() => navigate('/privacy')}>Privacy Policy</span>
          </div>
        </div>
      </main>

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Email Address</DialogTitle>
            <DialogDescription>
              Enter your new email address. You'll receive confirmation emails at both your old and new addresses.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="new-email">New Email</Label>
            <Input
              id="new-email"
              type="email"
              placeholder="Enter new email address"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleChangeEmail()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeEmail} disabled={emailLoading || !newEmail.trim()}>
              {emailLoading ? "Sending..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
