import blimpLogo from "@/assets/sportsdig-blimp-logo.png";

/**
 * Fallback placeholder for articles without thumbnails.
 * Displays the SportsDig blimp logo on the grey background.
 */
export default function ArticlePlaceholder() {
  return (
    <div 
      className="w-full aspect-video flex items-center justify-center"
      style={{ backgroundColor: '#D5D5D5' }}
    >
      <img 
        src={blimpLogo} 
        alt="SportsDig" 
        className="h-16 md:h-20 object-contain"
      />
    </div>
  );
}
