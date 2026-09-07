import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { apiFetch, ApiError } from '@/lib/api';
import { colors, fonts, radius } from '@/theme/colors';
import { EmptyState, ErrorText, ScreenLoading } from '@/components/ui';
import { useLocale } from '@/lib/i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  data?: { orderId?: string; bookingId?: string } | null;
}

export default function NotificationsScreen({ navigation }: Props) {
  const { t, locale, textAlign } = useLocale();
  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US';
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<NotificationItem[]>('/notifications/me');
      setItems(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('notifications.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePress(n: NotificationItem) {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      apiFetch(`/notifications/${n.id}/read`, { method: 'PATCH' }).catch(() => undefined);
    }
    if (n.data?.orderId) navigation.navigate('MyOrders');
    else if (n.data?.bookingId) navigation.navigate('MyBookings');
  }

  if (loading) return <ScreenLoading />;

  return (
    <View style={styles.flex}>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 14 }}
        ListEmptyComponent={<EmptyState icon="🔔" text={t('notifications.empty')} />}
        renderItem={({ item }) => (
          <Pressable style={[styles.card, !item.read && styles.cardUnread]} onPress={() => handlePress(item)}>
            <Text style={[styles.title, { textAlign }]}>{item.title}</Text>
            <Text style={[styles.body, { textAlign }]}>{item.body}</Text>
            <Text style={[styles.time, { textAlign }]}>
              {new Date(item.createdAt).toLocaleString(dateLocale)}
            </Text>
          </Pressable>
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
  cardUnread: { backgroundColor: colors.indigoTint, borderColor: colors.indigo },
  title: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginTop: 3 },
  time: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 6 },
});
