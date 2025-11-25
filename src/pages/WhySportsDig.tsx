import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import sportsDigLogo from "@/assets/sportsdig-logo.jpg";

const WhySportsDig = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <img src={sportsDigLogo} alt="SportsDigg" className="h-8 md:h-10" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Why SportsDig?
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-semibold">
              Your Sports. Your Feed. Zero Noise.
            </p>
          </div>

          <div className="prose prose-lg max-w-none space-y-6">
            <p className="text-base md:text-lg text-foreground">
              Welcome to SportsDig, the customizable sports-news hub built for fans who are tired of doom-scrolling, 
              algorithm-driven feeds, and missing the stories that actually matter to them. Here's why you'll love it:
            </p>

            <section className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                A Smarter Alternative to Social Media & Random Feeds
              </h2>
              <p className="text-base md:text-lg text-foreground">
                Most people get sports updates from a messy mix of newsletters, push alerts, social media, and Google searches. 
                It's inconsistent, inefficient, and full of noise.
              </p>
              <p className="text-base md:text-lg text-foreground font-semibold">
                SportsDig fixes that.
              </p>
              <p className="text-base md:text-lg text-foreground">
                You choose exactly which teams, players, leagues, and sports you care about — and your feed shows only that. 
                No algorithms. No filler.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Never Miss Important Coverage Again
              </h2>
              <p className="text-base md:text-lg text-foreground">
                Search engines only show a fraction of what's happening — and nobody clicks past page one. 
                SportsDig pulls reporting from a broad universe of trusted sports publications, so you never miss:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base md:text-lg text-foreground ml-4">
                <li>Local beat-writer insights</li>
                <li>Opponent coverage before and after games</li>
                <li>Niche sports you casually follow</li>
                <li>Player-specific news across leagues</li>
              </ul>
              <p className="text-base md:text-lg text-foreground">
                If your team plays someone, you get both perspectives. If your favorite player is in the news, you see it instantly.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Unmatched Customization
              </h2>
              <p className="text-base md:text-lg text-foreground">
                Most sports sites let you follow teams only within their ecosystem. 
                SportsDig lets you customize across the entire sports world:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base md:text-lg text-foreground ml-4">
                <li>Any team in major leagues</li>
                <li>Entire sports (golf, racing, MMA, cricket, etc.)</li>
                <li>Individual players</li>
                <li>Local markets and regions</li>
                <li>Mix all your interests into one unified feed</li>
              </ul>
              <p className="text-base md:text-lg text-foreground font-semibold">
                Your sports universe — exactly the way you want it.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Perfect for Fantasy Players and Bettors
              </h2>
              <p className="text-base md:text-lg text-foreground">
                If you play fantasy sports or bet, you know timing and breadth of information is everything. 
                Faster insights = better decisions.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Ad-Free. Distraction-Free. Fan-Focused.
              </h2>
              <p className="text-base md:text-lg text-foreground">
                We chose a paid model for one reason: clarity. The internet already has too many ads, autoplay videos, 
                popups, and trackers.
              </p>
              <p className="text-base md:text-lg text-foreground">
                For less than the cost of a single fast-food meal per year, you get:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base md:text-lg text-foreground ml-4">
                <li>A clean, ad-free reading experience</li>
                <li>High-quality, curated sports coverage</li>
                <li>A dashboard built entirely around your interests</li>
              </ul>
              <p className="text-base md:text-lg text-foreground font-semibold">
                No ads. No clickbait. No noise.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Constantly Updated — Truly Real-Time
              </h2>
              <p className="text-base md:text-lg text-foreground">
                Our system ingests and updates feeds every few minutes. If news breaks, you see it. 
                If a story changes, your feed reflects it. If a player trends, you get the coverage — instantly.
              </p>
            </section>

            <div className="text-center py-6">
              <p className="text-xl md:text-2xl font-bold text-foreground">
                SportsDig: Your sports universe, organized.
              </p>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button size="lg" onClick={() => navigate("/")}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WhySportsDig;
