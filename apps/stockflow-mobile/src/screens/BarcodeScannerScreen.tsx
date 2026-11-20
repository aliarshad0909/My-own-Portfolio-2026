import React, { useCallback, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { Badge, Card, OutlineButton, PrimaryButton } from "../components/UiKit";
import type { NavigatorActions } from "../navigation/types";
import type { ProductItem } from "../types";
import { colors, formatMoney, radius, spacing } from "../theme";

const QUICK_TEST_BARCODES = [
  { code: "8901234500101", label: "SF-AUD-101 · Studio Monitor Headphones" },
  { code: "8901234500204", label: "SF-USB-204 · USB-C 10-in-1 Dock" },
  { code: "8901234500310", label: "SF-PKG-310 · Thermal Shipping Labels" },
  { code: "8901234500405", label: "SF-SCN-405 · 2D Warehouse Scanner" },
];

export function BarcodeScannerScreen({ nav }: { nav: NavigatorActions }) {
  const { client, showToast } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraActive, setCameraActive] = useState(Platform.OS !== "web");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [matchedProduct, setMatchedProduct] = useState<ProductItem | null>(null);
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);

  const performLookup = useCallback(
    async (rawCode: string) => {
      const code = rawCode.trim();
      if (!code || searching) return;
      setSearching(true);
      setScannedCode(code);
      setNotFoundCode(null);
      try {
        const product = await client.lookupByBarcode(code);
        if (product) {
          setMatchedProduct(product);
          showToast(`Matched ${product.sku} · ${product.name}`, "success");
        } else {
          setMatchedProduct(null);
          setNotFoundCode(code);
          showToast(`No SKU found for barcode ${code}`, "error");
        }
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Barcode lookup failed", "error");
      } finally {
        setSearching(false);
      }
    },
    [client, searching, showToast],
  );

  function handleCameraBarcode(event: { data?: string }) {
    if (!event?.data || searching || event.data === scannedCode) return;
    setBarcodeInput(event.data);
    void performLookup(event.data);
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Native Camera Scanner Viewport */}
      <View style={styles.scannerBox}>
        {Platform.OS !== "web" && cameraActive && permission?.granted ? (
          <View style={styles.cameraWrap}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "qr"],
              }}
              onBarcodeScanned={handleCameraBarcode}
            />
            <View style={styles.reticleOverlay}>
              <View style={styles.reticleFrame} />
              <Text style={styles.reticleHint}>Align EAN-13 / Code-128 barcode inside frame</Text>
            </View>
          </View>
        ) : (
          <View style={styles.cameraPlaceholder}>
            <View style={styles.scanIconCircle}>
              <Ionicons name="barcode-outline" size={32} color={colors.primary} />
            </View>
            <Text style={styles.placeholderTitle}>
              {Platform.OS === "web"
                ? "Camera Scanner Ready on Native iOS / Android"
                : "Camera Permission Required"}
            </Text>
            <Text style={styles.placeholderSub}>
              {Platform.OS === "web"
                ? "Use Expo Go or the Android APK build for live camera barcode scanning, or test instant EAN-13 lookup below against the live StockFlow database."
                : "Grant camera access to scan warehouse barcodes directly with expo-camera."}
            </Text>
            {Platform.OS !== "web" ? (
              <PrimaryButton
                label={permission?.granted ? "Resume Live Camera" : "Enable Camera Scanner"}
                icon="camera-outline"
                onPress={async () => {
                  const res = await requestPermission();
                  if (res.granted) setCameraActive(true);
                }}
              />
            ) : null}
          </View>
        )}
      </View>

      {/* Manual Barcode / SKU Input */}
      <Card style={{ gap: 10 }}>
        <Text style={styles.cardHeading}>Manual Barcode or SKU Lookup</Text>
        <View style={styles.lookupRow}>
          <TextInput
            value={barcodeInput}
            onChangeText={setBarcodeInput}
            placeholder="Enter EAN-13 barcode or SKU..."
            placeholderTextColor={colors.inkMuted}
            autoCapitalize="characters"
            returnKeyType="search"
            onSubmitEditing={() => void performLookup(barcodeInput)}
            style={styles.lookupInput}
          />
          <PrimaryButton
            label="Lookup"
            onPress={() => void performLookup(barcodeInput)}
            loading={searching}
            style={{ paddingVertical: 11, paddingHorizontal: 16 }}
          />
        </View>

        <Text style={styles.quickLabel}>Quick Demo Warehouse Barcodes</Text>
        <View style={styles.quickList}>
          {QUICK_TEST_BARCODES.map((item) => (
            <Pressable
              key={item.code}
              onPress={() => {
                setBarcodeInput(item.code);
                void performLookup(item.code);
              }}
              style={styles.quickChip}
            >
              <Ionicons name="scan-outline" size={14} color={colors.primaryDark} />
              <Text style={styles.quickChipCode}>{item.code}</Text>
              <Text style={styles.quickChipName} numberOfLines={1}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* Scan Match Result */}
      {matchedProduct ? (
        <Card style={styles.resultCard}>
          <View style={styles.resultTop}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <Badge label="MATCHED SKU" tone="emerald" />
                <Badge label={matchedProduct.sku} tone="navy" />
              </View>
              <Text style={styles.resultTitle}>{matchedProduct.name}</Text>
              <Text style={styles.resultSub}>
                EAN {matchedProduct.barcode} · {formatMoney(matchedProduct.sellingPriceCents)}
              </Text>
            </View>
            <View style={styles.resultQtyBox}>
              <Text style={styles.resultQty}>{matchedProduct.totalOnHand}</Text>
              <Text style={styles.resultQtyLabel}>on hand</Text>
            </View>
          </View>

          <View style={styles.binList}>
            {matchedProduct.warehouseStock.map((ws) => (
              <View key={ws.warehouseId} style={styles.binChip}>
                <Text style={styles.binChipText}>
                  {ws.warehouseCode} ({ws.binLocation}): {ws.quantityOnHand}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.resultActions}>
            <PrimaryButton
              label="Adjust Stock"
              icon="swap-vertical"
              onPress={() =>
                nav.navigate({ name: "stockAdjustment", productId: matchedProduct.id })
              }
              style={{ flex: 1 }}
            />
            <OutlineButton
              label="Details"
              icon="open-outline"
              onPress={() => nav.navigate({ name: "productDetail", productId: matchedProduct.id })}
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      ) : null}

      {notFoundCode ? (
        <Card style={styles.notFoundCard}>
          <Ionicons name="help-circle-outline" size={20} color={colors.danger} />
          <View style={{ flex: 1 }}>
            <Text style={styles.notFoundTitle}>Barcode Not Recognized</Text>
            <Text style={styles.notFoundSub}>
              No product matched &ldquo;{notFoundCode}&rdquo; in StockFlow. Verify the EAN-13 label or
              search the SKU catalog.
            </Text>
          </View>
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 28 },
  scannerBox: {
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.navy,
    borderWidth: 1,
    borderColor: colors.navyLight,
  },
  cameraWrap: {
    height: 220,
    position: "relative",
  },
  reticleOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.25)",
    gap: 10,
  },
  reticleFrame: {
    width: 230,
    height: 110,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.md,
  },
  reticleHint: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  cameraPlaceholder: {
    padding: spacing.xl,
    alignItems: "center",
    gap: 10,
  },
  scanIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(5, 150, 105, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  placeholderSub: {
    color: "#cbd5e1",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  lookupRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  lookupInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  quickList: { gap: 8 },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  quickChipCode: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.primaryDark,
    fontVariant: ["tabular-nums"],
  },
  quickChipName: {
    flex: 1,
    fontSize: 12,
    color: colors.inkSecondary,
    fontWeight: "600",
  },
  resultCard: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.surface,
    gap: 12,
  },
  resultTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 4,
  },
  resultTitle: { fontSize: 16, fontWeight: "800", color: colors.ink },
  resultSub: { fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  resultQtyBox: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  resultQty: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primaryDark,
    fontVariant: ["tabular-nums"],
  },
  resultQtyLabel: { fontSize: 10, fontWeight: "700", color: colors.primaryDark, textTransform: "uppercase" },
  binList: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  binChip: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  binChipText: { fontSize: 12, fontWeight: "600", color: colors.inkSecondary },
  resultActions: { flexDirection: "row", gap: 10 },
  notFoundCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerBorder,
  },
  notFoundTitle: { fontSize: 14, fontWeight: "800", color: colors.danger },
  notFoundSub: { fontSize: 12, color: colors.inkSecondary, marginTop: 2, lineHeight: 17 },
});
