import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

/**
 * Opens a URL using Capacitor's InAppBrowser on native platforms,
 * or falls back to window.open on web.
 */
export const openUrl = async (url: string) => {
  if (Capacitor.isNativePlatform()) {
    // Use Capacitor Browser plugin for native apps - opens in-app browser with close button
    await Browser.open({ 
      url,
      presentationStyle: 'fullscreen',
      toolbarColor: '#000000'
    });
  } else {
    // Fall back to standard behavior for web
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
