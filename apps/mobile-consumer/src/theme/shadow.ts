import { Platform } from 'react-native';

// react-native-web يعتبر shadow* (iOS-style) props قديمة ويطلب boxShadow بدلها.
// نستخدم قيمة مناسبة لكل منصة لتفادي تحذير/عطل بيئة التطوير على الويب.
export const cardShadow = Platform.select({
  web: { boxShadow: '0 4px 14px rgba(79,70,229,0.07)' } as any,
  default: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 2,
  },
});
