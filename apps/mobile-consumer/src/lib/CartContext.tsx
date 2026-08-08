import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { StoreProduct } from './types';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

interface CartState {
  storeId: string | null;
  storeName: string | null;
  items: CartItem[];
}

interface CartContextValue extends CartState {
  addItem: (storeId: string, storeName: string, product: StoreProduct) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  total: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>({ storeId: null, storeName: null, items: [] });

  const addItem = useCallback((storeId: string, storeName: string, product: StoreProduct) => {
    setState((prev) => {
      // السلة لمحل واحد فقط في نفس الوقت — إضافة من محل آخر تفرّغ السلة السابقة
      const base: CartState = prev.storeId && prev.storeId !== storeId ? { storeId, storeName, items: [] } : prev;
      const existing = base.items.find((i) => i.productId === product.id);
      const items = existing
        ? base.items.map((i) => (i.productId === product.id ? { ...i, qty: i.qty + 1 } : i))
        : [...base.items, { productId: product.id, name: product.name, price: Number(product.price), qty: 1 }];
      return { storeId, storeName, items };
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setState((prev) => ({ ...prev, items: prev.items.filter((i) => i.productId !== productId) }));
  }, []);

  const clear = useCallback(() => setState({ storeId: null, storeName: null, items: [] }), []);

  const total = useMemo(() => state.items.reduce((sum, i) => sum + i.price * i.qty, 0), [state.items]);

  const value: CartContextValue = { ...state, addItem, removeItem, clear, total };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
