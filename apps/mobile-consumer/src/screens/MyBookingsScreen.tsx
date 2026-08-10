import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { apiFetch, ApiError } from '@/lib/api';
import { confirmAsync } from '@/lib/confirm';
import { colors, fonts } from '@/theme/colors';
import { Badge, ErrorText, ScreenLoading } from '@/components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'MyBookings'>;

interface BookingItem {
  id: string;
  scheduledAt: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  visitType: 'in_store' | 'home_visit';
  customerAddress: string | null;
  store: { name: string };
  service: { name: string };
  branch: { name: string };
}

const VISIT_LABEL: Record<BookingItem['visitType'], string> = {
  in_store: '🏬 بالمحل',
  home_visit: '🚗 زيارة منزلية',
};

const STATUS_LABEL: Record<BookingItem['status'], string> = {
  pending: 'قيد المراجعة',
  accepted: 'مقبول',
  completed: 'مكتمل',
  cancelled: 'ملغى',
};
const STATUS_TONE: Record<BookingItem['status'], 'green' | 'amber' | 'red'> = {
  pending: 'amber',
  accepted: 'green',
  completed: 'green',
  cancelled: 'red',
};

export default function MyBookingsScreen({}: Props) {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<BookingItem[]>('/bookings/me');
      setBookings(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر تحميل الحجوزات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function doCancel(id: string) {
    setCancellingId(id);
    setError('');
    try {
      await apiFetch(`/bookings/${id}/cancel`, { method: 'PATCH' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر إلغاء الحجز');
    } finally {
      setCancellingId(null);
    }
  }

  async function handleCancel(id: string) {
    const ok = await confirmAsync('إلغاء الحجز', 'هل تريد إلغاء هذا الحجز؟');
    if (ok) await doCancel(id);
  }

  if (loading) return <ScreenLoading />;

  return (
    <View style={styles.flex}>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <FlatList
        data={bookings}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: 14 }}
        ListEmptyComponent={<Text style={styles.empty}>لا يوجد حجوزات بعد</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.rowTop}>
              <Text style={styles.store}>{item.store.name}</Text>
              <Badge label={STATUS_LABEL[item.status]} tone={STATUS_TONE[item.status]} />
            </View>
            <Text style={styles.service}>{item.service.name} · {item.branch.name}</Text>
            <Text style={styles.date}>
              {new Date(item.scheduledAt).toLocaleString('ar-SA', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            <Text style={styles.visitType}>{VISIT_LABEL[item.visitType]}</Text>
            {item.visitType === 'home_visit' && item.customerAddress && (
              <Text style={styles.address}>📍 {item.customerAddress}</Text>
            )}
            {item.status === 'pending' && (
              <Pressable
                style={styles.cancelBtn}
                onPress={() => handleCancel(item.id)}
                disabled={cancellingId === item.id}
              >
                <Text style={styles.cancelBtnText}>
                  {cancellingId === item.id ? 'جارٍ الإلغاء...' : 'إلغاء الحجز'}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  rowTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  store: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.text },
  service: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, textAlign: 'right', marginBottom: 4 },
  date: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink, textAlign: 'right' },
  visitType: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.tealDark, textAlign: 'right', marginTop: 4 },
  address: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted, textAlign: 'right', marginTop: 2 },
  empty: { textAlign: 'center', color: colors.muted, fontFamily: fonts.body, marginTop: 40 },
  cancelBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
  },
  cancelBtnText: { color: colors.red, fontFamily: fonts.bodyMedium, fontSize: 12 },
});
