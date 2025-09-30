import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a91799b00a46440b83a7558b463f6a82',
  appName: 'sports-digest-daily',
  webDir: 'dist',
  server: {
    url: 'https://a91799b0-0a46-440b-83a7-558b463f6a82.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    buildOptions: {
      releaseType: 'AAB'
    }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;