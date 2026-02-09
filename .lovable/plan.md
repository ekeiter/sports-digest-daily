# Full Plan: Ad Integration + App Store Publishing (v2)

Updated to address native ad limitations, build-time config, consent, and signing.

---

## Key Decision: Native Advanced Ads Not Supported by Plugin

**Finding:** `@capacitor-community/admob` supports **Banner, Interstitial, and Rewarded** ads only. It does **NOT** support Native Advanced ads (GitHub issue #110, closed without implementation).

**Options:**

| Option | Effort | Result |
|--------|--------|--------|
| A) Use **Banner ads** in feed via `@capacitor-community/admob` | Low | Works now, less seamless look |
| B) Use **`capacitor-admob-ads`** (3rd party, claims Native support) | Medium | Android only, less maintained |
| C) Write **custom native code** (Swift/Kotlin) for Native Advanced | High | Best UX, full control |

**Recommendation:** Start with **Option A (Banner)** to get ads running quickly. Migrate to **Option C** later if you want true native-blended ads. The web side uses AdSense regardless.

---

## Overview

| Platform | Ad System | Ad Format | How Users Get Updates |
|----------|-----------|-----------|----------------------|
| Web | Google AdSense | Responsive display | Instant (publish) |
| iOS App | Google AdMob | Banner (upgrade to Native later) | App Store update |
| Android App | Google AdMob | Banner (upgrade to Native later) | Play Store update |

---

## Phase 1: Ad Integration in Code ✅ DONE

- ✅ Installed `@capacitor-community/admob`
- ✅ Created `src/hooks/usePlatform.ts` (platform detection)
- ✅ Created `src/components/ads/NativeAdBanner.tsx` (AdMob Banner)
- ✅ Created `src/components/ads/WebAdBanner.tsx` (AdSense)
- ✅ Created `src/components/ads/FeedAd.tsx` (unified component)
- ✅ Modified `src/pages/Feed.tsx` (ads every 5 articles)
- ✅ Created `src/lib/adInit.ts` (AdMob initialization)
- ✅ Integrated initialization in `src/App.tsx`

---

## Phase 2: Configure Ad Networks

### 2.1 Google AdMob Setup (for Native Apps)

From your AdMob account (apps.admob.com):

1. Create two apps: one for iOS, one for Android
2. Get your **App IDs** (format: `ca-app-pub-XXXXXXXX~YYYYYYYY`)
3. Create **Banner** ad units and get **Ad Unit IDs**
   - Note: You created a "Native Advanced" unit — you'll need a **Banner** unit instead (or keep both for future use)

### 2.2 Google AdSense Setup (for Web)

From your AdSense account:

1. Get your **Publisher ID** (format: `ca-pub-XXXXXXXXXX`)
2. Create ad units for the feed
3. Get the ad unit code snippet

### 2.3 Where IDs are stored

**⚠️ IMPORTANT: AdMob App IDs are NOT secrets — they must be baked into native config at build time.**

| ID | Where it goes | Why |
|----|---------------|-----|
| `ADMOB_APP_ID_IOS` | `ios/App/App/Info.plist` → `GADApplicationIdentifier` | Required at app launch by Google SDK |
| `ADMOB_APP_ID_ANDROID` | `android/app/src/main/AndroidManifest.xml` → `com.google.android.gms.ads.APPLICATION_ID` | Required at app launch by Google SDK |
| `ADMOB_BANNER_ID_IOS` | Hardcoded in app or fetched via remote config | Not a secret (ad unit IDs are safe to embed) |
| `ADMOB_BANNER_ID_ANDROID` | Hardcoded in app or fetched via remote config | Not a secret (ad unit IDs are safe to embed) |
| `ADSENSE_PUBLISHER_ID` | `index.html` script tag (publishable) | Public by nature |
| `ADSENSE_AD_SLOT` | Component prop (publishable) | Public by nature |

**Ad unit IDs** are not sensitive — Google explicitly says they can be in your source code. They only identify *where* revenue goes, not authentication.

---

## Phase 3: Native Platform Configuration

### 3.1 iOS Configuration

After running `npx cap add ios`, update `ios/App/App/Info.plist`:

```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-XXXXXXXX~YYYYYYYY</string>
<key>SKAdNetworkItems</key>
<array>
  <dict>
    <key>SKAdNetworkIdentifier</key>
    <string>cstr6suwn9.skadnetwork</string>
  </dict>
</array>
```

### 3.2 Android Configuration

After running `npx cap add android`, update `android/app/src/main/AndroidManifest.xml`:

```xml
<application>
  <meta-data
      android:name="com.google.android.gms.ads.APPLICATION_ID"
      android:value="ca-app-pub-XXXXXXXX~YYYYYYYY"/>
</application>
```

### 3.3 Initialize AdMob on App Start ✅ DONE

Already handled in `src/lib/adInit.ts`, called from `src/App.tsx`.

---

## Phase 4: Consent & Privacy (NEW)

### 4.1 Google UMP (User Messaging Platform)

Required for GDPR/EEA compliance with AdMob:

- `@capacitor-community/admob` has built-in UMP support
- Call consent flow before showing ads
- Configure GDPR message in AdMob console → Privacy & messaging

```typescript
// Already supported by the plugin:
import { AdMob } from '@capacitor-community/admob';

// Show consent form if required (call before showing ads)
const consentInfo = await AdMob.requestConsentInfo();
if (consentInfo.isConsentFormAvailable) {
  await AdMob.showConsentForm();
}
```

### 4.2 App Tracking Transparency (iOS)

For iOS 14+, if using personalized ads:

- Add `NSUserTrackingUsageDescription` to Info.plist
- The AdMob plugin handles the ATT prompt via `requestTrackingAuthorization`
- Alternative: Run with "non-personalized ads only" initially (no ATT prompt needed)

### 4.3 Privacy Policy

**Required for both app stores.** Must disclose:

- Ad networks used (Google AdMob, AdSense)
- Data collection for ad personalization
- How to opt out
- Host at a public URL (e.g., `sportsdig.lovable.app/privacy`)

### 4.4 App Store Privacy Disclosures

- **Apple:** App Privacy "nutrition labels" in App Store Connect
- **Google:** Data safety section in Play Console
- Both require declaring what data AdMob collects (device ID, usage data, etc.)

---

## Phase 5: App Store Assets

### 5.1 Required Assets (prepare outside Lovable)

**App Icons:**
- iOS: 1024x1024px (App Store), plus various sizes
- Android: 512x512px (Play Store), plus adaptive icon layers

**Screenshots:**
- iOS: Various device sizes (iPhone, iPad)
- Android: Phone and tablet sizes

**App Store Metadata:**
- App name: SportsDig (or "SportsDig - Sports News")
- Short description (80 chars)
- Full description (4000 chars)
- Keywords
- Privacy policy URL (required)
- Support URL

### 5.2 Splash Screen

Update `capacitor.config.ts` to configure splash screen branding.

---

## Phase 6: Build and Submit

### 6.1 Prepare Capacitor Config

Update `capacitor.config.ts` for production (remove dev server URL if present):

```typescript
const config: CapacitorConfig = {
  appId: 'com.sportsdig.app',
  appName: 'SportsDig',
  webDir: 'dist',
};
```

### 6.2 Local Build Process

```bash
npm install
npm run build
npx cap sync
npx cap open ios     # Opens Xcode
npx cap open android # Opens Android Studio
```

### 6.3 iOS Submission

1. In Xcode: Set version/build number, signing team
2. Archive the app (Product → Archive)
3. Upload to App Store Connect
4. Fill in metadata, screenshots, privacy disclosures
5. Submit for review (1-3 days typically)

### 6.4 Android Submission

1. In Android Studio: Configure Gradle signing (keystore + signing config in `build.gradle`)
   - **Note:** Capacitor config does NOT handle signing. Use Android Studio's built-in signing or Gradle `signingConfigs`.
   - Enroll in **Play App Signing** (recommended by Google)
2. Generate signed AAB via Build → Generate Signed Bundle
3. Upload to Google Play Console
4. Fill in store listing, screenshots, data safety section
5. Submit for review

---

## Phase 7: Ongoing Updates

### Your Workflow

1. **Make changes in Lovable** — develop as normal
2. **Web updates** — click Publish, users see changes immediately
3. **Native updates** — pull from GitHub, `npm run build && npx cap sync`, bump versions, submit to stores

### When You MUST Submit Store Updates

- Changes to native plugins (new Capacitor features)
- Changes to app icons or splash screens
- Critical bug fixes in native-specific code

### When Store Updates Are Usually NOT Needed

- UI changes, new features, content updates
- These load from your web server automatically
- **Caveat:** Apple reviews Capacitor/webview apps more carefully. Major feature changes that alter core app behavior *could* trigger review concerns. Keep web updates focused on content/UI refinements rather than fundamental behavior changes.

---

## Stack Reference

- **Capacitor:** v7.4.3
- **Framework:** React 18 + Vite + TypeScript
- **AdMob Plugin:** `@capacitor-community/admob` v8.0.0
- **Ad Formats Supported:** Banner, Interstitial, Rewarded (NOT Native Advanced)
- **Web Ads:** Google AdSense (responsive display units)
