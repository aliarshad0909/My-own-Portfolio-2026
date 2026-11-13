export type Channel = "Direct" | "Marketplace" | "Wholesale" | "Retail partner" | "Subscription";
export type Region = "West" | "Midwest" | "South" | "Northeast" | "Canada" | "International";

export type Product = {
  id: string;
  name: string;
  category: string;
  unitPrice: number; // cents
  unitCost: number; // cents
  onHand: number;
};

export type Order = {
  id: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  productId: string;
  units: number;
  /** Revenue for the line, in cents, after any discount. */
  revenue: number;
  channel: Channel;
  region: Region;
  customerId: string;
  /** True when this was the customer's first order. */
  isNewCustomer: boolean;
};

export type Granularity = "day" | "week" | "month";

export type DateRange = { from: string; to: string };

export type Metric = {
  revenue: number;
  orders: number;
  units: number;
  customers: number;
  newCustomers: number;
  grossProfit: number;
};
