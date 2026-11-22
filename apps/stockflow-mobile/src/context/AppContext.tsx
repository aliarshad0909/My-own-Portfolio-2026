import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StockFlowApiClient, normalizeBaseUrl } from "../api/client";
import type { AuthUser, WarehouseItem } from "../types";

const STORAGE_URL_KEY = "stockflow_mobile_api_url";
const STORAGE_TOKEN_KEY = "stockflow_mobile_token";
const STORAGE_WAREHOUSE_KEY = "stockflow_mobile_active_warehouse";

// Expo inlines direct EXPO_PUBLIC_* member expressions during the web build.
const EXPO_API_URL =
  typeof process !== "undefined" ? process.env.EXPO_PUBLIC_API_URL : undefined;
const DEFAULT_API_URL = EXPO_API_URL || "http://localhost:3020";

export type ToastMessage = {
  id: number;
  kind: "success" | "error" | "info";
  text: string;
};

type AppContextValue = {
  client: StockFlowApiClient;
  apiUrl: string;
  setApiUrl: (url: string) => Promise<void>;
  user: AuthUser | null;
  bootstrapping: boolean;
  activeWarehouse: WarehouseItem | null;
  warehouses: WarehouseItem[];
  setActiveWarehouseById: (warehouseId: string) => Promise<void>;
  refreshWarehouses: () => Promise<WarehouseItem[]>;
  loginDemo: () => Promise<void>;
  loginCredentials: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetDemoData: () => Promise<void>;
  refreshKey: number;
  bumpRefresh: () => void;
  toast: ToastMessage | null;
  showToast: (text: string, kind?: "error" | "success" | "info") => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [apiUrl, setApiUrlState] = useState<string>(normalizeBaseUrl(DEFAULT_API_URL));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [bootstrapping, setBootstrapping] = useState<boolean>(true);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [activeWarehouseId, setActiveWarehouseId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clientRef = useRef<StockFlowApiClient>(new StockFlowApiClient(DEFAULT_API_URL));

  const showToast = useCallback((text: string, kind: "success" | "error" | "info" = "info") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ id: Date.now(), kind, text });
    toastTimerRef.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const bumpRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const refreshWarehouses = useCallback(async () => {
    try {
      const res = await clientRef.current.listWarehouses();
      setWarehouses(res.warehouses);
      setActiveWarehouseId((prev) => {
        if (prev && res.warehouses.some((w) => w.id === prev)) return prev;
        return res.warehouses[0]?.id ?? null;
      });
      return res.warehouses;
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [savedUrl, savedToken, savedWh] = await Promise.all([
          AsyncStorage.getItem(STORAGE_URL_KEY),
          AsyncStorage.getItem(STORAGE_TOKEN_KEY),
          AsyncStorage.getItem(STORAGE_WAREHOUSE_KEY),
        ]);
        const resolvedUrl = normalizeBaseUrl(savedUrl || DEFAULT_API_URL);
        if (active) setApiUrlState(resolvedUrl);
        clientRef.current.setBaseUrl(resolvedUrl);
        if (savedWh && active) setActiveWarehouseId(savedWh);

        if (savedToken) {
          clientRef.current.setToken(savedToken);
          try {
            const me = await clientRef.current.getMe();
            if (active) {
              setUser(me.user);
              await refreshWarehouses();
            }
          } catch {
            clientRef.current.setToken(null);
            await AsyncStorage.removeItem(STORAGE_TOKEN_KEY);
          }
        }
      } finally {
        if (active) setBootstrapping(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshWarehouses]);

  const setApiUrl = useCallback(async (url: string) => {
    const clean = normalizeBaseUrl(url);
    setApiUrlState(clean);
    clientRef.current.setBaseUrl(clean);
    await AsyncStorage.setItem(STORAGE_URL_KEY, clean);
  }, []);

  const setActiveWarehouseById = useCallback(async (warehouseId: string) => {
    setActiveWarehouseId(warehouseId);
    await AsyncStorage.setItem(STORAGE_WAREHOUSE_KEY, warehouseId);
  }, []);

  const loginDemo = useCallback(async () => {
    const res = await clientRef.current.loginDemo();
    await AsyncStorage.setItem(STORAGE_TOKEN_KEY, res.token);
    setUser(res.user);
    await refreshWarehouses();
    bumpRefresh();
    showToast(`Signed in as ${res.user.name}`, "success");
  }, [bumpRefresh, refreshWarehouses, showToast]);

  const loginCredentials = useCallback(
    async (email: string, password: string) => {
      const res = await clientRef.current.loginCredentials(email, password);
      await AsyncStorage.setItem(STORAGE_TOKEN_KEY, res.token);
      setUser(res.user);
      await refreshWarehouses();
      bumpRefresh();
      showToast(`Signed in as ${res.user.name}`, "success");
    },
    [bumpRefresh, refreshWarehouses, showToast],
  );

  const logout = useCallback(async () => {
    try {
      await clientRef.current.logout();
    } catch {
      // Ignore network errors during logout
    } finally {
      await AsyncStorage.removeItem(STORAGE_TOKEN_KEY);
      setUser(null);
      setWarehouses([]);
      showToast("Signed out of StockFlow Mobile", "info");
    }
  }, [showToast]);

  const resetDemoData = useCallback(async () => {
    await clientRef.current.resetDemo();
    await refreshWarehouses();
    bumpRefresh();
    showToast("Demo warehouse dataset restored", "success");
  }, [bumpRefresh, refreshWarehouses, showToast]);

  const activeWarehouse = useMemo(
    () => warehouses.find((w) => w.id === activeWarehouseId) ?? warehouses[0] ?? null,
    [warehouses, activeWarehouseId],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      client: clientRef.current,
      apiUrl,
      setApiUrl,
      user,
      bootstrapping,
      activeWarehouse,
      warehouses,
      setActiveWarehouseById,
      refreshWarehouses,
      loginDemo,
      loginCredentials,
      logout,
      resetDemoData,
      refreshKey,
      bumpRefresh,
      toast,
      showToast,
    }),
    [
      apiUrl,
      setApiUrl,
      user,
      bootstrapping,
      activeWarehouse,
      warehouses,
      setActiveWarehouseById,
      refreshWarehouses,
      loginDemo,
      loginCredentials,
      logout,
      resetDemoData,
      refreshKey,
      bumpRefresh,
      toast,
      showToast,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
