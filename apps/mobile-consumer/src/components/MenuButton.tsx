import { Pressable, StyleSheet, Text } from 'react-native';
import { useDrawer } from '@/lib/drawer';
import { colors, radius } from '@/theme/colors';

// زر فتح القائمة الجانبية على الجوال — نسخة داكنة داخل رأس الملاح (خلفيته
// غامقة) ونسخة فاتحة داخل الشريط العلوي للصفحة الرئيسية
export default function MenuButton({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const { open } = useDrawer();
  return (
    <Pressable
      onPress={open}
      hitSlop={10}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.btn,
        tone === 'light' && styles.btnLight,
        pressed && { opacity: 0.6 },
      ]}
    >
      <Text style={[styles.icon, tone === 'light' && styles.iconLight]}>☰</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  btnLight: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.chipBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: { fontSize: 19, color: '#fff' },
  iconLight: { color: colors.ink },
});
