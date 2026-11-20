import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import {
  Badge,
  Card,
  OutlineButton,
  PrimaryButton,
  SectionHeader,
  TopSubHeader,
} from "../components/UiKit";
import type { NavigatorActions } from "../navigation/types";
import { colors, radius, spacing } from "../theme";

export function ProfileSettingsScreen({ nav }: { nav: NavigatorActions }) {
  const {
    user,
    apiUrl,
    setApiUrl,
    client,
    activeWarehouse,
    resetDemoData,
    logout,
    showToast,
  } = useApp();

  const [urlInput, setUrlInput] = useState(apiUrl);
  const [testing, setTesting] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleSaveAndTest() {
    setTesting(true);
    try {
      await setApiUrl(urlInput);
      const health = await client.checkHealth();
      showToast(`Connected to ${health.service} (${health.ok ? "ok" : "error"})`, "success");
    } catch {
      showToast("Could not reach StockFlow API at that URL", "error");
    } finally {
      setTesting(false);
    }
  }

  async function handleResetDemo() {
    setResetting(true);
    try {
      await resetDemoData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Reset failed", "error");
    } finally {
      setResetting(false);
    }
  }

  return (
    <View style={styles.root}>
      <TopSubHeader
        title="Profile & Settings"
        subtitle="Operator session, API sync & build metadata"
        onBack={nav.goBack}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Operator Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name || "Warehouse Operator"}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
              <Badge label={(user?.role || "operator").toUpperCase()} tone="emerald" />
              <Badge label="Bearer Session" tone="navy" />
            </View>
          </View>
        </Card>

        {/* Active Facility */}
        <SectionHeader title="Working Warehouse" />
        <Card style={{ gap: 10 }}>
          <Text style={styles.infoTitle}>
            {activeWarehouse ? `${activeWarehouse.code} · ${activeWarehouse.name}` : "Not selected"}
          </Text>
          <Text style={styles.infoSub}>
            {activeWarehouse?.location || "Select your primary warehouse for quick adjustments."}
          </Text>
          <OutlineButton
            label="Change Active Warehouse"
            icon="business-outline"
            onPress={() => nav.navigate({ name: "warehouseSelection" })}
          />
        </Card>

        {/* API Configuration */}
        <SectionHeader title="Backend Synchronization" />
        <Card style={{ gap: 10 }}>
          <Text style={styles.label}>StockFlow REST API Base URL</Text>
          <TextInput
            value={urlInput}
            onChangeText={setUrlInput}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="http://localhost:3020"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
          />
          <OutlineButton
            label={testing ? "Testing Connection..." : "Save & Ping /api/v1/health"}
            icon="pulse-outline"
            disabled={testing}
            onPress={() => void handleSaveAndTest()}
          />
        </Card>

        {/* Demo Controls & Build Info */}
        <SectionHeader title="Demo Workspace & Build Status" />
        <Card style={{ gap: 10 }}>
          <Text style={styles.infoSub}>
            Platform runtime: {Platform.OS.toUpperCase()} · StockFlow Mobile v1.0.0 (Expo SDK 52).
            Distributed for Expo Go testing and EAS internal Android APK preview — not published on
            public app stores.
          </Text>
          <OutlineButton
            label={resetting ? "Restoring Demo Dataset..." : "Reset Seeded Demo Data"}
            icon="refresh-outline"
            disabled={resetting}
            onPress={() => void handleResetDemo()}
          />
          <PrimaryButton
            label="Sign Out"
            icon="log-out-outline"
            tone="danger"
            onPress={() => void logout()}
          />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 32 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 17, fontWeight: "800", color: colors.ink },
  email: { fontSize: 13, color: colors.inkMuted, marginTop: 2 },
  infoTitle: { fontSize: 15, fontWeight: "700", color: colors.ink },
  infoSub: { fontSize: 12, color: colors.inkMuted, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: "700", color: colors.inkSecondary },
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
