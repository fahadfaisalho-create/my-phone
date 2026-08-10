import { useEffect, useRef } from 'react';
import { Animated, ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '@/theme/colors';
import { cardShadow } from '@/theme/shadow';

export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// حالة فارغة موحّدة (أيقونة + نص) بدل نص باهت وحيد — تُستخدم بكل القوائم الفاضية
export function EmptyState({ icon = '📭', text }: { icon?: string; text: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

// شريط تحميل نابض بديل عن سبينر وحيد — يعطي إحساس أحدث أثناء تحميل القوائم
export function Skeleton({ width = '100%', height = 14, style }: { width?: number | string; height?: number; style?: any }) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={[{ width: width as any, height, borderRadius: 8, backgroundColor: colors.chipBg, opacity }, style]}
    />
  );
}

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primaryBtn,
        (disabled || loading) && styles.btnDisabled,
        pressed && !disabled && !loading && styles.btnPressed,
      ]}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{title}</Text>}
    </Pressable>
  );
}

export function SecondaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}>
      <Text style={styles.secondaryBtnText}>{title}</Text>
    </Pressable>
  );
}

export function LinkButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Text style={styles.linkText}>{title}</Text>
    </Pressable>
  );
}

export function Badge({ label, tone }: { label: string; tone: 'green' | 'amber' | 'red' }) {
  const bg = tone === 'green' ? colors.greenBg : tone === 'amber' ? colors.amberBg : colors.redBg;
  const fg = tone === 'green' ? colors.green : tone === 'amber' ? colors.amber : colors.red;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <View style={[styles.badgeDot, { backgroundColor: fg }]} />
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function Stars({
  rating,
  size = 14,
  reviewsCount,
}: {
  rating: number | null;
  size?: number;
  reviewsCount?: number;
}) {
  if (rating === null) {
    return <Text style={[styles.muted, { fontSize: size - 1 }]}>لا يوجد تقييمات بعد</Text>;
  }
  const full = Math.round(rating);
  const str = Array.from({ length: 5 }, (_, i) => (i < full ? '★' : '☆')).join('');
  return (
    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}>
      <Text style={{ color: colors.star, fontSize: size, letterSpacing: 1 }}>{str}</Text>
      <Text style={[styles.muted, { fontSize: size - 2 }]}>
        {rating.toFixed(1)}
        {typeof reviewsCount === 'number' ? ` (${reviewsCount})` : ''}
      </Text>
    </View>
  );
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  return <Text style={styles.errorText}>{children}</Text>;
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.note}>
      <Text style={styles.noteText}>{children}</Text>
    </View>
  );
}

export function ScreenLoading() {
  return (
    <View style={styles.loadingWrap}>
      <ActivityIndicator color={colors.teal} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 18,
    marginBottom: 14,
    ...cardShadow,
  },
  emptyState: { alignItems: 'center', paddingVertical: 36 },
  emptyIcon: { fontSize: 34, marginBottom: 10, opacity: 0.55 },
  emptyText: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, textAlign: 'center' },
  primaryBtn: {
    backgroundColor: colors.teal,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontFamily: fonts.bodySemi, fontSize: 15 },
  secondaryBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 14 },
  linkText: { color: colors.tealDark, fontFamily: fonts.bodyMedium, fontSize: 13, textDecorationLine: 'underline' },
  btnDisabled: { opacity: 0.6 },
  btnPressed: { opacity: 0.85 },
  badge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontFamily: fonts.bodySemi, fontSize: 11 },
  muted: { color: colors.muted, fontFamily: fonts.body },
  errorText: { color: colors.red, fontFamily: fonts.body, fontSize: 13, marginBottom: 10, textAlign: 'right' },
  note: {
    backgroundColor: colors.tealBg,
    borderWidth: 1,
    borderColor: '#BFE6DF',
    borderRadius: radius.sm,
    padding: 12,
    marginBottom: 14,
  },
  noteText: { color: colors.inkAlt, fontFamily: fonts.body, fontSize: 12.5, textAlign: 'right' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
