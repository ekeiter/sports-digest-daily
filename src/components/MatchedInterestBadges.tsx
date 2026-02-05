import { Badge } from "@/components/ui/badge";

interface MatchedInterestBadgesProps {
  interests: string[] | null;
}

export default function MatchedInterestBadges({ interests }: MatchedInterestBadgesProps) {
  if (!interests || interests.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {interests.map((interest, index) => (
        <Badge 
          key={index} 
          variant="secondary" 
          className="text-xs px-1.5 py-0 h-5 font-normal bg-badge-interest text-badge-interest-foreground border-badge-interest"
        >
          #{interest}
        </Badge>
      ))}
    </div>
  );
}
