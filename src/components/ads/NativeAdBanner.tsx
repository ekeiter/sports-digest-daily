import { useEffect, useState } from 'react';
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { usePlatform } from '@/hooks/usePlatform';

interface NativeAdBannerProps {
  adUnitId?: string;
  position?: 'top' | 'bottom' | 'inline';
}

export const NativeAdBanner = ({ adUnitId, position = 'inline' }: NativeAdBannerProps) => {
  const { isNative, isIOS } = usePlatform();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);

  useEffect(() => {
    if (!isNative) return;

    const showBanner = async () => {
      try {
        // Use test ad unit IDs in development, real IDs from environment in production
        const testAdUnitId = isIOS 
          ? 'ca-app-pub-3940256099942544/2934735716' // iOS test banner
          : 'ca-app-pub-3940256099942544/6300978111'; // Android test banner
        
        const options: BannerAdOptions = {
          adId: adUnitId || testAdUnitId,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: position === 'top' 
            ? BannerAdPosition.TOP_CENTER 
            : BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          isTesting: !adUnitId, // Use test mode if no real ad unit provided
        };

        await AdMob.showBanner(options);
        setAdLoaded(true);
      } catch (error) {
        console.error('[NativeAdBanner] Error showing banner:', error);
        setAdError(error instanceof Error ? error.message : 'Failed to load ad');
      }
    };

    showBanner();

    // Cleanup: hide banner when component unmounts
    return () => {
      AdMob.hideBanner().catch(console.error);
    };
  }, [isNative, isIOS, adUnitId, position]);

  // For inline ads, we need to reserve space
  if (position === 'inline') {
    return (
      <div 
        className="w-full bg-muted/30 flex items-center justify-center overflow-hidden"
        style={{ minHeight: adLoaded ? 60 : 0 }}
      >
        {adError && (
          <span className="text-xs text-muted-foreground">Ad unavailable</span>
        )}
      </div>
    );
  }

  // For top/bottom positioned ads, the native layer handles positioning
  return null;
};
