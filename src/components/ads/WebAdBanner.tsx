import { useEffect, useRef, useState } from 'react';

interface WebAdBannerProps {
  adSlot?: string;
  adClient?: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export const WebAdBanner = ({ 
  adSlot,
  adClient,
  format = 'auto',
  responsive = true,
}: WebAdBannerProps) => {
  const adRef = useRef<HTMLModElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    // Don't try to load if we don't have required props
    if (!adSlot || !adClient) {
      console.log('[WebAdBanner] Missing adSlot or adClient, showing placeholder');
      return;
    }

    try {
      // Push the ad to AdSense
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      setAdLoaded(true);
    } catch (error) {
      console.error('[WebAdBanner] Error loading ad:', error);
      setAdError(true);
    }
  }, [adSlot, adClient]);

  // Show placeholder if no ad configuration
  if (!adSlot || !adClient) {
    return (
      <div className="w-full py-4 bg-muted/30 flex items-center justify-center">
        <div className="text-xs text-muted-foreground px-4 py-2 border border-dashed border-muted-foreground/30 rounded">
          Ad Space
        </div>
      </div>
    );
  }

  if (adError) {
    return (
      <div className="w-full py-2 bg-muted/30 flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Ad unavailable</span>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden bg-muted/30">
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ 
          display: 'block',
          minHeight: responsive ? 'auto' : 90,
        }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
};
