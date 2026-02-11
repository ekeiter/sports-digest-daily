import blimpLogo from "@/assets/sportsdig-blimp-logo.png";

/**
 * Fallback placeholder for articles without thumbnails.
 * Displays the SportsDig blimp logo on the grey background.
 */
export default function ArticlePlaceholder() {
  return (
    <div 
      className="w-full aspect-video flex items-center justify-center bg-page-bg"
    >
      <img 
        src={blimpLogo} 
        alt="SportsDig" 
        className="h-24 md:h-28 object-contain"
      />
    </div>
  );
}
