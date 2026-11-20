import React, { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useApp } from "../context/AppContext";
import { Badge, Card, EmptyState, LoadingPane, SectionHeader } from "../components/UiKit";
import type { NavigatorActions } from "../navigation/types";
import type { AlertsSummary } from "../types";
import { colors, radius, spacing } from "../theme";

export function NotificationsScreen({ nav }: { nav: NavigatorActions }) {
  const { client, refreshKey, showToast } = useApp();
  const [alerts, setAlerts] = useState<AlertsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await client.getAlerts();
      setAlerts(res);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to fetch alerts", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [client, showToast]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  if (loading && !alerts) {
    return <LoadingPane label="Checking stock thresholds & queues..." />;
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
      <SectionHeader
        title={`Low-Stock Threshold Alerts (${alerts?.lowStock.length ?? 0})`}
      />
      {alerts && alerts.lowStock.length > 0 ? (
        <View style={{ gap: 8 }}>
          {alerts.lowStock.map((item) => (
            <Card key={item.productId} style={styles.alertRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.metaRow}>
                  <Text style={styles.sku}>{item.sku}</Text>
                  <Badge label={`Deficit: ${item.deficit}`} tone="amber" />
                </View>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.sub}>
                  Available {item.available} · Min Threshold {item.threshold}
                </Text>
              </View>
              <Pressable
                onPress={() => nav.navigate({ name: "stockAdjustment", productId: item.productId })}
                style={styles.actionChip}
              >
                <Text style={styles.actionChipText}>Adjust</Text>
              </Pressable>
            </Card>
          ))}
        </View>
      ) : (
        <EmptyState
          icon="checkmark-done-outline"
          title="Zero Stockout Risks"
          subtitle="Every active SKU is above its configured minimum threshold."
        />
      )}

      <SectionHeader
        title={`Inbound Purchase Orders (${alerts?.pendingPurchaseOrders.length ?? 0})`}
        actionLabel="Open Orders"
        onAction={() => nav.switchTab("orders")}
      />
      {alerts && alerts.pendingPurchaseOrders.length > 0 ? (
        <View style={{ gap: 8 }}>
          {alerts.pendingPurchaseOrders.map((po) => (
            <Pressable key={po.id} onPress={() => nav.switchTab("orders")}>
              <Card style={styles.alertRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{po.orderNumber}</Text>
                  <Text style={styles.sub}>
                    {po.supplierName} · Expected {po.expectedDate || "TBD"}
                  </Text>
                </View>
                <Badge label={po.status.toUpperCase()} tone="blue" />
              </Card>
            </Pressable>
          ))}
        </View>
      ) : (
        <EmptyState
          icon="cube-outline"
          title="No Pending Inbound Shipments"
          subtitle="All supplier purchase orders have been received."
        />
      )}

      <SectionHeader
        title={`Outbound Sales Queue (${alerts?.pendingSalesOrders.length ?? 0})`}
        actionLabel="Fulfil"
        onAction={() => nav.switchTab("orders")}
      />
      {alerts && alerts.pendingSalesOrders.length > 0 ? (
        <View style={{ gap: 8 }}>
          {alerts.pendingSalesOrders.map((so) => (
            <Pressable key={so.id} onPress={() => nav.switchTab("orders")}>
              <Card style={styles.alertRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{so.orderNumber}</Text>
                  <Text style={styles.sub}>{so.customerName}</Text>
                </View>
                <Badge label={so.status.toUpperCase()} tone="amber" />
              </Card>
            </Pressable>
          ))}
        </View>
      ) : (
        <EmptyState
          icon="checkmark-circle-outline"
          title="Outbound Queue Cleared"
          subtitle="No pending sales orders awaiting pick or pack."
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 28 },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: spacing.md,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
  sku: { fontSize: 12, fontWeight: "800", color: colors.inkMuted },
  title: { fontSize: 15, fontWeight: "700", color: colors.ink },
  sub: { fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  actionChip: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionChipText: { fontSize: 12, fontWeight: "700", color: colors.primaryDark },
});

