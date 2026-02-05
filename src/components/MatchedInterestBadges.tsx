import { Badge } from "@/components/ui/badge";

// Shorten interest labels similar to favorite boxes
const shortenLabel = (label: string): string => {
  // Abbreviate Olympics
  let shortened = label.replace(/Olympics/gi, "Olym");
  
  // Remove common city prefixes for teams (e.g., "Philadelphia Eagles" → "Eagles")
  // This regex matches "City Name Team" patterns and keeps just the team name
  const cityTeamPattern = /^(New York|Los Angeles|San Francisco|San Diego|San Jose|San Antonio|Las Vegas|Kansas City|Oklahoma City|Salt Lake|Green Bay|Tampa Bay|New Orleans|New England|Golden State|Minnesota|Philadelphia|Pittsburgh|Baltimore|Cincinnati|Cleveland|Detroit|Chicago|Boston|Miami|Atlanta|Houston|Dallas|Denver|Phoenix|Seattle|Portland|Milwaukee|Indianapolis|Charlotte|Orlando|Memphis|Sacramento|Toronto|Vancouver|Montreal|Calgary|Edmonton|Ottawa|Winnipeg|Washington|Arizona|Colorado|Carolina|Tennessee|Jacksonville|Buffalo|Brooklyn|St\. Louis)\s+/i;
  shortened = shortened.replace(cityTeamPattern, "");
  
  return shortened;
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
      {interests.map((interest, index) => (
        <Badge 
          key={index} 
          variant="secondary" 
          className="text-xs px-1.5 py-0 h-5 font-normal bg-badge-interest text-badge-interest-foreground border-badge-interest"
        >
          #{shortenLabel(interest)}
        </Badge>
      ))}
    </div>
  );
}
