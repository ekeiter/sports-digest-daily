import blimpLogo from "@/assets/sportsdig-blimp-logo.png";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Contact() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-page-bg">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <img src={blimpLogo} alt="SportsDig" className="h-10" />
          <div className="w-16" />
        </div>

        {/* Content */}
        <div className="bg-card text-card-foreground rounded-lg shadow p-6 space-y-4 text-sm">
          <h1 className="text-2xl font-bold text-foreground text-center">Contact Us</h1>
          <p className="text-center">We'd love to hear from you.</p>
          <p>
            For questions, feedback, or support, please contact us at:
          </p>
          <p>
            <span className="font-semibold">Email: </span>
            <a href="mailto:info@sportsdig.com" className="text-primary underline">
              info@sportsdig.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
