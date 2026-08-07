import { AppRegistry, Platform } from 'react-native';
import App from './App';

if (Platform.OS === 'web') {
  // نسخة مبسّطة من registerRootComponent() بدون withDevTools/DevLoadingView —
  // تلك الطبقة تسبب خطأ "Objects are not valid as a React child" في معاينة
  // الويب بهذا الإصدار من expo (مشكلة معروفة بأدوات التطوير، غير متعلقة بكود
  // التطبيق). Fast Refresh عبر Metro يستمر يعمل طبيعياً بدونها.
  AppRegistry.registerComponent('main', () => App);
  if (typeof document !== 'undefined') {
    const rootTag = document.getElementById('root');
    if (rootTag) {
      AppRegistry.runApplication('main', { rootTag });
    }
  }
} else {
  // iOS / Android (Expo Go أو build حقيقي): المسار القياسي الكامل من Expo
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { registerRootComponent } = require('expo');
  registerRootComponent(App);
}
