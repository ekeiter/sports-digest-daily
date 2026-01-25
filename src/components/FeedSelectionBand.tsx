import { useNavigate } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
      className="flex flex-col items-center justify-start w-20 h-24 p-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors select-none flex-shrink-0"
    >
      <div className="w-12 h-12 flex items-center justify-center">
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt="" 
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted" />
        )}
      </div>
      <span className="text-xs font-medium text-center mt-1 line-clamp-2 leading-tight">
        {label}
      </span>
      {sublabel && (
        <span className="text-[10px] text-muted-foreground text-center leading-tight">
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
  const hasItems = sports.length > 0 || leagues.length > 0 || teams.length > 0 || 
                   schools.length > 0 || people.length > 0 || olympicsPrefs.length > 0;
  
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

  const getPersonContext = (person: Person) => {
    if (person.teams?.nickname) return person.teams.nickname;
    if (person.schools?.short_name) return person.schools.short_name;
    if (person.leagues?.code) return person.leagues.code;
    return "";
  };

  return (
    <div className="w-full">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-3 px-1">
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
          {people.map(person => (
            <SelectionCard
              key={`person-${person.id}`}
              logoUrl={getPersonLogo(person)}
              label={person.name.split(' ').slice(-1)[0]} // Last name only
              sublabel={getPersonContext(person)}
              interestId={person.interestId}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
