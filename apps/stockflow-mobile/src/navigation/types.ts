export type TabKey = "dashboard" | "products" | "scanner" | "orders" | "alerts";

export type ScreenRoute =
  | { name: "dashboard" }
  | { name: "products"; initialLowStock?: boolean }
  | { name: "productDetail"; productId: string }
  | { name: "scanner" }
  | { name: "stockAdjustment"; productId?: string; warehouseId?: string }
  | { name: "warehouseSelection" }
  | { name: "stockTransfer"; productId?: string; fromWarehouseId?: string }
  | { name: "orders"; initialTab?: "po" | "so" }
  | { name: "alerts" }
  | { name: "profileSettings" };

export type NavigatorActions = {
  navigate: (route: ScreenRoute) => void;
  goBack: () => void;
  switchTab: (tab: TabKey) => void;
};

