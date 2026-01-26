import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
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
  onDelete?: () => void;
  isDeleteMode?: boolean;
}

function SelectionCard({ logoUrl, label, sublabel, interestId, onDelete, isDeleteMode }: SelectionCardProps) {
  const navigate = useNavigate();
  const hasSublabel = !!sublabel;
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const handleMouseDown = () => {
    // Only for touch/mobile - start long press timer
    longPressTimer.current = setTimeout(() => {
      setIsLongPressing(true);
    }, 500);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleClick = () => {
    if (isLongPressing || isDeleteMode) {
      // In delete mode, clicking deletes
      if (onDelete) onDelete();
      setIsLongPressing(false);
    } else {
      navigate(`/feed?focus=${interestId}`);
    }
  };

  // Reset long press state when delete mode changes externally
  useEffect(() => {
    if (!isDeleteMode) {
      setIsLongPressing(false);
    }
  }, [isDeleteMode]);

  const showDeleteOverlay = isDeleteMode || isLongPressing;

  return (
    <div className="relative flex-shrink-0">
      {/* Desktop X button - only on lg+ screens, positioned inside the card */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="hidden lg:flex absolute top-0.5 right-0.5 z-10 w-4 h-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
          title="Remove from favorites"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
      
      <button
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        className={`flex flex-col items-center w-16 h-14 md:w-20 md:h-[72px] lg:w-24 lg:h-[84px] p-0.5 md:p-1 lg:p-1.5 rounded-md bg-card border border-border hover:bg-accent transition-colors select-none ${hasSublabel ? 'justify-start' : 'justify-center'} ${showDeleteOverlay ? 'animate-wiggle lg:animate-none' : ''}`}
      >
        <div className="w-7 h-7 md:w-9 md:h-9 lg:w-11 lg:h-11 flex items-center justify-center">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="" 
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 rounded-full bg-muted" />
          )}
        </div>
        <span className="text-[9px] md:text-[11px] lg:text-xs font-semibold text-center line-clamp-1 leading-tight text-foreground">
          {label}
        </span>
        {sublabel && (
          <span className="text-[9px] md:text-[11px] lg:text-xs font-semibold text-center line-clamp-1 leading-tight text-foreground">
            {sublabel}
          </span>
        )}
      </button>
      
      {/* Mobile/Tablet delete overlay - shows on long press */}
      {showDeleteOverlay && onDelete && (
        <div className="lg:hidden absolute -top-1 -right-1 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
              setIsLongPressing(false);
            }}
            className="w-5 h-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

interface FeedSelectionBandProps {
  sports: SportWithInterest[];
  leagues: LeagueWithInterest[];
  teams: TeamWithInterest[];
  schools: SchoolWithInterest[];
  people: Person[];
  olympicsPrefs: OlympicsPreference[];
  onDeleteSport?: (id: number) => void;
  onDeleteLeague?: (id: number) => void;
  onDeleteTeam?: (id: number) => void;
  onDeleteSchool?: (id: number, leagueId?: number) => void;
  onDeletePerson?: (id: number) => void;
  onDeleteOlympics?: (id: number) => void;
}

export default function FeedSelectionBand({
  sports,
  leagues,
  teams,
  schools,
  people,
  olympicsPrefs,
  onDeleteSport,
  onDeleteLeague,
  onDeleteTeam,
  onDeleteSchool,
  onDeletePerson,
  onDeleteOlympics,
}: FeedSelectionBandProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };
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
    <div className="w-full">
      <div 
        ref={scrollContainerRef}
        className="flex gap-1 pb-1 px-1 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Sports */}
        {sports.map(sport => (
            <SelectionCard
              key={`sport-${sport.id}`}
              logoUrl={sport.logo_url}
              label={sport.display_label || toTitleCase(sport.sport)}
              interestId={sport.interestId}
              onDelete={onDeleteSport ? () => onDeleteSport(sport.id) : undefined}
            />
          ))}
          
          {/* Leagues */}
          {leagues.map(league => (
            <SelectionCard
              key={`league-${league.id}`}
              logoUrl={league.logo_url}
              label={league.code || league.name}
              interestId={league.interestId}
              onDelete={onDeleteLeague ? () => onDeleteLeague(league.id) : undefined}
            />
          ))}
          
          {/* Teams */}
          {teams.map(team => (
            <SelectionCard
              key={`team-${team.id}`}
              logoUrl={team.logo_url}
              label={team.nickname || team.display_name}
              interestId={team.interestId}
              onDelete={onDeleteTeam ? () => onDeleteTeam(team.id) : undefined}
            />
          ))}
          
          {/* Schools */}
          {schools.map(school => (
            <SelectionCard
              key={`school-${school.id}`}
              logoUrl={school.logo_url}
              label={school.short_name}
              sublabel={school.league_code || "All Sports"}
              interestId={school.interestId}
              onDelete={onDeleteSchool ? () => onDeleteSchool(school.id, school.league_id) : undefined}
            />
          ))}
          
          {/* Olympics */}
          {olympicsPrefs.map(pref => (
            <SelectionCard
              key={`olympics-${pref.id}`}
              logoUrl="https://upload.wikimedia.org/wikipedia/commons/5/5c/Olympic_rings_without_rims.svg"
              label={pref.sport_name ? toTitleCase(pref.sport_name) : "Olympics"}
              sublabel={pref.country_name || "All"}
              interestId={pref.id}
              onDelete={onDeleteOlympics ? () => onDeleteOlympics(pref.id) : undefined}
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
                onDelete={onDeletePerson ? () => onDeletePerson(person.id) : undefined}
              />
            );
          })}
      </div>
      
      {/* Scroll indicators below cards */}
      {(showLeftArrow || showRightArrow) && (
        <div className="flex justify-between items-center px-2 pt-1">
          <button 
            onClick={scrollLeft}
            className="w-6 h-6 flex items-center justify-center hover:bg-accent rounded transition-colors disabled:opacity-30"
            disabled={!showLeftArrow}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="lg:hidden text-[10px] text-foreground">
            scroll right/left, press &amp; hold to delete
          </span>
          <span className="hidden lg:block text-[10px] text-foreground">
            scroll right/left
          </span>
          <button 
            onClick={scrollRight}
            className="w-6 h-6 flex items-center justify-center hover:bg-accent rounded transition-colors disabled:opacity-30"
            disabled={!showRightArrow}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}
