import React, { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useApp } from "../context/AppContext";
import { Badge, Card, EmptyState, LoadingPane, PrimaryButton } from "../components/UiKit";
import type { PurchaseOrder, SalesOrder } from "../types";
import { colors, formatMoney, radius, spacing } from "../theme";

export function OrdersScreen({ initialTab = "po" }: { initialTab?: "po" | "so" }) {
  const { client, refreshKey, bumpRefresh, showToast } = useApp();
  const [tab, setTab] = useState<"po" | "so">(initialTab);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [poRes, soRes] = await Promise.all([
        client.listPurchaseOrders(),
        client.listSalesOrders(),
      ]);
      setPurchaseOrders(poRes.purchaseOrders);
      setSalesOrders(soRes.salesOrders);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load orders", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [client, showToast]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  async function handleReceivePO(po: PurchaseOrder) {
    setBusyId(po.id);
    try {
      await client.receivePurchaseOrder(po.id);
      bumpRefresh();
      showToast(`Received ${po.orderNumber} into ${po.warehouseCode}`, "success");
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to receive order", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleSOAction(so: SalesOrder, action: "reserve" | "fulfil" | "ship") {
    setBusyId(so.id);
    try {
      await client.actionSalesOrder(
        so.id,
        action,
        action === "ship"
          ? { trackingCarrier: "DHL Express", trackingNumber: `SF-${Date.now().toString().slice(-6)}` }
          : undefined,
      );
      bumpRefresh();
      showToast(`${so.orderNumber} updated (${action})`, "success");
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Sales order update failed", "error");
    } finally {
      setBusyId(null);
    }
  }

  if (loading && purchaseOrders.length === 0 && salesOrders.length === 0) {
    return <LoadingPane label="Loading purchase & sales orders..." />;
  }

  return (
    <View style={styles.root}>
      <View style={styles.tabsBar}>
        <Pressable
          onPress={() => setTab("po")}
          style={[styles.tabBtn, tab === "po" && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, tab === "po" && styles.tabTextActive]}>
            Purchase Orders ({purchaseOrders.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("so")}
          style={[styles.tabBtn, tab === "so" && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, tab === "so" && styles.tabTextActive]}>
            Sales Orders ({salesOrders.length})
          </Text>
        </Pressable>
      </View>

      <ScrollView
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
        {tab === "po" ? (
          purchaseOrders.length === 0 ? (
            <EmptyState
              icon="receipt-outline"
              title="No Purchase Orders"
              subtitle="Inbound supplier purchase orders will appear here."
            />
          ) : (
            purchaseOrders.map((po) => {
              const receivable = po.status === "ordered" || po.status === "draft" || po.status === "partially_received";
              return (
                <Card key={po.id} style={styles.orderCard}>
                  <View style={styles.orderHead}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderNum}>{po.orderNumber}</Text>
                      <Text style={styles.orderParty}>{po.supplierName}</Text>
                      <Text style={styles.orderMeta}>
                        Dest: {po.warehouseCode} · ETA {po.expectedDate || "TBD"}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 4 }}>
                      <Badge
                        label={po.status.replace("_", " ").toUpperCase()}
                        tone={po.status === "received" ? "emerald" : "blue"}
                      />
                      <Text style={styles.orderTotal}>{formatMoney(po.totalCents)}</Text>
                    </View>
                  </View>

                  <View style={styles.linesBox}>
                    {po.items.map((item) => (
                      <Text key={item.id} style={styles.lineText}>
                        • {item.productSku} — {item.productName} × {item.quantityOrdered}
                      </Text>
                    ))}
                  </View>

                  {receivable ? (
                    <PrimaryButton
                      label={`Receive Stock into ${po.warehouseCode}`}
                      icon="download-outline"
                      loading={busyId === po.id}
                      onPress={() => void handleReceivePO(po)}
                    />
                  ) : null}
                </Card>
              );
            })
          )
        ) : salesOrders.length === 0 ? (
          <EmptyState
            icon="cart-outline"
            title="No Sales Orders"
            subtitle="Customer outbound sales orders will appear here."
          />
        ) : (
          salesOrders.map((so) => (
            <Card key={so.id} style={styles.orderCard}>
              <View style={styles.orderHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderNum}>{so.orderNumber}</Text>
                  <Text style={styles.orderParty}>{so.customerName}</Text>
                  <Text style={styles.orderMeta}>
                    Hub: {so.warehouseCode} · {so.deliveryStatus.replace("_", " ")}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Badge
                    label={so.status.toUpperCase()}
                    tone={
                      so.status === "shipped" || so.status === "fulfilled"
                        ? "emerald"
                        : so.status === "reserved"
                          ? "blue"
                          : "amber"
                    }
                  />
                  <Text style={styles.orderTotal}>{formatMoney(so.totalCents)}</Text>
                </View>
              </View>

              <View style={styles.linesBox}>
                {so.items.map((item) => (
                  <Text key={item.id} style={styles.lineText}>
                    • {item.productSku} — {item.productName} × {item.quantity}
                  </Text>
                ))}
              </View>

              {so.status === "pending" ? (
                <PrimaryButton
                  label="Reserve Warehouse Stock"
                  tone="navy"
                  loading={busyId === so.id}
                  onPress={() => void handleSOAction(so, "reserve")}
                />
              ) : null}

              {so.status === "reserved" ? (
                <PrimaryButton
                  label="Fulfil & Deduct Stock"
                  loading={busyId === so.id}
                  onPress={() => void handleSOAction(so, "fulfil")}
                />
              ) : null}

              {so.status === "fulfilled" ? (
                <PrimaryButton
                  label="Mark Dispatched (DHL)"
                  icon="airplane-outline"
                  loading={busyId === so.id}
                  onPress={() => void handleSOAction(so, "ship")}
                />
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  tabsBar: {
    flexDirection: "row",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: colors.navy,
  },
  tabText: { fontSize: 13, fontWeight: "700", color: colors.inkSecondary },
  tabTextActive: { color: colors.white },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 28 },
  orderCard: { gap: 10, padding: spacing.md },
  orderHead: { flexDirection: "row", gap: 10 },
  orderNum: { fontSize: 15, fontWeight: "800", color: colors.ink, fontVariant: ["tabular-nums"] },
  orderParty: { fontSize: 14, fontWeight: "600", color: colors.inkSecondary, marginTop: 2 },
  orderMeta: { fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  orderTotal: { fontSize: 14, fontWeight: "800", color: colors.ink, fontVariant: ["tabular-nums"] },
  linesBox: {
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    padding: 10,
    gap: 4,
  },
  lineText: { fontSize: 12, color: colors.inkSecondary, fontWeight: "600" },
});

