import sportsDigBlimpLogo from "@/assets/sportsdig-blimp-logo.png";
import { BookOpen, MousePointer, Search, Heart, Layers } from "lucide-react";
import { MobileSidebar } from "@/components/MobileSidebar";

const Instructions = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#D5D5D5' }}>
      {/* Mobile header with hamburger menu */}
      <header className="py-3 md:hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-end">
            <MobileSidebar />
          </div>
        </div>
      </header>

      {/* PC/Tablet header with logo */}
      <header className="hidden md:block py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center">
            <img src={sportsDigBlimpLogo} alt="SportsDig" className="h-12" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-6">
        <div className="bg-white rounded-lg shadow-lg p-5 md:p-6 space-y-6 md:space-y-5">
          {/* Mobile: Logo at top of card */}
          <div className="flex justify-center md:hidden">
            <img src={sportsDigBlimpLogo} alt="SportsDig" className="h-12" />
          </div>

          <section className="space-y-3 md:space-y-2">
            <div className="flex items-center gap-3 md:gap-2">
              <BookOpen className="h-5 w-5 md:h-4 md:w-4 text-primary flex-shrink-0" />
              <h1 className="text-2xl md:text-xl font-bold text-foreground">
                How to Use SportsDig
              </h1>
            </div>
          </section>

          <section className="space-y-2 md:space-y-1.5">
            <div className="flex items-center gap-2 md:gap-1.5">
              <MousePointer className="h-5 w-5 md:h-4 md:w-4 text-primary flex-shrink-0" />
              <h2 className="text-lg md:text-base font-bold text-foreground">
                Browsing Topics
              </h2>
            </div>
            <p className="text-sm md:text-xs text-foreground">
              <span className="font-semibold">Clicking</span> on any topic (sport, league, team, etc.) will take you directly to a focused news feed for that topic.
            </p>
            <p className="text-sm md:text-xs text-foreground">
              <span className="font-semibold">Using the menu buttons</span> (like "Teams" or "Players") lets you drill down to explore what's available within that category.
            </p>
          </section>

          <section className="space-y-2 md:space-y-1.5">
            <div className="flex items-center gap-2 md:gap-1.5">
              <Search className="h-5 w-5 md:h-4 md:w-4 text-primary flex-shrink-0" />
              <h2 className="text-lg md:text-base font-bold text-foreground">
                Searching
              </h2>
            </div>
            <p className="text-sm md:text-xs text-foreground">
              Use the search bar to find specific teams, players, coaches, or schools. Results appear as you type, making it easy to locate exactly what you're looking for.
            </p>
          </section>

          <section className="space-y-2 md:space-y-1.5">
            <div className="flex items-center gap-2 md:gap-1.5">
              <Heart className="h-5 w-5 md:h-4 md:w-4 text-primary flex-shrink-0" />
              <h2 className="text-lg md:text-base font-bold text-foreground">
                Adding Favorites
              </h2>
            </div>
            <p className="text-sm md:text-xs text-foreground">
              Tap the <span className="font-semibold">heart icon</span> next to any topic to add it to your favorites. Your favorites appear in the sidebar for quick access.
            </p>
            <p className="text-sm md:text-xs text-foreground">
              <span className="font-semibold">To remove a favorite:</span> Click the trash icon next to any favorite in the sidebar, or toggle the heart icon off in the Topic Manager.
            </p>
          </section>

          <section className="space-y-2 md:space-y-1.5">
            <div className="flex items-center gap-2 md:gap-1.5">
              <Layers className="h-5 w-5 md:h-4 md:w-4 text-primary flex-shrink-0" />
              <h2 className="text-lg md:text-base font-bold text-foreground">
                Combined Feed
              </h2>
            </div>
            <p className="text-sm md:text-xs text-foreground">
              The <span className="font-semibold">Combined Sports News Feed</span> shows articles from all your favorites in one unified stream, sorted by recency. This is your personalized sports news hub.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Instructions;
