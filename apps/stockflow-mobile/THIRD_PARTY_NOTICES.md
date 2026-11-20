# Third-Party Open-Source Notices — StockFlow Mobile

StockFlow Mobile is the companion mobile client for StockFlow, whose inventory workflow domain model is inspired by **InvenTree** (MIT License) and built with permissively licensed open-source mobile tooling:

| Dependency / Reference | License | Purpose |
| --- | --- | --- |
| **InvenTree** (`inventree/InvenTree`) | MIT License | Domain model reference for multi-warehouse stock tracking, barcode scanning, and immutable stock ledgers (clean-room TypeScript implementation) |
| **Expo** (`expo`, `expo-camera`, `expo-status-bar`) | MIT License | Cross-platform React Native runtime, native barcode camera scanner, and EAS build tooling |
| **React & React Native** (`react`, `react-native`, `react-native-web`) | MIT License | Cross-platform mobile UI framework |
| **React Native Safe Area Context** | MIT License | Safe-area insets on notched iOS/Android devices |
| **AsyncStorage** (`@react-native-async-storage/async-storage`) | MIT License | Persistent local storage for Bearer sessions, API endpoint URL, and active warehouse selection |
| **@expo/vector-icons** (Ionicons) | MIT License | Vector iconography |

All components and dependencies use MIT or compatible permissive licenses. No AGPL, GPL, or proprietary Enterprise modules are included.

