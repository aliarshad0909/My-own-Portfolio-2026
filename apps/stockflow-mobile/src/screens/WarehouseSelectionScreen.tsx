import React, { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { Badge, Card, LoadingPane, TopSubHeader } from "../components/UiKit";
import type { NavigatorActions } from "../navigation/types";
import { colors, formatMoney, radius, spacing } from "../theme";

export function WarehouseSelectionScreen({ nav }: { nav: NavigatorActions }) {
  const { warehouses, activeWarehouse, setActiveWarehouseById, refreshWarehouses, showToast } =
    useApp();
  const [loading, setLoading] = useState(warehouses.length === 0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await refreshWarehouses();
    setLoading(false);
    setRefreshing(false);
  }, [refreshWarehouses]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSelect(id: string, name: string) {
    await setActiveWarehouseById(id);
    showToast(`Active warehouse switched to ${name}`, "success");
    nav.goBack();
  }

  return (
    <View style={styles.root}>
      <TopSubHeader
        title="Warehouse Selection"
        subtitle="Choose your active facility for adjustments & transfers"
        onBack={nav.goBack}
      />

      {loading ? (
        <LoadingPane label="Loading warehouse network..." />
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
          {warehouses.map((w) => {
            const isSelected = activeWarehouse?.id === w.id;
            return (
              <Pressable key={w.id} onPress={() => void handleSelect(w.id, w.name)}>
                <Card style={[styles.whCard, isSelected && styles.whCardActive]}>
                  <View style={styles.topRow}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.badges}>
                        <Badge label={w.code} tone={isSelected ? "emerald" : "navy"} />
                        {isSelected ? <Badge label="Active Facility" tone="emerald" /> : null}
                      </View>
                      <Text style={styles.name}>{w.name}</Text>
                      <Text style={styles.loc}>
                        <Ionicons name="location-outline" size={12} color={colors.inkMuted} />{" "}
                        {w.location}
                      </Text>
                    </View>
                    <Ionicons
                      name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                      size={24}
                      color={isSelected ? colors.primary : colors.borderStrong}
                    />
                  </View>

                  <Text style={styles.zones}>Zones: {w.storageZones}</Text>

                  <View style={styles.metrics}>
                    <View style={styles.metricCell}>
                      <Text style={styles.metricVal}>{w.skuCount ?? 0}</Text>
                      <Text style={styles.metricLbl}>SKUs</Text>
                    </View>
                    <View style={styles.metricCell}>
                      <Text style={styles.metricVal}>{w.totalUnits ?? 0}</Text>
                      <Text style={styles.metricLbl}>Units</Text>
                    </View>
                    <View style={styles.metricCell}>
                      <Text style={styles.metricVal}>
                        {formatMoney(w.valuationCents ?? 0)}
                      </Text>
                      <Text style={styles.metricLbl}>Valuation</Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 28 },
  whCard: { gap: 10 },
  whCardActive: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primarySoft,
  },
  topRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  badges: { flexDirection: "row", gap: 6, marginBottom: 4 },
  name: { fontSize: 16, fontWeight: "800", color: colors.ink },
  loc: { fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  zones: { fontSize: 12, color: colors.inkSecondary },
  metrics: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: 10,
  },
  metricCell: { flex: 1 },
  metricVal: { fontSize: 15, fontWeight: "800", color: colors.ink, fontVariant: ["tabular-nums"] },
  metricLbl: { fontSize: 11, color: colors.inkMuted },
});

