import { Platform } from 'react-native';

// react-native-web يعتبر shadow* (iOS-style) props قديمة ويطلب boxShadow بدلها.
// نستخدم قيمة مناسبة لكل منصة لتفادي تحذير/عطل بيئة التطوير على الويب.
export const cardShadow = Platform.select({
  web: { boxShadow: '0 4px 10px rgba(16,27,46,0.06)' } as any,
  default: {
    shadowColor: '#101B2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
});
