import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { Badge, Card, EmptyState, LoadingPane } from "../components/UiKit";
import type { NavigatorActions } from "../navigation/types";
import type { ProductItem } from "../types";
import { colors, formatMoney, radius, spacing } from "../theme";

export function ProductsScreen({
  nav,
  initialLowStock = false,
}: {
  nav: NavigatorActions;
  initialLowStock?: boolean;
}) {
  const { client, refreshKey, showToast } = useApp();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [lowStockOnly, setLowStockOnly] = useState(initialLowStock);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await client.listProducts();
      setProducts(res.products);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load products", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [client, showToast]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const categories = useMemo(() => {
    const set = new Set<string>(products.map((p) => p.category));
    return ["all", ...Array.from(set).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (lowStockOnly && !p.isLowStock) return false;
      if (q) {
        const hay = `${p.sku} ${p.barcode} ${p.name} ${p.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, query, category, lowStockOnly]);

  if (loading && products.length === 0) {
    return <LoadingPane label="Loading SKU catalog..." />;
  }

  return (
    <View style={styles.root}>
      <View style={styles.searchHeader}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.inkMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search SKU, barcode, or product name..."
            placeholderTextColor={colors.inkMuted}
            style={styles.searchInput}
          />
          {query ? (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.inkMuted} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Pressable
            onPress={() => setLowStockOnly((v) => !v)}
            style={[styles.chip, lowStockOnly && styles.chipWarnActive]}
          >
            <Ionicons
              name="warning-outline"
              size={13}
              color={lowStockOnly ? colors.white : "#b45309"}
            />
            <Text style={[styles.chipText, lowStockOnly && styles.chipTextActive]}>Low Stock</Text>
          </Pressable>

          {categories.map((cat) => {
            const active = category === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat === "all" ? "All Categories" : cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
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
        <Text style={styles.countMeta}>
          Showing {filtered.length} of {products.length} SKUs
        </Text>

        {filtered.length === 0 ? (
          <EmptyState
            icon="cube-outline"
            title="No Matching SKUs"
            subtitle="Try clearing your search filter or scanning a barcode directly."
            actionLabel="Open Scanner"
            onAction={() => nav.switchTab("scanner")}
          />
        ) : (
          filtered.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => nav.navigate({ name: "productDetail", productId: p.id })}
            >
              <Card style={styles.skuCard}>
                <View style={styles.skuTop}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.metaRow}>
                      <Text style={styles.sku}>{p.sku}</Text>
                      <Badge label={p.category} tone="neutral" />
                      {p.isLowStock ? <Badge label="Low Stock" tone="amber" /> : null}
                    </View>
                    <Text style={styles.name}>{p.name}</Text>
                    <Text style={styles.barcode}>EAN: {p.barcode}</Text>
                  </View>
                  <View style={styles.qtyBox}>
                    <Text
                      style={[
                        styles.qtyNum,
                        { color: p.isLowStock ? colors.amber : colors.primaryDark },
                      ]}
                    >
                      {p.totalAvailable}
                    </Text>
                    <Text style={styles.qtyCaption}>avail</Text>
                  </View>
                </View>

                <View style={styles.skuFoot}>
                  <Text style={styles.footText}>
                    On Hand: {p.totalOnHand} · Reserved: {p.totalReserved}
                  </Text>
                  <Text style={styles.priceText}>{formatMoney(p.sellingPriceCents)}</Text>
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  searchHeader: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: 10,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.ink,
    padding: 0,
  },
  chips: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  chipWarnActive: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.inkSecondary,
  },
  chipTextActive: {
    color: colors.white,
  },
  list: {
    padding: spacing.lg,
    gap: 10,
    paddingBottom: 28,
  },
  countMeta: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.inkMuted,
    marginBottom: 2,
  },
  skuCard: {
    padding: spacing.md,
    gap: 10,
  },
  skuTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  sku: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.inkSecondary,
    fontVariant: ["tabular-nums"],
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  barcode: {
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
  qtyBox: {
    minWidth: 58,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  qtyNum: {
    fontSize: 20,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  qtyCaption: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.inkMuted,
    textTransform: "uppercase",
  },
  skuFoot: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: 8,
  },
  footText: {
    fontSize: 12,
    color: colors.inkMuted,
  },
  priceText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.ink,
    fontVariant: ["tabular-nums"],
  },
});

