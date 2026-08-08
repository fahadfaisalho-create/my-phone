import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { I18nManager } from 'react-native';
import {
  useFonts as useCairoFonts,
  Cairo_600SemiBold,
  Cairo_700Bold,
  Cairo_800ExtraBold,
} from '@expo-google-fonts/cairo';
import {
  useFonts as useIbmFonts,
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import RootNavigator from '@/navigation/RootNavigator';
import { ScreenLoading } from '@/components/ui';
import { getToken } from '@/lib/api';
import { CartProvider } from '@/lib/CartContext';

// يُفعَّل RTL على مستوى نظام التشغيل عند البناء الأصلي (يحتاج إعادة تشغيل)؛
// في وضع التطوير/الويب نعتمد على تنسيقات row-reverse/textAlign يدوياً لضمان ثبات المعاينة.
I18nManager.allowRTL(true);

export default function App() {
  const [cairoLoaded] = useCairoFonts({ Cairo_600SemiBold, Cairo_700Bold, Cairo_800ExtraBold });
  const [ibmLoaded] = useIbmFonts({
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
  });
  const [initialRoute, setInitialRoute] = useState<'Home' | 'OtpRequest' | null>(null);

  useEffect(() => {
    getToken().then((token) => setInitialRoute(token ? 'Home' : 'OtpRequest'));
  }, []);

  if (!cairoLoaded || !ibmLoaded || !initialRoute) {
    return <ScreenLoading />;
  }

  return (
    <CartProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <RootNavigator initialRoute={initialRoute} />
      </NavigationContainer>
    </CartProvider>
  );
}
