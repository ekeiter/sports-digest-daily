

## Update Capacitor App ID and App Name

Two changes needed in `capacitor.config.ts`:

1. **App ID**: `app.lovable.a91799b00a46440b83a7558b463f6a82` → `com.sportsdig.app`
2. **App Name**: `sports-digest-daily` → `SportsDig`

### Important Notes

- After this change, you'll need to **re-add** the native platforms (`npx cap add android` / `npx cap add ios`) since changing the App ID creates a new app identity. The old native folders won't match.
- Make sure the App ID `com.sportsdig.app` matches exactly what you registered in Google Play Console and Apple Developer portal.
- This is a one-line config file edit in `capacitor.config.ts`.

