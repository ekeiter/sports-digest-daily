import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { 
  SportWithInterest, 
  LeagueWithInterest, 
  TeamWithInterest, 
  SchoolWithInterest, 
  Person,
  OlympicsPreference 
} from "@/hooks/useUserPreferences";

// Helper to properly capitalize sport names
const toTitleCase = (str: string) => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface SelectionCardProps {
  logoUrl?: string | null;
  label: string;
  sublabel?: string;
  interestId: number;
}

function SelectionCard({ logoUrl, label, sublabel, interestId }: SelectionCardProps) {
  const navigate = useNavigate();
  
  return (
    <button
      onClick={() => navigate(`/feed?focus=${interestId}`)}
      className="flex flex-col items-center justify-start w-14 h-16 p-1 rounded-md bg-card border border-border hover:bg-accent transition-colors select-none flex-shrink-0"
    >
      <div className="w-8 h-8 flex items-center justify-center">
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt="" 
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-muted" />
        )}
      </div>
      <span className="text-[10px] font-medium text-center line-clamp-2 leading-tight text-foreground">
        {label}
      </span>
      {sublabel && (
        <span className="text-[8px] text-center leading-none text-foreground">
          {sublabel}
        </span>
      )}
    </button>
  );
}

interface FeedSelectionBandProps {
  sports: SportWithInterest[];
  leagues: LeagueWithInterest[];
  teams: TeamWithInterest[];
  schools: SchoolWithInterest[];
  people: Person[];
  olympicsPrefs: OlympicsPreference[];
}

export default function FeedSelectionBand({
  sports,
  leagues,
  teams,
  schools,
  people,
  olympicsPrefs,
}: FeedSelectionBandProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const hasItems = sports.length > 0 || leagues.length > 0 || teams.length > 0 || 
                   schools.length > 0 || people.length > 0 || olympicsPrefs.length > 0;

  useEffect(() => {
    if (!hasItems) return;
    
    const checkScroll = () => {
      const container = scrollContainerRef.current;
      if (container) {
        const { scrollLeft, scrollWidth, clientWidth } = container;
        setShowLeftArrow(scrollLeft > 5);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      checkScroll();
      container.addEventListener('scroll', checkScroll);
      const resizeObserver = new ResizeObserver(checkScroll);
      resizeObserver.observe(container);
      return () => {
        container.removeEventListener('scroll', checkScroll);
        resizeObserver.disconnect();
      };
    }
  }, [sports, leagues, teams, schools, people, olympicsPrefs, hasItems]);

  if (!hasItems) {
    return null;
  }

  const getPersonLogo = (person: Person) => {
    if (person.teams?.logo_url) return person.teams.logo_url;
    if (person.schools?.logo_url) return person.schools.logo_url;
    if (person.leagues?.logo_url) return person.leagues.logo_url;
    if (person.sports?.logo_url) return person.sports.logo_url;
    return null;
  };

  return (
    <div className="w-full relative">
      {/* Left scroll indicator */}
      {showLeftArrow && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
      
      {/* Right scroll indicator */}
      {showRightArrow && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      )}

      <div 
        ref={scrollContainerRef}
        className="flex gap-2 pb-3 px-1 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Sports */}
        {sports.map(sport => (
            <SelectionCard
              key={`sport-${sport.id}`}
              logoUrl={sport.logo_url}
              label={sport.display_label || toTitleCase(sport.sport)}
              interestId={sport.interestId}
            />
          ))}
          
          {/* Leagues */}
          {leagues.map(league => (
            <SelectionCard
              key={`league-${league.id}`}
              logoUrl={league.logo_url}
              label={league.code || league.name}
              interestId={league.interestId}
            />
          ))}
          
          {/* Teams */}
          {teams.map(team => (
            <SelectionCard
              key={`team-${team.id}`}
              logoUrl={team.logo_url}
              label={team.nickname || team.display_name}
              interestId={team.interestId}
            />
          ))}
          
          {/* Schools */}
          {schools.map(school => (
            <SelectionCard
              key={`school-${school.id}`}
              logoUrl={school.logo_url}
              label={school.short_name}
              sublabel={school.league_code || "all"}
              interestId={school.interestId}
            />
          ))}
          
          {/* Olympics */}
          {olympicsPrefs.map(pref => (
            <SelectionCard
              key={`olympics-${pref.id}`}
              logoUrl={pref.sport_logo || pref.country_logo}
              label={pref.sport_name ? toTitleCase(pref.sport_name) : "Olympics"}
              sublabel={pref.country_name || "All"}
              interestId={pref.id}
            />
          ))}
          
          {/* People */}
          {people.map(person => {
            const nameParts = person.name.split(' ');
            const firstName = nameParts.slice(0, -1).join(' ') || nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
            return (
              <SelectionCard
                key={`person-${person.id}`}
                logoUrl={getPersonLogo(person)}
                label={firstName}
                sublabel={lastName}
                interestId={person.interestId}
              />
            );
          })}
      </div>
    </div>
  );
}
