import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useApp } from "../context/AppContext";
import { Badge, Card, LoadingPane, PrimaryButton, TopSubHeader } from "../components/UiKit";
import type { NavigatorActions } from "../navigation/types";
import type { ProductItem } from "../types";
import { colors, radius, spacing } from "../theme";

export function StockAdjustmentScreen({
  initialProductId,
  initialWarehouseId,
  nav,
}: {
  initialProductId?: string;
  initialWarehouseId?: string;
  nav: NavigatorActions;
}) {
  const { client, activeWarehouse, warehouses, bumpRefresh, showToast } = useApp();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId || "");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(
    initialWarehouseId || activeWarehouse?.id || "",
  );
  const [mode, setMode] = useState<"receipt" | "adjustment" | "issue">("receipt");
  const [quantity, setQuantity] = useState<number>(5);
  const [reference, setReference] = useState("MOB-COUNT");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    client
      .listProducts()
      .then((res) => {
        if (!active) return;
        setProducts(res.products);
        setSelectedProductId((prev) => prev || initialProductId || res.products[0]?.id || "");
        setSelectedWarehouseId(
          (prev) => prev || initialWarehouseId || activeWarehouse?.id || res.warehouses[0]?.id || "",
        );
      })
      .catch((err) => showToast(err instanceof Error ? err.message : "Failed to load SKUs", "error"))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeWarehouse?.id, client, initialProductId, initialWarehouseId, showToast]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );

  const currentWarehouseStock = useMemo(() => {
    if (!selectedProduct || !selectedWarehouseId) return 0;
    return (
      selectedProduct.warehouseStock.find((ws) => ws.warehouseId === selectedWarehouseId)
        ?.quantityOnHand ?? 0
    );
  }, [selectedProduct, selectedWarehouseId]);

  const effectiveDelta =
    mode === "issue" ? -Math.abs(quantity) : mode === "receipt" ? Math.abs(quantity) : quantity;

  async function handleSubmit() {
    if (!selectedProductId || !selectedWarehouseId) {
      showToast("Select both a product and warehouse", "error");
      return;
    }
    if (!quantity || effectiveDelta === 0) {
      showToast("Quantity must be non-zero", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await client.adjustStock({
        productId: selectedProductId,
        warehouseId: selectedWarehouseId,
        type: mode,
        quantityDelta: effectiveDelta,
        reference: reference.trim() || "MOB-ADJUST",
        note: note.trim() || `Mobile ${mode} recorded`,
      });
      bumpRefresh();
      showToast(`Stock synced! New bin balance: ${res.newQuantityOnHand} units`, "success");
      nav.goBack();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Stock adjustment failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.root}>
      <TopSubHeader
        title="Stock Adjustment"
        subtitle="Syncs live to StockFlow PostgreSQL (source: mobile)"
        onBack={nav.goBack}
      />

      {loading ? (
        <LoadingPane label="Loading SKUs and warehouses..." />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Operation Mode */}
          <Card style={{ gap: 10 }}>
            <Text style={styles.label}>Operation Type</Text>
            <View style={styles.modeRow}>
              {(
                [
                  { id: "receipt", label: "Receipt (+)" },
                  { id: "adjustment", label: "Count (±)" },
                  { id: "issue", label: "Issue (-)" },
                ] as const
              ).map((m) => {
                const active = mode === m.id;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => {
                      setMode(m.id);
                      if (m.id !== "adjustment" && quantity < 0) setQuantity(Math.abs(quantity));
                    }}
                    style={[styles.modeBtn, active && styles.modeBtnActive]}
                  >
                    <Text style={[styles.modeText, active && styles.modeTextActive]}>
                      {m.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Product Selector */}
            <Text style={styles.label}>Select SKU</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
              {products.map((p) => {
                const active = p.id === selectedProductId;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setSelectedProductId(p.id)}
                    style={[styles.selectChip, active && styles.selectChipActive]}
                  >
                    <Text style={[styles.chipCode, active && styles.chipTextActive]}>{p.sku}</Text>
                    <Text
                      style={[styles.chipName, active && styles.chipTextActive]}
                      numberOfLines={1}
                    >
                      {p.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Warehouse Selector */}
            <Text style={styles.label}>Target Warehouse</Text>
            <View style={styles.whGrid}>
              {warehouses.map((w) => {
                const active = w.id === selectedWarehouseId;
                return (
                  <Pressable
                    key={w.id}
                    onPress={() => setSelectedWarehouseId(w.id)}
                    style={[styles.whChip, active && styles.whChipActive]}
                  >
                    <Text style={[styles.whChipText, active && styles.chipTextActive]}>
                      {w.code} · {w.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {/* Quantity Stepper */}
          <Card style={{ gap: 12 }}>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Current Warehouse On-Hand</Text>
              <Badge label={`${currentWarehouseStock} units`} tone="navy" />
            </View>

            <View style={styles.stepperWrap}>
              <Pressable
                onPress={() => setQuantity((q) => (mode === "adjustment" ? q - 5 : Math.max(1, q - 5)))}
                style={styles.stepBtn}
              >
                <Text style={styles.stepBtnText}>-5</Text>
              </Pressable>
              <Pressable
                onPress={() => setQuantity((q) => (mode === "adjustment" ? q - 1 : Math.max(1, q - 1)))}
                style={styles.stepBtn}
              >
                <Text style={styles.stepBtnText}>-1</Text>
              </Pressable>
              <TextInput
                value={String(quantity)}
                onChangeText={(txt) => {
                  const n = parseInt(txt, 10);
                  setQuantity(Number.isNaN(n) ? 0 : n);
                }}
                keyboardType="numbers-and-punctuation"
                style={styles.qtyInput}
              />
              <Pressable onPress={() => setQuantity((q) => q + 1)} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>+1</Text>
              </Pressable>
              <Pressable onPress={() => setQuantity((q) => q + 5)} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>+5</Text>
              </Pressable>
            </View>

            <View style={styles.previewBar}>
              <Text style={styles.previewLabel}>Projected New On-Hand</Text>
              <Text
                style={[
                  styles.previewValue,
                  {
                    color:
                      currentWarehouseStock + effectiveDelta < 0
                        ? colors.danger
                        : colors.primaryDark,
                  },
                ]}
              >
                {currentWarehouseStock + effectiveDelta} units
              </Text>
            </View>

            <Text style={styles.label}>Reference Code</Text>
            <TextInput
              value={reference}
              onChangeText={setReference}
              placeholder="MOB-COUNT-01"
              placeholderTextColor={colors.inkMuted}
              style={styles.input}
            />

            <Text style={styles.label}>Operator Note</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Reason for receipt, cycle count, or stock issue..."
              placeholderTextColor={colors.inkMuted}
              style={styles.input}
            />

            <PrimaryButton
              label="Commit Stock Adjustment"
              icon="checkmark-circle-outline"
              onPress={handleSubmit}
              loading={submitting}
              disabled={currentWarehouseStock + effectiveDelta < 0}
              style={{ marginTop: 4 }}
            />
          </Card>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 28 },
  label: { fontSize: 12, fontWeight: "700", color: colors.inkSecondary, marginTop: 4 },
  modeRow: { flexDirection: "row", gap: 8 },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  modeBtnActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  modeText: { fontSize: 13, fontWeight: "700", color: colors.inkSecondary },
  modeTextActive: { color: colors.white },
  pickerRow: { gap: 8, paddingVertical: 2 },
  selectChip: {
    width: 156,
    padding: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  selectChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  chipCode: { fontSize: 11, fontWeight: "800", color: colors.inkMuted },
  chipName: { fontSize: 13, fontWeight: "700", color: colors.ink, marginTop: 2 },
  chipTextActive: { color: colors.white },
  whGrid: { gap: 8 },
  whChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  whChipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  whChipText: { fontSize: 13, fontWeight: "700", color: colors.ink },
  balanceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  balanceLabel: { fontSize: 13, fontWeight: "700", color: colors.inkSecondary },
  stepperWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepBtn: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  stepBtnText: { fontSize: 14, fontWeight: "800", color: colors.ink },
  qtyInput: {
    flex: 1,
    minWidth: 0,
    width: 60,
    textAlign: "center",
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
    backgroundColor: colors.white,
  },
  previewBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  previewLabel: { fontSize: 12, fontWeight: "700", color: colors.inkSecondary },
  previewValue: { fontSize: 16, fontWeight: "800", fontVariant: ["tabular-nums"] },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
  },
});
