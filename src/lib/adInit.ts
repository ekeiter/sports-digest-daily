import { AdMob } from '@capacitor-community/admob';
import { getPlatformInfo } from '@/hooks/usePlatform';

export const initializeAds = async (): Promise<void> => {
  const { isNative } = getPlatformInfo();
  
  if (!isNative) {
    // Web ads are initialized via script tag in index.html
    console.log('[Ads] Running on web, AdSense will handle initialization');
    return;
  }

  try {
    await AdMob.initialize({
      // Request tracking authorization for iOS 14+
      // Set to false to disable IDFA tracking request
      initializeForTesting: false,
    });
    console.log('[Ads] AdMob initialized successfully');
  } catch (error) {
    console.error('[Ads] Failed to initialize AdMob:', error);
  }
};
