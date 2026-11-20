import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { Badge, Card, OutlineButton, PrimaryButton } from "../components/UiKit";
import { colors, radius, spacing } from "../theme";

export function LoginScreen() {
  const { apiUrl, setApiUrl, client, loginDemo, loginCredentials } = useApp();
  const [serverInput, setServerInput] = useState(apiUrl);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");
  const [email, setEmail] = useState("ops@stockflow.studio");
  const [password, setPassword] = useState("StockFlowDemo2026!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setServerInput(apiUrl);
    setServerStatus("checking");
    client
      .checkHealth()
      .then(() => {
        if (active) setServerStatus("online");
      })
      .catch(() => {
        if (active) setServerStatus("offline");
      });
    return () => {
      active = false;
    };
  }, [apiUrl, client]);

  async function handleDemoLogin() {
    setError(null);
    setLoading(true);
    try {
      await loginDemo();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect to StockFlow server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCredentialLogin() {
    setError(null);
    setLoading(true);
    try {
      await loginCredentials(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveServer() {
    setError(null);
    await setApiUrl(serverInput);
    setServerStatus("checking");
    try {
      await client.checkHealth();
      setServerStatus("online");
      setShowServerConfig(false);
    } catch {
      setServerStatus("offline");
      setError("Server unreachable at that URL. Verify StockFlow backend is running.");
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brandBlock}>
          <View style={styles.logoMark}>
            <Ionicons name="cube" size={26} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.brandTitle}>StockFlow Mobile</Text>
            <Text style={styles.brandSub}>Warehouse &amp; Inventory Companion</Text>
          </View>
          <Badge
            label={
              serverStatus === "online"
                ? "API Online"
                : serverStatus === "checking"
                  ? "Checking..."
                  : "API Offline"
            }
            tone={serverStatus === "online" ? "emerald" : serverStatus === "checking" ? "neutral" : "amber"}
          />
        </View>

        <Card style={styles.demoCard}>
          <View style={styles.demoHeader}>
            <Ionicons name="flash" size={18} color={colors.primaryDark} />
            <Text style={styles.demoTitle}>Instant Warehouse Demo Access</Text>
          </View>
          <Text style={styles.demoCopy}>
            Connect directly to the shared StockFlow PostgreSQL backend with Bearer token authentication.
            All scans, stock adjustments, transfers, and order receipts sync live with the web console.
          </Text>
          <PrimaryButton
            label="Enter Demo Warehouse"
            icon="log-in-outline"
            onPress={handleDemoLogin}
            loading={loading}
          />
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.formHeading}>Operator Sign In</Text>

          <Text style={styles.label}>Work Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="ops@stockflow.studio"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Enter password"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
          />

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <PrimaryButton
            label="Sign In with Credentials"
            tone="navy"
            onPress={handleCredentialLogin}
            loading={loading}
            style={{ marginTop: spacing.sm }}
          />
        </Card>

        <View style={styles.serverFooter}>
          <Pressable
            onPress={() => setShowServerConfig((v) => !v)}
            style={styles.serverToggle}
          >
            <Ionicons name="server-outline" size={15} color={colors.inkSecondary} />
            <Text style={styles.serverToggleText} numberOfLines={1}>
              Backend: {apiUrl}
            </Text>
            <Ionicons
              name={showServerConfig ? "chevron-up" : "chevron-down"}
              size={15}
              color={colors.inkMuted}
            />
          </Pressable>

          {showServerConfig ? (
            <Card style={{ marginTop: spacing.sm }}>
              <Text style={styles.label}>StockFlow API Base URL</Text>
              <TextInput
                value={serverInput}
                onChangeText={setServerInput}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="http://192.168.1.50:3020"
                placeholderTextColor={colors.inkMuted}
                style={styles.input}
              />
              <Text style={styles.helperText}>
                Use your computer&apos;s LAN IP on Expo Go, or https://stock.aliarshad.co once deployed.
              </Text>
              <OutlineButton
                label="Save & Test Connection"
                icon="pulse-outline"
                onPress={handleSaveServer}
                style={{ marginTop: spacing.sm }}
              />
            </Card>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    padding: spacing.xl,
    paddingTop: 36,
    gap: spacing.lg,
  },
  brandBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  logoMark: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: colors.ink,
  },
  brandSub: {
    fontSize: 13,
    color: colors.inkMuted,
  },
  demoCard: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
    gap: spacing.md,
  },
  demoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  demoTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.primaryDark,
  },
  demoCopy: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkSecondary,
  },
  formCard: {
    gap: spacing.sm,
  },
  formHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.inkSecondary,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.ink,
  },
  helperText: {
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 6,
    lineHeight: 17,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    marginTop: 4,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.danger,
    fontWeight: "600",
  },
  serverFooter: {
    marginTop: 4,
  },
  serverToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  serverToggleText: {
    fontSize: 12,
    color: colors.inkSecondary,
    fontWeight: "600",
    maxWidth: "82%",
  },
});

