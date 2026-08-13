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
  // الفرع الذي يتسوق منه المستهلك حالياً (لو المحل عنده أكثر من فرع) — يُستخدم عند إنشاء الطلب
  branchId: string | null;
  branchName: string | null;
  items: CartItem[];
}

interface CartContextValue extends CartState {
  addItem: (
    storeId: string,
    storeName: string,
    product: StoreProduct,
    branchId?: string | null,
    branchName?: string | null,
  ) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  total: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const EMPTY_STATE: CartState = { storeId: null, storeName: null, branchId: null, branchName: null, items: [] };

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>(EMPTY_STATE);

  const addItem = useCallback(
    (
      storeId: string,
      storeName: string,
      product: StoreProduct,
      branchId: string | null = null,
      branchName: string | null = null,
    ) => {
      setState((prev) => {
        // السلة لسياق واحد فقط (محل + فرع) بنفس الوقت — تغيير المحل أو الفرع يفرّغ السلة السابقة
        const sameContext = prev.storeId === storeId && prev.branchId === branchId;
        const base: CartState = sameContext ? prev : { storeId, storeName, branchId, branchName, items: [] };
        const existing = base.items.find((i) => i.productId === product.id);
        const items = existing
          ? base.items.map((i) => (i.productId === product.id ? { ...i, qty: i.qty + 1 } : i))
          : [...base.items, { productId: product.id, name: product.name, price: Number(product.price), qty: 1 }];
        return { storeId, storeName, branchId, branchName, items };
      });
    },
    [],
  );

  const removeItem = useCallback((productId: string) => {
    setState((prev) => ({ ...prev, items: prev.items.filter((i) => i.productId !== productId) }));
  }, []);

  const clear = useCallback(() => setState(EMPTY_STATE), []);

  const total = useMemo(() => state.items.reduce((sum, i) => sum + i.price * i.qty, 0), [state.items]);

  const value: CartContextValue = { ...state, addItem, removeItem, clear, total };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
