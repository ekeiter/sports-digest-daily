

# Full Plan: Ad Integration + App Store Publishing

This plan covers everything needed to monetize SportsDig with ads and publish to iOS App Store and Google Play Store, while maintaining the web version.

---

## Overview

You'll have three distribution channels, each with its own ad system:

| Platform | Ad System | How Users Get Updates |
|----------|-----------|----------------------|
| Web (sportsdig.lovable.app) | Google AdSense | Instant (you publish, they see it) |
| iOS App (App Store) | Google AdMob | App Store update (Apple review 1-3 days) |
| Android App (Play Store) | Google AdMob | Play Store update (Google review 1-2 days) |

---

## Phase 1: Ad Integration in Code

### 1.1 Install AdMob Plugin

Add the Capacitor AdMob community plugin for native ads:

```bash
npm install @capacitor-community/admob
```

### 1.2 Create Platform Detection Hook

Create a new hook `src/hooks/usePlatform.ts` that detects whether the app is running on web, iOS, or Android. This will be used to show the right type of ad.

### 1.3 Create Ad Components

**Native Ad Component** (`src/components/ads/NativeAdBanner.tsx`)
- Uses `@capacitor-community/admob` for iOS/Android
- Shows banner ads that blend into the feed
- Only renders on native platforms

**Web Ad Component** (`src/components/ads/WebAdBanner.tsx`)
- Loads Google AdSense script
- Shows responsive ad units
- Only renders on web

**Unified Ad Component** (`src/components/ads/FeedAd.tsx`)
- Detects platform automatically
- Renders either NativeAdBanner or WebAdBanner
- Single component you place in the feed

### 1.4 Insert Ads in Feed

Modify `src/pages/Feed.tsx` to insert ad components every N articles (e.g., after every 5th article). The feed will look like:

```text
Article 1
Article 2
Article 3
Article 4
Article 5
[AD]
Article 6
Article 7
...
```

---

## Phase 2: Configure Ad Networks

### 2.1 Google AdMob Setup (for Native Apps)

From your AdMob account (apps.admob.com), you'll need to:

1. Create two apps: one for iOS, one for Android
2. Get your **App IDs** (format: `ca-app-pub-XXXXXXXX~YYYYYYYY`)
3. Create ad units (Banner recommended for feed) and get **Ad Unit IDs**

These will be stored as Supabase secrets so they're not in the code.

### 2.2 Google AdSense Setup (for Web)

From your AdSense account:

1. Get your **Publisher ID** (format: `ca-pub-XXXXXXXXXX`)
2. Create ad units for the feed
3. Get the ad unit code snippet

### 2.3 Store Ad IDs as Secrets

I'll set up the following secrets in your Supabase/Cloud configuration:

| Secret Name | Purpose |
|-------------|---------|
| `ADMOB_APP_ID_IOS` | iOS app identifier |
| `ADMOB_APP_ID_ANDROID` | Android app identifier |
| `ADMOB_BANNER_ID_IOS` | iOS banner ad unit |
| `ADMOB_BANNER_ID_ANDROID` | Android banner ad unit |
| `ADSENSE_PUBLISHER_ID` | Web publisher ID |
| `ADSENSE_AD_SLOT` | Web ad unit slot |

---

## Phase 3: Native Platform Configuration

### 3.1 iOS Configuration

Update `ios/App/App/Info.plist` (after you run `npx cap add ios`) to include:

```xml
<key>GADApplicationIdentifier</key>
<string>YOUR_ADMOB_IOS_APP_ID</string>
<key>SKAdNetworkItems</key>
<!-- Required network identifiers for ad attribution -->
```

### 3.2 Android Configuration

Update `android/app/src/main/AndroidManifest.xml` to include:

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="YOUR_ADMOB_ANDROID_APP_ID"/>
```

### 3.3 Initialize AdMob on App Start

Create an initialization function in `src/lib/adInit.ts` that runs when the app starts on native platforms:

```typescript
import { AdMob } from '@capacitor-community/admob';

export const initializeAds = async () => {
  if (Capacitor.isNativePlatform()) {
    await AdMob.initialize();
  }
};
```

Call this from `src/main.tsx` or `src/App.tsx`.

---

## Phase 4: App Store Assets

### 4.1 Required Assets

You'll need to prepare these outside of Lovable:

**App Icons:**
- iOS: 1024x1024px (App Store), plus various sizes for the app
- Android: 512x512px (Play Store), plus adaptive icon layers

**Screenshots:**
- iOS: Various sizes for different devices (iPhone, iPad)
- Android: Phone and tablet sizes

**App Store Metadata:**
- App name: SportsDig (or "SportsDig - Sports News")
- Short description (80 chars)
- Full description (4000 chars)
- Keywords
- Privacy policy URL (required)
- Support URL

### 4.2 Splash Screen

Update `capacitor.config.ts` to configure the splash screen with your branding.

---

## Phase 5: Build and Submit

### 5.1 Prepare Capacitor Config

Update `capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  appId: 'com.sportsdig.app', // Use your own bundle ID
  appName: 'SportsDig',
  webDir: 'dist',
  // Remove hot-reload server config for production
};
```

### 5.2 Local Build Process

After exporting to GitHub and pulling locally:

```bash
# Install dependencies
npm install

# Build the web app
npm run build

# Sync to native platforms
npx cap sync

# Open in IDE
npx cap open ios     # Opens Xcode
npx cap open android # Opens Android Studio
```

### 5.3 iOS Submission

1. In Xcode: Set version/build number, signing team
2. Archive the app (Product > Archive)
3. Upload to App Store Connect
4. Fill in metadata, add screenshots
5. Submit for review (1-3 days typically)

### 5.4 Android Submission

1. In Android Studio: Generate signed AAB (already configured in your capacitor.config.ts)
2. Upload to Google Play Console
3. Fill in store listing, add screenshots
4. Submit for review (typically faster than iOS)

---

## Phase 6: Ongoing Updates

### Your Workflow Going Forward

1. **Make changes in Lovable** - continue developing as normal
2. **Web updates** - click Publish, users see changes immediately
3. **Native updates** - when you need to push a native update:
   - Pull latest from GitHub
   - Run `npm run build && npx cap sync`
   - Bump version numbers
   - Archive and upload to stores
   - Users update through their app store

### When You MUST Submit Store Updates

- Changes to native plugins (adding new Capacitor features)
- Changes to app icons or splash screens
- Critical bug fixes in native-specific code

### When You DON'T Need Store Updates

- UI changes, new features, content updates
- These load from your web server and update automatically

---

## Technical Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/usePlatform.ts` | Platform detection utility |
| `src/lib/adInit.ts` | AdMob initialization for native |
| `src/components/ads/NativeAdBanner.tsx` | AdMob banner for iOS/Android |
| `src/components/ads/WebAdBanner.tsx` | AdSense banner for web |
| `src/components/ads/FeedAd.tsx` | Unified ad component |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Feed.tsx` | Insert FeedAd components between articles |
| `src/App.tsx` or `src/main.tsx` | Initialize ads on app start |
| `capacitor.config.ts` | Production configuration |
| `index.html` | Add AdSense script tag |

### Dependencies to Add

```bash
npm install @capacitor-community/admob
```

---

## Next Steps After Approval

1. I'll set up the secrets storage for your ad IDs
2. Create the ad components and platform detection
3. Integrate ads into the feed
4. Update configurations for production

You'll then need to:
- Provide your AdMob App IDs and Ad Unit IDs
- Provide your AdSense Publisher ID
- Prepare app icons and screenshots
- Create a privacy policy page
- Export to GitHub and build locally for store submission

