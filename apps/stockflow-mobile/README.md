# StockFlow Mobile — React Native + Expo Companion App

StockFlow Mobile is the real React Native + Expo companion application for **StockFlow Inventory & Operations SaaS** (`apps/stockflow`). It authenticates via Bearer tokens against the shared StockFlow `/api/v1/*` REST API and persists every scan, stock adjustment, inter-warehouse transfer, and purchase/sales order update directly to the shared PostgreSQL database.

> **Distribution Notice:** StockFlow Mobile is configured for **Expo Go QR testing**, **EAS internal Android APK preview builds**, and **iOS simulator / EAS builds**. It is **not** published to the Apple App Store or Google Play Store.

---

## Implemented Screens (11 / 11)

1. **Login / Demo Access** — One-tap demo operator login (`ops@stockflow.studio`), credential login, and configurable StockFlow API URL with live `/api/v1/health` verification.
2. **Mobile Dashboard** — Active working warehouse banner, live KPI cards, quick action shortcuts, low-stock watchlist, and live movement feed with `Mobile` / `Web` source badges.
3. **Products** — Full SKU catalog with live search, category filter chips, low-stock toggle, and pull-to-refresh.
4. **Product Details** — EAN-13 barcode, cost/sell/valuation metrics, per-warehouse bin breakdown, direct Adjust/Transfer actions, and movement audit log.
5. **Barcode Scanner** — Native `expo-camera` `CameraView` (`EAN-13`, `EAN-8`, `UPC-A`, `UPC-E`, `Code-128`, `Code-39`, `QR`) plus manual barcode entry and 1-tap demo warehouse barcode chips for simulators and web preview.
6. **Stock Adjustment** — Receipt (`+`), Cycle Count (`±`), and Issue (`-`) operations with live projected balance validation (`source: "mobile"`).
7. **Warehouse Selection** — Multi-warehouse overview with SKU counts, unit totals, valuations, and persistent active warehouse switching.
8. **Stock Transfer** — Atomic inter-warehouse stock transfers with source availability validation (`source: "mobile"`).
9. **Orders** — Inbound Purchase Orders (1-tap **Receive Stock into Warehouse**) and outbound Sales Orders (**Reserve**, **Fulfil**, **Mark Dispatched**).
10. **Notifications** — Real-time low-stock threshold deficits, pending inbound POs, and outbound pick/pack queue.
11. **Profile & Settings** — Operator session details, API endpoint configuration & health check, seeded demo dataset reset, and sign out.

---

## Local Development & Expo Go QR Testing

1. Start the StockFlow backend (`apps/stockflow`) on port `3020`:
   ```bash
   cd apps/stockflow
   npm run dev -- -p 3020
   ```
2. Configure `apps/stockflow-mobile/.env` (or edit the URL in-app on the Login screen):
   - **Android/iOS phone on the same Wi-Fi (Expo Go):** `EXPO_PUBLIC_API_URL=http://<YOUR-LAN-IP>:3020`
   - **Web preview / local simulator:** `EXPO_PUBLIC_API_URL=http://localhost:3020`
   - **Deployed backend:** `EXPO_PUBLIC_API_URL=https://stock.aliarshad.co`
3. Start Expo and scan the QR code using the **Expo Go** app (Android or iOS):
   ```bash
   cd apps/stockflow-mobile
   npm install
   npx expo start
   ```
   - Press `w` for responsive Expo Web preview.
   - Scan the terminal QR code with Expo Go on Android or the iOS Camera app.

---

## Android APK & iOS Build Instructions (EAS Build)

`eas.json` is pre-configured with `development`, `preview` (installable Android `.apk`), and `production` profiles.

### Build an installable Android APK (internal preview)
```bash
npm install -g eas-cli
eas login
cd apps/stockflow-mobile
eas build --platform android --profile preview
```
EAS builds an unsigned/internal-distribution `.apk` download link that can be sideloaded directly onto Android test devices.

### Build for iOS Simulator / TestFlight
```bash
cd apps/stockflow-mobile
eas build --platform ios --profile development
# or for TestFlight distribution (requires an Apple Developer account):
eas build --platform ios --profile production
```

---

## Verification Commands

```bash
npm run typecheck
npm test
# Run live end-to-end API sync test against a running StockFlow server:
STOCKFLOW_TEST_URL=http://127.0.0.1:3020 npm test
# Export standalone Expo Web bundle:
npm run export:web
```

