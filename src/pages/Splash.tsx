import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
      className="min-h-screen flex items-center justify-center bg-[#D5D5D5]"
    >
      <h1 className="font-racing text-5xl md:text-7xl text-black animate-fade-in">
        SportsDig
      </h1>
    </div>
  );
};

export default Splash;
