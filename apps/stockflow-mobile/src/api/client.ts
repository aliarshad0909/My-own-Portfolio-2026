import type {
  AlertsSummary,
  AuthUser,
  DashboardSummary,
  LoginResponse,
  MovementItem,
  ProductItem,
  PurchaseOrder,
  SalesOrder,
  WarehouseItem,
} from "../types.ts";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export class StockFlowApiClient {
  private baseUrl: string;
  private token: string | null;

  constructor(baseUrl: string, token: string | null = null) {
    this.baseUrl = normalizeBaseUrl(baseUrl);
    this.token = token;
  }

  setBaseUrl(url: string) {
    this.baseUrl = normalizeBaseUrl(url);
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(init.headers as Record<string, string> | undefined),
    };
    if (init.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    });

    const text = await res.text();
    let json: Record<string, unknown> = {};
    if (text) {
      try {
        json = JSON.parse(text) as Record<string, unknown>;
      } catch {
        json = { error: text };
      }
    }

    if (!res.ok) {
      const message = typeof json.error === "string" ? json.error : `Request failed (${res.status})`;
      throw new ApiError(message, res.status);
    }

    return json as T;
  }

  async checkHealth(): Promise<{ ok: boolean; service: string; driver?: string; timestamp?: string }> {
    return this.request("/api/v1/health");
  }

  async loginDemo(): Promise<LoginResponse> {
    const data = await this.request<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ demo: true, clientType: "mobile" }),
    });
    this.token = data.token;
    return data;
  }

  async loginCredentials(email: string, password: string): Promise<LoginResponse> {
    const data = await this.request<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, clientType: "mobile" }),
    });
    this.token = data.token;
    return data;
  }

  async getMe(): Promise<{ user: AuthUser }> {
    return this.request("/api/v1/auth/me");
  }

  async logout(): Promise<void> {
    try {
      await this.request("/api/v1/auth/logout", { method: "POST" });
    } finally {
      this.token = null;
    }
  }

  async getDashboard(): Promise<DashboardSummary> {
    return this.request("/api/v1/dashboard");
  }

  async listProducts(params: {
    q?: string;
    category?: string;
    barcode?: string;
    warehouseId?: string;
    lowStock?: boolean;
  } = {}): Promise<{ products: ProductItem[]; warehouses: WarehouseItem[] }> {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.category && params.category !== "all") sp.set("category", params.category);
    if (params.barcode) sp.set("barcode", params.barcode);
    if (params.warehouseId && params.warehouseId !== "all") sp.set("warehouseId", params.warehouseId);
    if (params.lowStock) sp.set("lowStock", "1");
    const qs = sp.toString();
    return this.request(`/api/v1/products${qs ? `?${qs}` : ""}`);
  }

  async lookupByBarcode(barcode: string): Promise<ProductItem | null> {
    const res = await this.listProducts({ barcode: barcode.trim() });
    return res.products[0] ?? null;
  }

  async getProductDetail(id: string): Promise<{ product: ProductItem; movements: MovementItem[] }> {
    return this.request(`/api/v1/products/${encodeURIComponent(id)}`);
  }

  async listWarehouses(): Promise<{ warehouses: WarehouseItem[] }> {
    return this.request("/api/v1/warehouses");
  }

  async adjustStock(payload: {
    productId: string;
    warehouseId: string;
    type: "receipt" | "adjustment" | "issue";
    quantityDelta: number;
    binLocation?: string;
    reference?: string;
    note?: string;
  }): Promise<{ newQuantityOnHand: number; movement: MovementItem }> {
    return this.request("/api/v1/stock/adjust", {
      method: "POST",
      body: JSON.stringify({ ...payload, source: "mobile" }),
    });
  }

  async transferStock(payload: {
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: number;
    note?: string;
  }): Promise<{ fromQuantityOnHand: number; toQuantityOnHand: number; movement: MovementItem }> {
    return this.request("/api/v1/stock/transfer", {
      method: "POST",
      body: JSON.stringify({ ...payload, source: "mobile" }),
    });
  }

  async listPurchaseOrders(): Promise<{ purchaseOrders: PurchaseOrder[] }> {
    return this.request("/api/v1/purchase-orders");
  }

  async receivePurchaseOrder(id: string): Promise<{ purchaseOrder: PurchaseOrder }> {
    return this.request(`/api/v1/purchase-orders/${encodeURIComponent(id)}/receive`, {
      method: "POST",
      body: JSON.stringify({ source: "mobile" }),
    });
  }

  async listSalesOrders(): Promise<{ salesOrders: SalesOrder[] }> {
    return this.request("/api/v1/sales-orders");
  }

  async actionSalesOrder(
    id: string,
    action: "reserve" | "fulfil" | "ship" | "cancel",
    tracking?: { trackingCarrier?: string; trackingNumber?: string },
  ): Promise<{ salesOrder: SalesOrder }> {
    return this.request(`/api/v1/sales-orders/${encodeURIComponent(id)}/action`, {
      method: "POST",
      body: JSON.stringify({ action, ...tracking }),
    });
  }

  async getAlerts(): Promise<AlertsSummary> {
    return this.request("/api/v1/alerts");
  }

  async resetDemo(): Promise<{ ok: boolean }> {
    return this.request("/api/v1/demo/reset", { method: "POST" });
  }
}
