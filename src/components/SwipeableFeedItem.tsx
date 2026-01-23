import { useState, useRef, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Focus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface SwipeableFeedItemProps {
  children: ReactNode;
  focusType: 'sport' | 'league' | 'team' | 'person' | 'school' | 'olympics';
  focusId: number;
  onDelete?: () => void;
  deleteButton?: ReactNode;
}

export default function SwipeableFeedItem({
  children,
  focusType,
  focusId,
  deleteButton,
}: SwipeableFeedItemProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [translateX, setTranslateX] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const SWIPE_THRESHOLD = 80;
  const REVEAL_WIDTH = 100;

  const handleFocus = () => {
    navigate(`/feed?focus=${focusType}-${focusId}`);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
    isHorizontalSwipe.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX.current;
    const diffY = currentY - touchStartY.current;

    // Determine if this is a horizontal or vertical swipe
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
        isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    // Only handle horizontal swipes
    if (isHorizontalSwipe.current) {
      e.preventDefault();
      
      // Allow swipe right (positive) to reveal action
      if (diffX > 0) {
        setTranslateX(Math.min(diffX, REVEAL_WIDTH + 20));
      } else if (isRevealed) {
        // If already revealed, allow swiping back left
        setTranslateX(Math.max(REVEAL_WIDTH + diffX, 0));
      }
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    isHorizontalSwipe.current = null;

    if (translateX > SWIPE_THRESHOLD) {
      // Reveal the action button
      setTranslateX(REVEAL_WIDTH);
      setIsRevealed(true);
    } else {
      // Snap back
      setTranslateX(0);
      setIsRevealed(false);
    }
  };

  const handleActionClick = () => {
    setTranslateX(0);
    setIsRevealed(false);
    handleFocus();
  };

  // Close when clicking elsewhere
  const handleContentClick = () => {
    if (isRevealed) {
      setTranslateX(0);
      setIsRevealed(false);
    }
  };

  // For tablet (md breakpoint: 768px-1024px), show both swipe and button
  // For desktop (lg+: 1024px+), show only button
  // For mobile (<768px), show only swipe

  return (
    <div className="relative overflow-hidden rounded-md">
      {/* Background action revealed on swipe (mobile/tablet only) */}
      <div 
        className="absolute inset-y-0 left-0 flex items-center bg-primary md:hidden"
        style={{ width: REVEAL_WIDTH }}
      >
        <button
          onClick={handleActionClick}
          className="w-full h-full flex items-center justify-center text-primary-foreground font-medium text-sm gap-1"
        >
          <Focus className="h-4 w-4" />
          <span>Focus</span>
        </button>
      </div>

      {/* Main content */}
      <div
        className="relative bg-card transition-transform duration-200 ease-out"
        style={{ 
          transform: isMobile ? `translateX(${translateX}px)` : 'none',
        }}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
        onClick={handleContentClick}
      >
        <div className="flex items-center gap-2 px-2 py-1 border rounded-md">
          {children}
          
          {/* Focus button - visible on tablet and desktop */}
          <Button
            size="sm"
            variant="ghost"
            className="hidden md:flex h-7 px-2 text-primary hover:text-primary hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation();
              handleFocus();
            }}
            title="Focus on this"
          >
            <Focus className="h-4 w-4" />
            <span className="ml-1 hidden lg:inline text-xs">Focus</span>
          </Button>
          
          {/* Delete button passed from parent */}
          {deleteButton}
        </div>
      </div>
    </div>
  );
}
