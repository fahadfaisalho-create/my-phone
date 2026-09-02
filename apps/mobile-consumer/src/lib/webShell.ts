import { createNavigationContainerRef } from '@react-navigation/native';
import { Platform, useWindowDimensions } from 'react-native';
import type { RootStackParamList } from '@/navigation/types';

// مرجع تنقّل خارج شجرة NavigationContainer — يحتاجه الشريط الجانبي (WebSidebar)
// لأنه يعيش خارج الملاح نفسه (عنصر شقيق له داخل قشرة الويب)، فما يقدر يستخدم
// hook التنقل العادي (useNavigation) زي بقية الشاشات
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// قشرة الشريط الجانبي (زي لوحة التاجر/الإدمن بالضبط) تظهر فقط على الويب
// وبعرض شاشة كبير (سطح مكتب) — على الجوال (سواء تطبيق أصلي أو متصفح جوال
// ضيق) يبقى التنقل بأسلوب الصفحات المتتالية (stack) الأصلي لأن الشريط
// الجانبي غير عملي على شاشة صغيرة
const WIDE_BREAKPOINT = 900;

export function useIsWideWeb(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= WIDE_BREAKPOINT;
}
