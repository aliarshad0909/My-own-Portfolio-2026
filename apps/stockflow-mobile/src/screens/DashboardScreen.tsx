import React, { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import {
  Badge,
  Card,
  EmptyState,
  KpiCard,
  LoadingPane,
  SectionHeader,
} from "../components/UiKit";
import type { NavigatorActions } from "../navigation/types";
import type { DashboardSummary } from "../types";
import { colors, formatMoney, formatShortDate, radius, spacing } from "../theme";

export function DashboardScreen({ nav }: { nav: NavigatorActions }) {
  const { client, activeWarehouse, refreshKey, showToast } = useApp();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const summary = await client.getDashboard();
      setData(summary);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load dashboard", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [client, showToast]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  if (loading && !data) {
    return <LoadingPane label="Loading live inventory metrics..." />;
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load();
          }}
          tintColor={colors.primary}
        />
      }
    >
      {/* Active Warehouse Banner */}
      <Pressable
        onPress={() => nav.navigate({ name: "warehouseSelection" })}
        style={styles.warehouseBanner}
      >
        <View style={styles.warehouseIcon}>
          <Ionicons name="business" size={18} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.warehouseLabel}>ACTIVE WORKING WAREHOUSE</Text>
          <Text style={styles.warehouseName} numberOfLines={1}>
            {activeWarehouse ? `${activeWarehouse.code} · ${activeWarehouse.name}` : "All Warehouses"}
          </Text>
        </View>
        <View style={styles.switchPill}>
          <Text style={styles.switchPillText}>Switch</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.white} />
        </View>
      </Pressable>

      {/* KPI Grid */}
      {data ? (
        <View style={styles.kpiGrid}>
          <KpiCard
            label="Units On Hand"
            value={data.kpis.totalStockQuantity.toLocaleString()}
            sub={`${data.kpis.totalProducts} active SKUs`}
            tone="emerald"
            onPress={() => nav.switchTab("products")}
          />
          <KpiCard
            label="Stock Valuation"
            value={formatMoney(data.kpis.totalValuationCents)}
            sub={`${data.kpis.warehouseCount} warehouses`}
            tone="neutral"
          />
          <KpiCard
            label="Low Stock Alerts"
            value={String(data.kpis.lowStockCount)}
            sub="Below min threshold"
            tone={data.kpis.lowStockCount > 0 ? "amber" : "emerald"}
            onPress={() => nav.switchTab("alerts")}
          />
          <KpiCard
            label="Open Orders"
            value={String(data.kpis.pendingPurchaseOrders + data.kpis.pendingSalesOrders)}
            sub={`${data.kpis.pendingPurchaseOrders} PO · ${data.kpis.pendingSalesOrders} SO`}
            tone="neutral"
            onPress={() => nav.switchTab("orders")}
          />
        </View>
      ) : null}

      {/* Quick Operations */}
      <SectionHeader title="Quick Operations" />
      <View style={styles.quickGrid}>
        <Pressable
          onPress={() => nav.switchTab("scanner")}
          style={[styles.quickBtn, styles.quickBtnPrimary]}
        >
          <Ionicons name="barcode-outline" size={22} color={colors.white} />
          <Text style={[styles.quickLabel, { color: colors.white }]}>Scan SKU</Text>
        </Pressable>

        <Pressable
          onPress={() => nav.navigate({ name: "stockAdjustment" })}
          style={styles.quickBtn}
        >
          <Ionicons name="swap-vertical" size={22} color={colors.primary} />
          <Text style={styles.quickLabel}>Adjust Stock</Text>
        </Pressable>

        <Pressable
          onPress={() => nav.navigate({ name: "stockTransfer" })}
          style={styles.quickBtn}
        >
          <Ionicons name="git-compare-outline" size={22} color={colors.blue} />
          <Text style={styles.quickLabel}>Transfer</Text>
        </Pressable>

        <Pressable
          onPress={() => nav.navigate({ name: "warehouseSelection" })}
          style={styles.quickBtn}
        >
          <Ionicons name="location-outline" size={22} color={colors.navy} />
          <Text style={styles.quickLabel}>Warehouses</Text>
        </Pressable>
      </View>

      {/* Low Stock Watchlist */}
      <SectionHeader
        title="Low-Stock Watchlist"
        actionLabel="View Alerts"
        onAction={() => nav.switchTab("alerts")}
      />
      {data && data.lowStockProducts.length > 0 ? (
        <View style={styles.listGap}>
          {data.lowStockProducts.slice(0, 4).map((p) => (
            <Pressable
              key={p.id}
              onPress={() => nav.navigate({ name: "productDetail", productId: p.id })}
            >
              <Card style={styles.rowCard}>
                <View style={{ flex: 1 }}>
                  <View style={styles.inlineMeta}>
                    <Text style={styles.skuCode}>{p.sku}</Text>
                    <Badge label="Low Stock" tone="amber" />
                  </View>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={styles.itemSub}>
                    Available {p.totalAvailable} / Min {p.minStockThreshold}
                  </Text>
                </View>
                <Pressable
                  onPress={() => nav.navigate({ name: "stockAdjustment", productId: p.id })}
                  style={styles.restockChip}
                >
                  <Text style={styles.restockChipText}>Restock</Text>
                </Pressable>
              </Card>
            </Pressable>
          ))}
        </View>
      ) : (
        <EmptyState
          icon="checkmark-circle-outline"
          title="All SKUs Healthy"
          subtitle="No products are currently below their minimum stock threshold."
        />
      )}

      {/* Recent Live Stock Movements */}
      <SectionHeader title="Recent Stock Movements" />
      {data && data.recentMovements.length > 0 ? (
        <Card style={{ paddingVertical: 6 }}>
          {data.recentMovements.slice(0, 6).map((m, idx) => {
            const positive = m.quantityDelta > 0;
            return (
              <View
                key={m.id}
                style={[styles.movRow, idx > 0 && styles.movRowBorder]}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.inlineMeta}>
                    <Text style={styles.movTitle} numberOfLines={1}>
                      {m.productName || m.productSku}
                    </Text>
                    <Badge
                      label={m.source === "mobile" ? "Mobile" : "Web"}
                      tone={m.source === "mobile" ? "emerald" : "neutral"}
                    />
                  </View>
                  <Text style={styles.itemSub} numberOfLines={1}>
                    {m.type.replace("_", " ").toUpperCase()}
                    {m.fromWarehouseCode && m.toWarehouseCode
                      ? ` · ${m.fromWarehouseCode} → ${m.toWarehouseCode}`
                      : m.toWarehouseCode
                        ? ` · ${m.toWarehouseCode}`
                        : m.fromWarehouseCode
                          ? ` · ${m.fromWarehouseCode}`
                          : ""}
                    {` · ${formatShortDate(m.createdAt)}`}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.movDelta,
                    { color: positive ? colors.primaryDark : colors.danger },
                  ]}
                >
                  {positive ? `+${m.quantityDelta}` : m.quantityDelta}
                </Text>
              </View>
            );
          })}
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 28 },
  warehouseBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  warehouseIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  warehouseLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 0.7,
  },
  warehouseName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
    marginTop: 1,
  },
  switchPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.navyLight,
  },
  switchPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    minWidth: "46%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  quickBtnPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  quickLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
  },
  listGap: { gap: 10 },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: spacing.md,
  },
  inlineMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 3,
  },
  skuCode: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.inkMuted,
    fontVariant: ["tabular-nums"],
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  itemSub: {
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
  },
  restockChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  restockChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  movRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  movRowBorder: {
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  movTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink,
    flexShrink: 1,
  },
  movDelta: {
    fontSize: 15,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
});

