import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

// حالة القائمة الجانبية المنسدلة على الجوال — تعيش بقشرة التطبيق (App)
// لأن زر فتحها موجود داخل شاشات الملاح (headerRight/الشريط العلوي) بينما
// القائمة نفسها تُرسم فوق كل شي خارج الملاح
interface DrawerValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const DrawerContext = createContext<DrawerValue>({
  isOpen: false,
  open: () => undefined,
  close: () => undefined,
});

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);
  return <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>;
}

export function useDrawer() {
  return useContext(DrawerContext);
}
