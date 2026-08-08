import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { apiFetch, ApiError } from '@/lib/api';
import { StoreBranch } from '@/lib/types';
import { colors, fonts } from '@/theme/colors';
import { Card, ErrorText, PrimaryButton, ScreenLoading } from '@/components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Booking'>;

const TIME_SLOTS = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];

function dateLabel(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return { date: d, label: d.toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric', month: 'short' }) };
}

export default function BookingScreen({ route, navigation }: Props) {
  const { storeId, serviceId, serviceName } = route.params;
  const [branches, setBranches] = useState<StoreBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [dayOffset, setDayOffset] = useState<number | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const days = [0, 1, 2, 3].map((n) => ({ offset: n, ...dateLabel(n) }));

  useEffect(() => {
    (async () => {
      try {
        const store = await apiFetch<{ branches: StoreBranch[] }>(`/catalog/stores/${storeId}`);
        setBranches(store.branches);
        if (store.branches.length === 1) setBranchId(store.branches[0].id);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'تعذّر تحميل الفروع');
      } finally {
        setLoading(false);
      }
    })();
  }, [storeId]);

  async function handleSubmit() {
    if (!branchId || dayOffset === null || !time) {
      setError('اختر الفرع والتاريخ والوقت');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const d = new Date();
      d.setDate(d.getDate() + dayOffset);
      const [h, m] = time.split(':').map(Number);
      d.setHours(h, m, 0, 0);
      await apiFetch('/bookings', {
        method: 'POST',
        body: JSON.stringify({ storeId, serviceId, branchId, scheduledAt: d.toISOString() }),
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر إنشاء الحجز');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <ScreenLoading />;

  if (success) {
    return (
      <View style={styles.center}>
        <Card style={{ width: '100%' }}>
          <Text style={styles.successTitle}>تم إرسال طلب الحجز ✅</Text>
          <Text style={styles.mutedText}>سيتواصل معك المحل لتأكيد الموعد. يمكنك متابعة حالة الحجز من "حجوزاتي".</Text>
          <PrimaryButton title="حجوزاتي" onPress={() => navigation.replace('MyBookings')} />
        </Card>
      </View>
    );
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={{ padding: 16 }}>
      <Card>
        <Text style={styles.title}>حجز: {serviceName}</Text>

        <Text style={styles.label}>الفرع</Text>
        <View style={styles.chipsRow}>
          {branches.map((b) => (
            <Pressable
              key={b.id}
              style={[styles.chip, branchId === b.id && styles.chipOn]}
              onPress={() => setBranchId(b.id)}
            >
              <Text style={[styles.chipText, branchId === b.id && styles.chipTextOn]}>{b.name}</Text>
            </Pressable>
          ))}
          {branches.length === 0 && <Text style={styles.mutedText}>لا يوجد فروع متاحة</Text>}
        </View>

        <Text style={styles.label}>التاريخ</Text>
        <View style={styles.chipsRow}>
          {days.map((d) => (
            <Pressable
              key={d.offset}
              style={[styles.chip, dayOffset === d.offset && styles.chipOn]}
              onPress={() => setDayOffset(d.offset)}
            >
              <Text style={[styles.chipText, dayOffset === d.offset && styles.chipTextOn]}>{d.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>الوقت</Text>
        <View style={styles.chipsRow}>
          {TIME_SLOTS.map((t) => (
            <Pressable key={t} style={[styles.chip, time === t && styles.chipOn]} onPress={() => setTime(t)}>
              <Text style={[styles.chipText, time === t && styles.chipTextOn]}>{t}</Text>
            </Pressable>
          ))}
        </View>

        {error ? <ErrorText>{error}</ErrorText> : null}
        <PrimaryButton title="تأكيد الحجز" onPress={handleSubmit} loading={submitting} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 20 },
  title: { fontFamily: fonts.heading, fontSize: 16, color: colors.ink, textAlign: 'right', marginBottom: 16 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.muted, textAlign: 'right', marginBottom: 8 },
  chipsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    backgroundColor: colors.chipBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipOn: { backgroundColor: colors.teal, borderColor: colors.teal },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.text },
  chipTextOn: { color: '#fff' },
  mutedText: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, textAlign: 'right', marginBottom: 14 },
  successTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.ink, textAlign: 'center', marginBottom: 8 },
});
