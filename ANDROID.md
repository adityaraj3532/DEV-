# Dev Computer Android app

This project now includes a Capacitor Android application that bundles the existing Dev Computer UI. It runs on the phone without a localhost server. It is an Android WebView app, not a React Native rewrite.

## On Windows, in VS Code

Install Node.js 22 or later and Android Studio 2025.2.1 or later. In Android Studio's SDK Manager, install Android SDK Platform 36, the matching Build Tools, and Platform Tools. Use Android Studio's bundled JDK 21.

Open VS Code → Terminal → New Terminal and run from your project folder:

```powershell
cd "D:\DEV - Copy\DEV-"
git pull origin main
npm run setup
npm run android:sync
npm run android:open
```

In Android Studio, allow Gradle sync to complete. Select an emulator, or connect your Android phone with USB debugging enabled, then press Run. The minimum supported Android version is Android 7 (API 24).

After changing app code, run `npm run android:sync` before running it again.

## Installable test APK

Android Studio: Build → Generate App Bundles or APKs → Build APKs. The debug APK appears at:

`frontend/android/app/build/outputs/apk/debug/app-debug.apk`

Alternatively, with Java and the Android SDK configured in your terminal:

```powershell
npm run android:apk
```

The debug APK is for testing. Do not upload a debug APK to Google Play. A Play release needs an owner-controlled signing key and a signed release Android App Bundle. Never commit signing keys, passwords or `local.properties`.

## Current status

The Android project and native GPS bridge are prepared. Native compilation and phone testing require Android Studio / Android SDK; no tested APK is included in this repository. Verify photo selection, GPS permission/denial, delivery tracking, back navigation, external links, receipt download/printing, and safe-area layouts on a real device before release. Receipt browser downloads/printing have not yet been adapted or verified for Android WebView.

Supabase remains disconnected as requested. Products, categories, cart, orders and repairs are stored locally inside each installation. Phone app storage is separate from browser storage; uninstalling may lose local data. Owner/customer portals have demo access and are not secure real accounts. No real online payment, SMS or push notifications are implemented. Do not release this local preview as a live shop until shared backend, secure roles, payment verification and device testing are complete.

Maps and area-name search require internet. Native GPS requests location only when the user chooses a location action. Tracking stops when leaving its view; background tracking is not implemented.

The provisional application ID is `com.devcomputer.shop`; choose your final unique ID before the first Play upload.
