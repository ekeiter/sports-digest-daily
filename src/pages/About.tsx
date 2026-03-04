import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import WhySportsDig from "./WhySportsDig";
import sportsDigBlimpLogo from "@/assets/sportsdig-blimp-logo.png";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-page-bg">
      <div className="container mx-auto px-4 max-w-3xl pt-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-1.5 px-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <img src={sportsDigBlimpLogo} alt="SportsDig" className="h-16" />
        </div>
      </div>
      <div className="flex-1">
        <WhySportsDig showHeader={false} />
      </div>
    </div>
  );
};

export default About;
