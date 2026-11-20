import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BackHandler, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { AppProvider, useApp } from "./src/context/AppContext";
import { LoadingPane } from "./src/components/UiKit";
import type { NavigatorActions, ScreenRoute, TabKey } from "./src/navigation/types";
import { LoginScreen } from "./src/screens/LoginScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { ProductsScreen } from "./src/screens/ProductsScreen";
import { ProductDetailScreen } from "./src/screens/ProductDetailScreen";
import { BarcodeScannerScreen } from "./src/screens/BarcodeScannerScreen";
import { StockAdjustmentScreen } from "./src/screens/StockAdjustmentScreen";
import { WarehouseSelectionScreen } from "./src/screens/WarehouseSelectionScreen";
import { StockTransferScreen } from "./src/screens/StockTransferScreen";
import { OrdersScreen } from "./src/screens/OrdersScreen";
import { NotificationsScreen } from "./src/screens/NotificationsScreen";
import { ProfileSettingsScreen } from "./src/screens/ProfileSettingsScreen";
import { colors, radius, spacing } from "./src/theme";

const TAB_ITEMS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "dashboard", label: "Home", icon: "grid-outline" },
  { key: "products", label: "Products", icon: "cube-outline" },
  { key: "scanner", label: "Scan", icon: "barcode-outline" },
  { key: "orders", label: "Orders", icon: "receipt-outline" },
  { key: "alerts", label: "Alerts", icon: "notifications-outline" },
];

function MainShell() {
  const { user, bootstrapping, activeWarehouse, toast } = useApp();
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [stack, setStack] = useState<ScreenRoute[]>([]);

  const currentOverlay = stack.length > 0 ? stack[stack.length - 1] : null;

  const navigate = useCallback((route: ScreenRoute) => {
    if (
      route.name === "dashboard" ||
      route.name === "products" ||
      route.name === "scanner" ||
      route.name === "orders" ||
      route.name === "alerts"
    ) {
      setStack([]);
      setActiveTab(route.name);
      return;
    }
    setStack((prev) => [...prev, route]);
  }, []);

  const goBack = useCallback(() => {
    setStack((prev) => prev.slice(0, -1));
  }, []);

  const switchTab = useCallback((tab: TabKey) => {
    setStack([]);
    setActiveTab(tab);
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (stack.length > 0) {
        goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [goBack, stack.length]);

  const nav = useMemo<NavigatorActions>(
    () => ({ navigate, goBack, switchTab }),
    [navigate, goBack, switchTab],
  );

  if (bootstrapping) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingPane label="Initializing StockFlow Mobile..." />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoginScreen />
      </SafeAreaView>
    );
  }

  const tabTitle = {
    dashboard: "StockFlow Ops",
    products: "Products & SKUs",
    scanner: "Barcode Scanner",
    orders: "Orders",
    alerts: "Notifications",
  }[activeTab];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Global Top Bar on Root Tabs */}
      {!currentOverlay ? (
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <View style={styles.brandDot}>
              <Ionicons name="cube" size={16} color={colors.white} />
            </View>
            <View>
              <Text style={styles.topTitle}>{tabTitle}</Text>
              <Text style={styles.topSub} numberOfLines={1}>
                {activeWarehouse ? `${activeWarehouse.code} · Live PostgreSQL` : "Live PostgreSQL"}
              </Text>
            </View>
          </View>

          <View style={styles.topActions}>
            <Pressable
              onPress={() => navigate({ name: "warehouseSelection" })}
              style={styles.iconBtn}
              accessibilityLabel="Select warehouse"
            >
              <Ionicons name="business-outline" size={18} color={colors.ink} />
            </Pressable>
            <Pressable
              onPress={() => navigate({ name: "profileSettings" })}
              style={styles.iconBtn}
              accessibilityLabel="Profile and settings"
            >
              <Ionicons name="person-circle-outline" size={20} color={colors.ink} />
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Screen Content */}
      <View style={styles.body}>
        {currentOverlay ? (
          currentOverlay.name === "productDetail" ? (
            <ProductDetailScreen productId={currentOverlay.productId} nav={nav} />
          ) : currentOverlay.name === "stockAdjustment" ? (
            <StockAdjustmentScreen
              initialProductId={currentOverlay.productId}
              initialWarehouseId={currentOverlay.warehouseId}
              nav={nav}
            />
          ) : currentOverlay.name === "warehouseSelection" ? (
            <WarehouseSelectionScreen nav={nav} />
          ) : currentOverlay.name === "stockTransfer" ? (
            <StockTransferScreen
              initialProductId={currentOverlay.productId}
              initialFromWarehouseId={currentOverlay.fromWarehouseId}
              nav={nav}
            />
          ) : currentOverlay.name === "profileSettings" ? (
            <ProfileSettingsScreen nav={nav} />
          ) : null
        ) : activeTab === "dashboard" ? (
          <DashboardScreen nav={nav} />
        ) : activeTab === "products" ? (
          <ProductsScreen nav={nav} />
        ) : activeTab === "scanner" ? (
          <BarcodeScannerScreen nav={nav} />
        ) : activeTab === "orders" ? (
          <OrdersScreen />
        ) : (
          <NotificationsScreen nav={nav} />
        )}
      </View>

      {/* Toast Notification Banner */}
      {toast ? (
        <View
          style={[
            styles.toast,
            toast.kind === "success"
              ? styles.toastSuccess
              : toast.kind === "error"
                ? styles.toastError
                : styles.toastInfo,
          ]}
        >
          <Text style={styles.toastText}>{toast.text}</Text>
        </View>
      ) : null}

      {/* Bottom Tab Navigation */}
      <View style={styles.bottomBar}>
        {TAB_ITEMS.map((item) => {
          const active = !currentOverlay && activeTab === item.key;
          const isScan = item.key === "scanner";
          return (
            <Pressable
              key={item.key}
              onPress={() => switchTab(item.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.tabItem, isScan && styles.tabItemScan]}
            >
              <View style={[isScan && styles.scanPill, isScan && active && styles.scanPillActive]}>
                <Ionicons
                  name={item.icon}
                  size={isScan ? 22 : 20}
                  color={
                    isScan
                      ? colors.white
                      : active
                        ? colors.primary
                        : colors.inkMuted
                  }
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  active && styles.tabLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppProvider>
        <MainShell />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandDot: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: { fontSize: 16, fontWeight: "800", color: colors.ink },
  topSub: { fontSize: 11, color: colors.primaryDark, fontWeight: "600" },
  topActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  bottomBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 4,
  },
  tabItemScan: {
    marginTop: -6,
  },
  scanPill: {
    width: 44,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  scanPillActive: {
    backgroundColor: colors.navy,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.inkMuted,
  },
  tabLabelActive: {
    color: colors.primary,
  },
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 76,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: radius.md,
    elevation: 4,
  },
  toastSuccess: { backgroundColor: colors.primaryDark },
  toastError: { backgroundColor: colors.danger },
  toastInfo: { backgroundColor: colors.navy },
  toastText: { color: colors.white, fontSize: 13, fontWeight: "700", textAlign: "center" },
});

