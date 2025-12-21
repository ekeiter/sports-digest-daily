/**
 * Fallback placeholder for articles without thumbnails.
 * Displays the SportsDig logo text on the brand gradient background.
 */
export default function ArticlePlaceholder() {
  return (
    <div 
      className="w-full aspect-video flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #00ff88 0%, #00bfff 50%, #0044ff 100%)'
      }}
    >
      <span className="font-racing text-3xl md:text-4xl text-white drop-shadow-lg">
        SportsDig
      </span>
    </div>
  );
}
