import { Alert, Platform } from 'react-native';

// Alert.alert لا يعمل فعلياً على react-native-web (no-op بدون أي واجهة) — لذلك نستخدم
// window.confirm على الويب و Alert.alert الحقيقي على iOS/Android.
export function confirmAsync(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(typeof window !== 'undefined' ? window.confirm(`${title}\n\n${message}`) : false);
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'تراجع', style: 'cancel', onPress: () => resolve(false) },
      { text: 'تأكيد', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
