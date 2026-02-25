import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import {
  type Cart,
  type CartItem,
  type CartStatusType,
  type Product,
  DocKey,
  generateId,
  lineTotal,
  calculateVat,
  nowISO,
} from "@ica/shared";
import { MutableDocument } from "cbl-reactnative";
import { getDatabase } from "../db/couchbase";

interface CartContextValue {
  cart: Cart | null;
  initCart: (userId: string, storeId: string) => void;
  addItem: (product: Product) => Promise<void>;
  removeItem: (ean: string) => Promise<void>;
  updateItemQty: (ean: string, qty: number) => Promise<void>;
  setCartStatus: (status: CartStatusType) => Promise<void>;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const initializedRef = useRef(false);

  const saveCart = async (c: Cart) => {
    try {
      const db = getDatabase();
      const collection = await db.defaultCollection();
      const key = DocKey.cart(c.cart_id);
      const doc = new MutableDocument(key);
      doc.setData(c as unknown as Record<string, unknown>);
      await collection.save(doc);
    } catch (err) {
      console.error("Failed to save cart:", err);
    }
  };

  const recalcTotals = (items: CartItem[]): Cart["totals"] => {
    const subtotal = items.reduce((sum, i) => sum + i.line_total, 0);
    const vatTotal = items.reduce(
      (sum, i) => sum + calculateVat(i.line_total, 12),
      0
    );
    return {
      items_count: items.reduce((sum, i) => sum + i.qty, 0),
      subtotal: Math.round(subtotal * 100) / 100,
      vat_total: Math.round(vatTotal * 100) / 100,
      total: Math.round(subtotal * 100) / 100,
    };
  };

  const initCart = useCallback((userId: string, storeId: string) => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const cartId = generateId("cart");
    const newCart: Cart = {
      type: "cart",
      cart_id: cartId,
      user_id: userId,
      store_id: storeId,
      device_id: "device_local",
      status: "active",
      items: [],
      totals: { items_count: 0, subtotal: 0, vat_total: 0, total: 0 },
      created_at: nowISO(),
      updated_at: nowISO(),
    };
    setCart(newCart);
    saveCart(newCart);
  }, []);

  const addItem = useCallback(
    async (product: Product) => {
      if (!cart) return;

      const existing = cart.items.find((i) => i.ean === product.ean);
      let updatedItems: CartItem[];

      if (existing) {
        updatedItems = cart.items.map((i) =>
          i.ean === product.ean
            ? {
                ...i,
                qty: i.qty + 1,
                line_total: lineTotal(i.unit_price, i.qty + 1),
              }
            : i
        );
      } else {
        updatedItems = [
          ...cart.items,
          {
            ean: product.ean,
            name: product.name,
            qty: 1,
            unit_price: product.price,
            line_total: product.price,
            scanned_at: nowISO(),
          },
        ];
      }

      const updated: Cart = {
        ...cart,
        items: updatedItems,
        totals: recalcTotals(updatedItems),
        updated_at: nowISO(),
      };
      setCart(updated);
      await saveCart(updated);
    },
    [cart]
  );

  const removeItem = useCallback(
    async (ean: string) => {
      if (!cart) return;
      const updatedItems = cart.items.filter((i) => i.ean !== ean);
      const updated: Cart = {
        ...cart,
        items: updatedItems,
        totals: recalcTotals(updatedItems),
        updated_at: nowISO(),
      };
      setCart(updated);
      await saveCart(updated);
    },
    [cart]
  );

  const updateItemQty = useCallback(
    async (ean: string, qty: number) => {
      if (!cart) return;
      if (qty <= 0) return removeItem(ean);

      const updatedItems = cart.items.map((i) =>
        i.ean === ean
          ? { ...i, qty, line_total: lineTotal(i.unit_price, qty) }
          : i
      );
      const updated: Cart = {
        ...cart,
        items: updatedItems,
        totals: recalcTotals(updatedItems),
        updated_at: nowISO(),
      };
      setCart(updated);
      await saveCart(updated);
    },
    [cart]
  );

  const setCartStatus = useCallback(
    async (status: CartStatusType) => {
      if (!cart) return;
      const updated: Cart = { ...cart, status, updated_at: nowISO() };
      setCart(updated);
      await saveCart(updated);
    },
    [cart]
  );

  const clearCart = useCallback(() => {
    setCart(null);
    initializedRef.current = false;
  }, []);

  return (
    <CartContext.Provider
      value={{ cart, initCart, addItem, removeItem, updateItemQty, setCartStatus, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartContext must be used within CartProvider");
  return ctx;
}
