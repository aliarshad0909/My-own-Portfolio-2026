import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useApp } from "../context/AppContext";
import { Badge, Card, LoadingPane, PrimaryButton, TopSubHeader } from "../components/UiKit";
import type { NavigatorActions } from "../navigation/types";
import type { ProductItem } from "../types";
import { colors, radius, spacing } from "../theme";

export function StockTransferScreen({
  initialProductId,
  initialFromWarehouseId,
  nav,
}: {
  initialProductId?: string;
  initialFromWarehouseId?: string;
  nav: NavigatorActions;
}) {
  const { client, warehouses, activeWarehouse, bumpRefresh, showToast } = useApp();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [productId, setProductId] = useState(initialProductId || "");
  const [fromId, setFromId] = useState(initialFromWarehouseId || activeWarehouse?.id || "");
  const [toId, setToId] = useState("");
  const [quantity, setQuantity] = useState(5);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    client
      .listProducts()
      .then((res) => {
        if (!active) return;
        setProducts(res.products);
        const firstProd = initialProductId || res.products[0]?.id || "";
        setProductId(firstProd);
        const src = initialFromWarehouseId || activeWarehouse?.id || res.warehouses[0]?.id || "";
        setFromId(src);
        const dst = res.warehouses.find((w) => w.id !== src)?.id || "";
        setToId(dst);
      })
      .catch((err) => showToast(err instanceof Error ? err.message : "Failed to load transfer data", "error"))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeWarehouse?.id, client, initialFromWarehouseId, initialProductId, showToast]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId) ?? null,
    [products, productId],
  );

  const sourceAvailable = useMemo(() => {
    if (!selectedProduct || !fromId) return 0;
    return selectedProduct.warehouseStock.find((ws) => ws.warehouseId === fromId)?.available ?? 0;
  }, [selectedProduct, fromId]);

  const invalidTransfer =
    !productId || !fromId || !toId || fromId === toId || quantity < 1 || quantity > sourceAvailable;

  async function handleTransfer() {
    if (invalidTransfer) {
      showToast("Verify warehouses and available source quantity", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await client.transferStock({
        productId,
        fromWarehouseId: fromId,
        toWarehouseId: toId,
        quantity,
        note: note.trim() || "Mobile warehouse stock transfer",
      });
      bumpRefresh();
      showToast(
        `Transferred ${quantity} units (Source: ${res.fromQuantityOnHand}, Dest: ${res.toQuantityOnHand})`,
        "success",
      );
      nav.goBack();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Transfer failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.root}>
      <TopSubHeader
        title="Inter-Warehouse Transfer"
        subtitle="Atomic PostgreSQL stock relocation"
        onBack={nav.goBack}
      />

      {loading ? (
        <LoadingPane label="Loading warehouses and SKU balances..." />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={{ gap: 10 }}>
            <Text style={styles.label}>Select Product</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
              {products.map((p) => {
                const active = p.id === productId;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setProductId(p.id)}
                    style={[styles.selectChip, active && styles.selectChipActive]}
                  >
                    <Text style={[styles.chipCode, active && styles.chipTextActive]}>{p.sku}</Text>
                    <Text style={[styles.chipName, active && styles.chipTextActive]} numberOfLines={1}>
                      {p.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.label}>From Warehouse (Source)</Text>
            <View style={{ gap: 6 }}>
              {warehouses.map((w) => {
                const active = w.id === fromId;
                const avail =
                  selectedProduct?.warehouseStock.find((ws) => ws.warehouseId === w.id)?.available ?? 0;
                return (
                  <Pressable
                    key={w.id}
                    onPress={() => setFromId(w.id)}
                    style={[styles.whRow, active && styles.whRowActive]}
                  >
                    <Text style={[styles.whRowText, active && styles.chipTextActive]}>
                      {w.code} · {w.name}
                    </Text>
                    <Badge label={`${avail} avail`} tone={active ? "emerald" : "neutral"} />
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>To Warehouse (Destination)</Text>
            <View style={{ gap: 6 }}>
              {warehouses.map((w) => {
                const active = w.id === toId;
                const same = w.id === fromId;
                return (
                  <Pressable
                    key={w.id}
                    disabled={same}
                    onPress={() => setToId(w.id)}
                    style={[
                      styles.whRow,
                      active && styles.whRowActive,
                      same && { opacity: 0.4 },
                    ]}
                  >
                    <Text style={[styles.whRowText, active && styles.chipTextActive]}>
                      {w.code} · {w.name}
                    </Text>
                    {same ? <Badge label="Source" tone="neutral" /> : null}
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <Card style={{ gap: 12 }}>
            <View style={styles.balanceRow}>
              <Text style={styles.label}>Transfer Quantity</Text>
              <Badge
                label={`Max ${sourceAvailable} avail`}
                tone={sourceAvailable > 0 ? "emerald" : "amber"}
              />
            </View>

            <View style={styles.stepper}>
              <Pressable onPress={() => setQuantity((q) => Math.max(1, q - 5))} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>-5</Text>
              </Pressable>
              <Pressable onPress={() => setQuantity((q) => Math.max(1, q - 1))} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>-1</Text>
              </Pressable>
              <TextInput
                value={String(quantity)}
                onChangeText={(txt) => setQuantity(Math.max(0, parseInt(txt, 10) || 0))}
                keyboardType="number-pad"
                style={styles.qtyInput}
              />
              <Pressable
                onPress={() => setQuantity((q) => Math.min(Math.max(1, sourceAvailable), q + 1))}
                style={styles.stepBtn}
              >
                <Text style={styles.stepBtnText}>+1</Text>
              </Pressable>
              <Pressable
                onPress={() => setQuantity((q) => Math.min(Math.max(1, sourceAvailable), q + 5))}
                style={styles.stepBtn}
              >
                <Text style={styles.stepBtnText}>+5</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Transfer Note</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Replenishment pallet or bin balancing note..."
              placeholderTextColor={colors.inkMuted}
              style={styles.input}
            />

            <PrimaryButton
              label="Execute Stock Transfer"
              icon="git-compare-outline"
              onPress={handleTransfer}
              loading={submitting}
              disabled={invalidTransfer}
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
  label: { fontSize: 12, fontWeight: "700", color: colors.inkSecondary },
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
  whRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  whRowActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  whRowText: { fontSize: 13, fontWeight: "700", color: colors.ink, flex: 1 },
  balanceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
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
