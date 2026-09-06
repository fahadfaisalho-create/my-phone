import { Platform, StyleSheet, Text, View } from 'react-native';
import MenuButton from '@/components/MenuButton';
import { colors, fonts } from '@/theme/colors';
import { useLocale } from '@/lib/i18n';

// الشريط العلوي للصفحة الرئيسية على الجوال — نفس بلوك الهوية اللي برأس
// الشريط الجانبي بالكمبيوتر (الاسم + صفة الحساب) مع زر فتح القائمة، حتى
// تكون الهوية وحدة على الجهازين
export default function MobileTopBar() {
  const { t, row, textAlign } = useLocale();
  return (
    <View style={[styles.bar, { flexDirection: row }]}>
      <View style={styles.brandWrap}>
        <Text style={[styles.brandName, { textAlign }]}>My Phone</Text>
        <Text style={[styles.brandSub, { textAlign }]}>{t('sidebar.roleLabel')}</Text>
      </View>
      <MenuButton />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 14 : 52,
    paddingBottom: 14,
  },
  brandWrap: { flex: 1 },
  brandName: { fontFamily: fonts.heading, fontWeight: '700', fontSize: 15, color: colors.ink },
  brandSub: { fontSize: 11, color: colors.muted, marginTop: 1 },
});
