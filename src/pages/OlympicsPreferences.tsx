import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";

export default function OlympicsPreferences() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-[#D5D5D5]"
    >
      <header className="bg-transparent">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-black">
              <span className="font-racing text-2xl md:text-3xl">SportsDig</span> <span className="text-lg md:text-xl">- Olympics</span>
            </h1>
            <div className="flex gap-1.5 md:gap-2">
              <Button className="text-sm px-3 md:px-4" onClick={() => navigate("/")}>
                Dashboard
              </Button>
              <Button className="text-sm px-3 md:px-4" onClick={() => navigate("/preferences")}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Preferences
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-2 max-w-3xl">
        <div className="bg-white/90 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold text-black mb-4">Olympics Preferences</h2>
          <p className="text-muted-foreground">
            Olympics content coming soon. This page will allow you to select Olympic sports, countries, and athletes.
          </p>
        </div>
      </main>
    </div>
  );
}
