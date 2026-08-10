import type { NavigationProp } from '@react-navigation/native';
import type { ReturnTo, RootStackParamList } from '@/navigation/types';
import { getToken } from './api';

// يتحقق من وجود جلسة دخول قبل تنفيذ إجراء يحتاج مصادقة (إضافة للسلة، حجز، شات، تقييم...).
// إذا ما فيه جلسة يوجّه المستخدم لتسجيل الدخول مع حفظ الشاشة الحالية للرجوع لها بعد النجاح.
// يرجع true إذا الجلسة موجودة فعلاً (نفّذ إجراءك بعدها)، و false إذا تم التوجيه لتسجيل الدخول.
export async function requireAuth(
  navigation: NavigationProp<RootStackParamList>,
  returnTo: ReturnTo,
): Promise<boolean> {
  const token = await getToken();
  if (token) return true;
  navigation.navigate('OtpRequest', { returnTo });
  return false;
}
