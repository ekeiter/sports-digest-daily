import { Badge } from "@/components/ui/badge";

// Helper to get M/W indicator for gendered college leagues
const getGenderIndicator = (leagueCode: string): string | null => {
  const maleLeagues = ['NCAAB', 'NCAAM', 'NCAAMH', 'NCAAMSOC'];
  const femaleLeagues = ['NCAAW', 'NCAAWH', 'NCAAWSOC', 'NCAASB'];
  if (maleLeagues.includes(leagueCode)) return 'M';
  if (femaleLeagues.includes(leagueCode)) return 'W';
  return null;
};

interface ParsedBadge {
  label: string;
  logoUrl?: string;
  gender?: string | null;
  type: 'plain' | 'school' | 'country';
}

// Parse a matched_interest label into structured badge data
// Formats from RPC:
//   "school:ShortName:LEAGUE_CODE:league_logo_url" → school with league logo + M/W
//   "country:LeagueName - CountryName:flag_url" → country with flag
//   anything else → plain text label
const parseBadge = (raw: string): ParsedBadge => {
  if (raw.startsWith('school:')) {
    const parts = raw.substring(7).split(':');
    // parts: [ShortName, LEAGUE_CODE, league_logo_url]
    const schoolName = parts[0] || '';
    const leagueCode = parts[1] || '';
    const logoUrl = parts[2] || '';
    const gender = getGenderIndicator(leagueCode);
    return {
      label: schoolName,
      logoUrl: logoUrl || undefined,
      gender,
      type: 'school',
    };
  }
  if (raw.startsWith('country:')) {
    const parts = raw.substring(8).split(':');
    // parts: [LeagueName - CountryName, flag_url]
    const label = parts[0] || '';
    const flagUrl = parts[1] || '';
    return {
      label,
      logoUrl: flagUrl || undefined,
      type: 'country',
    };
  }
  return { label: raw, type: 'plain' };
};

interface MatchedInterestBadgesProps {
  interests: string[] | null;
  className?: string;
}

export default function MatchedInterestBadges({ interests, className = "" }: MatchedInterestBadgesProps) {
  if (!interests || interests.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {interests.map((interest, index) => {
        const badge = parseBadge(interest);
        return (
          <Badge 
            key={index} 
            variant="secondary" 
            className="text-xs px-1.5 py-0 h-5 font-normal bg-badge-interest text-badge-interest-foreground border-badge-interest gap-1"
          >
            <span>#{badge.label}</span>
            {badge.type === 'school' && badge.logoUrl && (
              <img src={badge.logoUrl} alt="" className="h-3.5 w-3.5 object-contain" />
            )}
            {badge.type === 'school' && badge.gender && (
              <span className="font-semibold">{badge.gender}</span>
            )}
            {badge.type === 'country' && badge.logoUrl && (
              <img src={badge.logoUrl} alt="" className="h-3 w-4 object-contain" />
            )}
          </Badge>
        );
      })}
    </div>
  );
}
