import { useSyncExternalStore } from "react";
import { seedProducts } from "../data/products.ts";
import { loadJSON, saveJSON } from "./storage.ts";
import type { CartLine, Order, Product } from "./types.ts";

export type State = {
  products: Product[];
  cart: CartLine[];
  wishlist: string[];
  orders: Order[];
  promoCode: string;
};

const KEY = "tessera-demo-v1";

const fresh = (): State => ({ products: seedProducts(), cart: [], wishlist: [], orders: [], promoCode: "" });

function initial(): State {
  const saved = loadJSON<Partial<State>>(KEY);
  if (!saved || !Array.isArray(saved.products)) return fresh();
  return { ...fresh(), ...saved } as State;
}

let state: State = initial();
const listeners = new Set<() => void>();

export const getState = () => state;

export function setState(update: Partial<State> | ((s: State) => Partial<State>)): void {
  const patch = typeof update === "function" ? update(state) : update;
  state = { ...state, ...patch };
  saveJSON(KEY, state);
  listeners.forEach((l) => l());
}

export function resetDemo(): void {
  state = fresh();
  saveJSON(KEY, state);
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state));
}
