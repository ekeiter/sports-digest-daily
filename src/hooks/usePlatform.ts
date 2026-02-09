import { Capacitor } from '@capacitor/core';

export type Platform = 'ios' | 'android' | 'web';

export const usePlatform = () => {
  const getPlatform = (): Platform => {
    if (Capacitor.isNativePlatform()) {
      return Capacitor.getPlatform() as 'ios' | 'android';
    }
    return 'web';
  };

  const platform = getPlatform();
  
  return {
    platform,
    isNative: platform === 'ios' || platform === 'android',
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isWeb: platform === 'web',
  };
};

// Non-hook version for use outside of React components
export const getPlatformInfo = () => {
  const platform: Platform = Capacitor.isNativePlatform() 
    ? (Capacitor.getPlatform() as 'ios' | 'android')
    : 'web';
  
  return {
    platform,
    isNative: platform === 'ios' || platform === 'android',
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isWeb: platform === 'web',
  };
};
