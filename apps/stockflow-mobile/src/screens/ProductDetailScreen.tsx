import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useApp } from "../context/AppContext";
import {
  Badge,
  Card,
  EmptyState,
  LoadingPane,
  OutlineButton,
  PrimaryButton,
  SectionHeader,
  TopSubHeader,
} from "../components/UiKit";
import type { NavigatorActions } from "../navigation/types";
import type { MovementItem, ProductItem } from "../types";
import { colors, formatMoney, formatShortDate, radius, spacing } from "../theme";

export function ProductDetailScreen({
  productId,
  nav,
}: {
  productId: string;
  nav: NavigatorActions;
}) {
  const { client, refreshKey, showToast } = useApp();
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [movements, setMovements] = useState<MovementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await client.getProductDetail(productId);
      setProduct(res.product);
      setMovements(res.movements);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to load product details", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [client, productId, showToast]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <View style={styles.root}>
      <TopSubHeader
        title={product ? product.sku : "Product Details"}
        subtitle={product ? product.category : "SKU breakdown & bin levels"}
        onBack={nav.goBack}
        right={
          product ? (
            <Badge
              label={product.isLowStock ? "Low Stock" : "In Stock"}
              tone={product.isLowStock ? "amber" : "emerald"}
            />
          ) : null
        }
      />

      {loading && !product ? (
        <LoadingPane label="Fetching SKU warehouse breakdown..." />
      ) : !product ? (
        <View style={{ padding: spacing.lg }}>
          <EmptyState
            icon="alert-circle-outline"
            title="Product Not Found"
            subtitle="This SKU may have been removed or demo data was reset."
            actionLabel="Back to Products"
            onAction={nav.goBack}
          />
        </View>
      ) : (
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
          <Card style={{ gap: 10 }}>
            <Text style={styles.title}>{product.name}</Text>
            {product.description ? <Text style={styles.desc}>{product.description}</Text> : null}

            <View style={styles.barcodePill}>
              <Text style={styles.barcodeLabel}>EAN-13 BARCODE</Text>
              <Text style={styles.barcodeVal}>{product.barcode}</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>On Hand</Text>
                <Text style={styles.statVal}>{product.totalOnHand}</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>Reserved</Text>
                <Text style={styles.statVal}>{product.totalReserved}</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>Available</Text>
                <Text
                  style={[
                    styles.statVal,
                    { color: product.isLowStock ? colors.amber : colors.primaryDark },
                  ]}
                >
                  {product.totalAvailable}
                </Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>Min Alert</Text>
                <Text style={styles.statVal}>{product.minStockThreshold}</Text>
              </View>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceMeta}>Unit Cost: {formatMoney(product.unitCostCents)}</Text>
              <Text style={styles.priceMeta}>Sell: {formatMoney(product.sellingPriceCents)}</Text>
              <Text style={styles.priceMeta}>Value: {formatMoney(product.valuationCents)}</Text>
            </View>

            <View style={styles.actionsRow}>
              <PrimaryButton
                label="Adjust Stock"
                icon="swap-vertical"
                onPress={() => nav.navigate({ name: "stockAdjustment", productId: product.id })}
                style={{ flex: 1 }}
              />
              <OutlineButton
                label="Transfer"
                icon="git-compare-outline"
                onPress={() => nav.navigate({ name: "stockTransfer", productId: product.id })}
                style={{ flex: 1 }}
              />
            </View>
          </Card>

          <SectionHeader title="Warehouse Stock Breakdown" />
          <View style={{ gap: 8 }}>
            {product.warehouseStock.length === 0 ? (
              <EmptyState
                icon="business-outline"
                title="No Warehouse Bins Assigned"
                subtitle="Record a stock receipt to allocate this SKU to a warehouse bin."
              />
            ) : (
              product.warehouseStock.map((ws) => (
                <Card key={ws.warehouseId} style={styles.whRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.whHeader}>
                      <Badge label={ws.warehouseCode} tone="navy" />
                      <Text style={styles.whName}>{ws.warehouseName}</Text>
                    </View>
                    <Text style={styles.whBin}>
                      Bin {ws.binLocation} · Reserved {ws.quantityReserved}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.whQty}>{ws.quantityOnHand}</Text>
                    <Text style={styles.whQtySub}>on hand</Text>
                  </View>
                </Card>
              ))
            )}
          </View>

          <SectionHeader title="Recent Movement Ledger" />
          {movements.length === 0 ? (
            <EmptyState
              icon="time-outline"
              title="No Movements Recorded"
              subtitle="Adjustments, transfers, and order fulfilments will appear here."
            />
          ) : (
            <Card style={{ paddingVertical: 6 }}>
              {movements.slice(0, 10).map((m, idx) => (
                <View key={m.id} style={[styles.movRow, idx > 0 && styles.movBorder]}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.whHeader}>
                      <Text style={styles.movType}>{m.type.replace("_", " ").toUpperCase()}</Text>
                      <Badge
                        label={m.source === "mobile" ? "Mobile" : "Web"}
                        tone={m.source === "mobile" ? "emerald" : "neutral"}
                      />
                    </View>
                    <Text style={styles.whBin}>
                      {m.note || m.reference || "Inventory update"} · {formatShortDate(m.createdAt)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.movDelta,
                      { color: m.quantityDelta >= 0 ? colors.primaryDark : colors.danger },
                    ]}
                  >
                    {m.quantityDelta >= 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                  </Text>
                </View>
              ))}
            </Card>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 28 },
  title: { fontSize: 19, fontWeight: "800", color: colors.ink },
  desc: { fontSize: 13, color: colors.inkSecondary, lineHeight: 19 },
  barcodePill: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radius.sm,
  },
  barcodeLabel: { fontSize: 11, fontWeight: "700", color: colors.inkMuted },
  barcodeVal: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
    fontVariant: ["tabular-nums"],
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statCell: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    alignItems: "center",
  },
  statLabel: { fontSize: 10, fontWeight: "700", color: colors.inkMuted, textTransform: "uppercase" },
  statVal: { fontSize: 18, fontWeight: "800", color: colors.ink, marginTop: 2, fontVariant: ["tabular-nums"] },
  priceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
    paddingTop: 4,
  },
  priceMeta: { fontSize: 12, fontWeight: "700", color: colors.inkSecondary },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  whRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  whHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  whName: { fontSize: 14, fontWeight: "700", color: colors.ink },
  whBin: { fontSize: 12, color: colors.inkMuted, marginTop: 4 },
  whQty: { fontSize: 20, fontWeight: "800", color: colors.ink, fontVariant: ["tabular-nums"] },
  whQtySub: { fontSize: 11, color: colors.inkMuted },
  movRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  movBorder: { borderTopWidth: 1, borderColor: colors.border },
  movType: { fontSize: 12, fontWeight: "800", color: colors.ink },
  movDelta: { fontSize: 15, fontWeight: "800", fontVariant: ["tabular-nums"] },
});

