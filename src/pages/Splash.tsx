import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import dashboardBg from "@/assets/dashboard-bg.png";

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/", { replace: true });
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-fixed bg-cover bg-center"
      style={{ backgroundImage: `url(${dashboardBg})` }}
    >
      <h1 className="font-racing text-5xl md:text-7xl text-black animate-fade-in">
        SportsDig
      </h1>
    </div>
  );
};

export default Splash;
