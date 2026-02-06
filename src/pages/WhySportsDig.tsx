import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import sportsDigBlimpLogo from "@/assets/sportsdig-blimp-logo.png";
import { Target, Smartphone, Newspaper, Trophy, Zap, Globe, Settings } from "lucide-react";

const WhySportsDig = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen" style={{
    backgroundColor: '#D5D5D5'
  }}>
      <header className="py-3 md:hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center">
            <img src={sportsDigBlimpLogo} alt="SportsDig" className="h-12 md:h-16" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-6">
        <div className="bg-white rounded-lg shadow-lg p-5 md:p-6 space-y-6">
          <div className="flex justify-center">
            <Button size="sm" onClick={() => navigate("/")}>
              Return to Dashboard
            </Button>
          </div>

          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-primary flex-shrink-0" />
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Why SportsDig?
              </h1>
            </div>
            <p className="text-sm md:text-base text-foreground">
              <span className="font-semibold">SportsDig</span> is a customizable sports-news hub built for real fans—a smarter alternative to algorithm-driven social feeds filled with rage-bait, noise, and stories you don't care about.
            </p>
            <p className="text-sm md:text-base text-foreground">
              Instead of doom-scrolling through random headlines, SportsDig delivers only the sports coverage that matters to you, in one truly personalized feed.
            </p>
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary flex-shrink-0" />
              <h2 className="text-lg md:text-xl font-bold text-foreground">
                A Smarter Way to Follow Sports
              </h2>
            </div>
            <p className="text-sm md:text-base text-foreground">
              Most fans rely on a disorganized mix of social media, newsletters, push alerts, and web searches for their sports content. The result? Inconsistent coverage, missed stories, and endless clutter.
            </p>
            <p className="text-sm md:text-base text-foreground">
              <span className="font-semibold">SportsDig fixes that.</span> You choose exactly what you want to follow—teams, players, leagues, colleges, and sports—and your feed shows only that. Just sports news. Your way.
            </p>
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary flex-shrink-0" />
              <h2 className="text-lg md:text-xl font-bold text-foreground">
                Never Miss Important Coverage
              </h2>
            </div>
            <p className="text-sm md:text-base text-foreground">
              Search engines show only a fraction of what's happening—and almost nobody clicks past page one.
            </p>
            <p className="text-sm md:text-base text-foreground">
              SportsDig pulls from thousands of trusted sports publications so you never miss local beat-writer insights, opponent perspectives before and after games, player-specific news across leagues, or coverage of niche and international sports.
            </p>
            <p className="text-sm md:text-base text-foreground">
              If your team plays someone, you see coverage from both sides. If your favorite player makes news, you see it.
            </p>
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary flex-shrink-0" />
              <h2 className="text-lg md:text-xl font-bold text-foreground">
                Unmatched Customization
              </h2>
            </div>
            <p className="text-sm md:text-base text-foreground">
              Most sports apps limit coverage to their own ecosystem or offer only basic filtering.
            </p>
            <p className="text-sm md:text-base text-foreground">
              SportsDig lets you build your sports universe across the entire landscape: follow any team in major professional leagues or entire leagues at once, track full sports categories like golf, racing, tennis, MMA, and motorsports, follow individual athletes and coaches, get complete college coverage with the ability to track all teams from your favorite school, and follow major events like the World Cup, Grand Slams, and the Olympics.
            </p>
            <p className="text-sm md:text-base text-foreground font-semibold">
              One feed. Your NFL team, your alma mater's basketball program, your favorite golfer—all in one place.
            </p>
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary flex-shrink-0" />
              <h2 className="text-lg md:text-xl font-bold text-foreground">
                Built for Fantasy Players & Bettors
              </h2>
            </div>
            <p className="text-sm md:text-base text-foreground">
              When timing and information matter, breadth makes the difference. SportsDig surfaces in-depth analysis and breaking news from sources your league-mates aren't reading—giving you an edge that mainstream coverage can't. Your feed can contain your entire fantasy team.
            </p>
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary flex-shrink-0" />
              <h2 className="text-lg md:text-xl font-bold text-foreground">
                Fast, Comprehensive Coverage
              </h2>
            </div>
            <p className="text-sm md:text-base text-foreground">SportsDig updates coverage throughout the day.  Articles appear within minutes of publication, not hours. If news breaks, you see it fast.</p>
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary flex-shrink-0" />
              <h2 className="text-lg md:text-xl font-bold text-foreground">
                Massive Coverage (and Growing Daily)
              </h2>
            </div>
            <div className="text-sm md:text-base text-foreground space-y-1">
              <p><span className="font-semibold">2,500+</span> trusted news sources</p>
              <p><span className="font-semibold">18,000+</span> articles processed daily—filtered down to what matters to you</p>
              <p><span className="font-semibold">90+</span> sports covered, from the NFL to the Olympics</p>
              <p><span className="font-semibold">160+</span> leagues worldwide</p>
              <p><span className="font-semibold">900+</span> teams</p>
              <p><span className="font-semibold">360+</span> NCAA schools</p>
              <p><span className="font-semibold">80,000+</span> athletes and coaches</p>
            </div>
            <p className="text-sm md:text-base text-foreground font-semibold italic">
              We find the stories—so you don't have to.
            </p>
          </section>

          <div className="flex justify-center pt-4">
            <Button size="sm" onClick={() => navigate("/")}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
export default WhySportsDig;