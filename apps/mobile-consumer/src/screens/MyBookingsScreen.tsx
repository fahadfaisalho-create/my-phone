import { useCallback, useEffect, useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { apiFetch, ApiError } from '@/lib/api';
import { confirmAsync } from '@/lib/confirm';
import { colors, fonts, radius } from '@/theme/colors';
import { Badge, EmptyState, ErrorText, ScreenLoading } from '@/components/ui';
import { useLocale } from '@/lib/i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'MyBookings'>;

interface BookingItem {
  id: string;
  scheduledAt: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  visitType: 'in_store' | 'home_visit';
  customerAddress: string | null;
  customerLat: number | string | null;
  customerLng: number | string | null;
  store: { name: string };
  service: { name: string };
  branch: { name: string };
}

const STATUS_TONE: Record<BookingItem['status'], 'green' | 'amber' | 'red'> = {
  pending: 'amber',
  accepted: 'green',
  completed: 'green',
  cancelled: 'red',
};

function openInMaps(lat: number, lng: number) {
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  Linking.openURL(url).catch(() => undefined);
}

export default function MyBookingsScreen({}: Props) {
  const { t, locale, textAlign, row } = useLocale();
  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US';

  const VISIT_LABEL: Record<BookingItem['visitType'], string> = {
    in_store: t('myBookings.visitInStore'),
    home_visit: t('myBookings.visitHomeVisit'),
  };
  const STATUS_LABEL: Record<BookingItem['status'], string> = {
    pending: t('myBookings.statusPending'),
    accepted: t('myBookings.statusAccepted'),
    completed: t('myBookings.statusCompleted'),
    cancelled: t('myBookings.statusCancelled'),
  };

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<BookingItem[]>('/bookings/me');
      setBookings(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('myBookings.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
      setError(err instanceof ApiError ? err.message : t('myBookings.cancelError'));
    } finally {
      setCancellingId(null);
    }
  }

  async function handleCancel(id: string) {
    const ok = await confirmAsync(t('myBookings.cancelTitle'), t('myBookings.cancelConfirm'));
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
        ListEmptyComponent={<EmptyState icon="📅" text={t('myBookings.empty')} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.rowTop, { flexDirection: row }]}>
              <Text style={styles.store}>{item.store.name}</Text>
              <Badge label={STATUS_LABEL[item.status]} tone={STATUS_TONE[item.status]} />
            </View>
            <Text style={[styles.service, { textAlign }]}>{item.service.name} · {item.branch.name}</Text>
            <Text style={[styles.date, { textAlign }]}>
              {new Date(item.scheduledAt).toLocaleString(dateLocale, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            <Text style={[styles.visitType, { textAlign }]}>{VISIT_LABEL[item.visitType]}</Text>
            {item.visitType === 'home_visit' && item.customerAddress && (
              <Text style={[styles.address, { textAlign }]}>📍 {item.customerAddress}</Text>
            )}
            {item.visitType === 'home_visit' && item.customerLat != null && item.customerLng != null && (
              <Pressable
                onPress={() => openInMaps(Number(item.customerLat), Number(item.customerLng))}
                style={styles.mapsLink}
              >
                <Text style={styles.mapsLinkText}>{t('myBookings.viewOnMap')}</Text>
              </Pressable>
            )}
            {item.status === 'pending' && (
              <Pressable
                style={styles.cancelBtn}
                onPress={() => handleCancel(item.id)}
                disabled={cancellingId === item.id}
              >
                <Text style={styles.cancelBtnText}>
                  {cancellingId === item.id ? t('myBookings.cancelling') : t('myBookings.cancelBooking')}
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
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
  },
  rowTop: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  store: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.text },
  service: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginBottom: 4 },
  date: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink },
  visitType: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.indigoDeep, marginTop: 4 },
  address: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted, marginTop: 2 },
  mapsLink: { alignSelf: 'flex-end', marginTop: 4 },
  mapsLinkText: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.indigoDeep, textDecorationLine: 'underline' },
  empty: { textAlign: 'center', color: colors.muted, fontFamily: fonts.body, marginTop: 40 },
  cancelBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: radius.pill,
    paddingVertical: 7,
    alignItems: 'center',
  },
  cancelBtnText: { color: colors.red, fontFamily: fonts.bodyMedium, fontSize: 12 },
});
