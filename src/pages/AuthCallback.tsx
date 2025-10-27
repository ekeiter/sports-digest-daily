import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) throw error;

        if (user) {
          // Ensure subscriber record exists after email confirmation
          await supabase.rpc("ensure_my_subscriber");
          
          toast({
            title: "Email Confirmed",
            description: "Your email has been successfully confirmed.",
          });
        }
        
        navigate("/");
      } catch (error: any) {
        console.error("Callback error:", error);
        toast({
          title: "Confirmation Error",
          description: error.message || "Failed to confirm email. The link may be expired or already used.",
          variant: "destructive",
        });
        navigate("/auth");
      }
    };

    handleCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Confirming your email...</h2>
        <p className="text-muted-foreground">Please wait a moment.</p>
      </div>
    </div>
  );
}
