import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { I18nManager, StyleSheet, View } from 'react-native';
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
import { CartProvider } from '@/lib/CartContext';
import { LocaleProvider, useLocale } from '@/lib/i18n';
import { navigationRef, useIsWideWeb } from '@/lib/webShell';
import WebSidebar from '@/components/WebSidebar';
import { colors } from '@/theme/colors';
import type { RootStackParamList } from '@/navigation/types';

// رابط مباشر لصفحة محل معيّن — يقدر التاجر يشاركه (يفتح مباشرة على صفحة محله
// حتى لو زائر بدون تسجيل دخول، لأن StoreDetail عام أصلاً). "myphone://" لبناء
// التطبيق الأصلي مستقبلاً، والباقي يغطي فتح الرابط من متصفح الويب مباشرة.
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['myphone://', 'http://localhost:3003', 'https://localhost:3003'],
  config: {
    screens: {
      Home: '',
      StoreDetail: 'store/:storeId',
    },
  },
};

// يُفعَّل RTL على مستوى نظام التشغيل عند البناء الأصلي (يحتاج إعادة تشغيل)؛
// في وضع التطوير/الويب نعتمد على تنسيقات row-reverse/textAlign يدوياً لضمان ثبات المعاينة.
I18nManager.allowRTL(true);

// قشرة الشريط الجانبي (نفس هوية لوحتي التاجر والإدمن بالضبط) — تظهر فقط
// بعرض الويب الواسع؛ داخل LocaleProvider لأنها تحتاج useLocale/useIsWideWeb
function ShellRoot() {
  const isWideWeb = useIsWideWeb();
  const { row } = useLocale();

  return (
    <View style={[styles.flex, isWideWeb && { flexDirection: row }]}>
      {isWideWeb && <WebSidebar />}
      <View style={styles.flex}>
        <NavigationContainer ref={navigationRef} linking={linking} fallback={<ScreenLoading />}>
          <StatusBar style="light" />
          <RootNavigator initialRoute="Home" />
        </NavigationContainer>
      </View>
    </View>
  );
}

export default function App() {
  const [cairoLoaded] = useCairoFonts({ Cairo_600SemiBold, Cairo_700Bold, Cairo_800ExtraBold });
  const [ibmLoaded] = useIbmFonts({
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
  });
  if (!cairoLoaded || !ibmLoaded) {
    return <ScreenLoading />;
  }

  // التصفح مفتوح للجميع بدون تسجيل دخول — الشاشة الرئيسية دائماً نقطة البداية.
  // تسجيل الدخول يُطلب فقط عند إجراء فعلي (إضافة للسلة، حجز، شات، تقييم...) عبر requireAuth.
  return (
    <LocaleProvider>
      <CartProvider>
        <ShellRoot />
      </CartProvider>
    </LocaleProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
});
