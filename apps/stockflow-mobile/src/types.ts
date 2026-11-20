export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type LoginResponse = {
  token: string;
  expiresAt: string;
  user: AuthUser;
};

export type WarehouseStockEntry = {
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  binLocation: string;
  quantityOnHand: number;
  quantityReserved: number;
  available: number;
};

export type ProductItem = {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  unitCostCents: number;
  sellingPriceCents: number;
  minStockThreshold: number;
  status: string;
  totalOnHand: number;
  totalReserved: number;
  totalAvailable: number;
  valuationCents: number;
  isLowStock: boolean;
  warehouseStock: WarehouseStockEntry[];
};

export type WarehouseItem = {
  id: string;
  code: string;
  name: string;
  location: string;
  storageZones: string;
  managerName: string;
  status: string;
  skuCount?: number;
  totalUnits?: number;
  totalReserved?: number;
  valuationCents?: number;
};

export type MovementItem = {
  id: string;
  type: "receipt" | "adjustment" | "issue" | "transfer" | "po_receive" | "so_fulfil" | string;
  productId: string;
  productName?: string;
  productSku?: string;
  fromWarehouseId: string | null;
  toWarehouseId: string | null;
  fromWarehouseCode?: string | null;
  toWarehouseCode?: string | null;
  quantityDelta: number;
  reference: string;
  note: string;
  performedBy: string;
  source: "web" | "mobile" | "system" | string;
  createdAt: string;
};

export type DashboardSummary = {
  kpis: {
    totalProducts: number;
    totalStockQuantity: number;
    totalValuationCents: number;
    lowStockCount: number;
    pendingPurchaseOrders: number;
    pendingSalesOrders: number;
    warehouseCount: number;
  };
  lowStockProducts: ProductItem[];
  warehouseDistribution: {
    id: string;
    code: string;
    name: string;
    location: string;
    skuCount: number;
    units: number;
    valuationCents: number;
  }[];
  recentMovements: MovementItem[];
};

export type PurchaseOrderItem = {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCostCents: number;
};

export type PurchaseOrder = {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  status: string;
  expectedDate: string;
  notes: string;
  totalCents: number;
  items: PurchaseOrderItem[];
  createdAt: string;
};

export type SalesOrderItem = {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
};

export type SalesOrder = {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  status: string;
  deliveryStatus: string;
  trackingCarrier?: string | null;
  trackingNumber?: string | null;
  notes: string;
  totalCents: number;
  items: SalesOrderItem[];
  createdAt: string;
};

export type AlertsSummary = {
  lowStock: {
    productId: string;
    sku: string;
    barcode: string;
    name: string;
    available: number;
    threshold: number;
    deficit: number;
  }[];
  pendingPurchaseOrders: {
    id: string;
    orderNumber: string;
    supplierName: string;
    expectedDate: string;
    status: string;
  }[];
  pendingSalesOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    status: string;
  }[];
};

