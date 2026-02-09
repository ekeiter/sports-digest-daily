import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Splash = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkFavoritesAndRedirect = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Not logged in, go to auth
          navigate("/auth", { replace: true });
          return;
        }

        // Check if user has any favorites
        const { count, error } = await supabase
          .from("subscriber_interests")
          .select("id", { count: "exact", head: true })
          .eq("subscriber_id", user.id);

        if (error) {
          console.error("Error checking favorites:", error);
          navigate("/preferences", { replace: true });
          return;
        }

        // Redirect based on whether user has favorites
        if (count && count > 0) {
          navigate("/feed", { replace: true });
        } else {
          navigate("/preferences", { replace: true });
        }
      } catch (error) {
        console.error("Splash redirect error:", error);
        navigate("/preferences", { replace: true });
      } finally {
        setChecking(false);
      }
    };

    // Small delay for splash effect, then check and redirect
    const timer = setTimeout(() => {
      checkFavoritesAndRedirect();
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#D5D5D5]"
    >
      <h1 className="font-racing text-5xl md:text-7xl text-black animate-fade-in">
        SportsDig
      </h1>
    </div>
  );
};

export default Splash;
