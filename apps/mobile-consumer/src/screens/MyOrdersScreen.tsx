import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { apiFetch, ApiError } from '@/lib/api';
import { confirmAsync } from '@/lib/confirm';
import { colors, fonts } from '@/theme/colors';
import { Badge, EmptyState, ErrorText, ScreenLoading } from '@/components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'MyOrders'>;

interface OrderItem {
  id: string;
  total: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  store: { name: string };
  items: { qty: number; product: { name: string } }[];
}

const STATUS_LABEL: Record<OrderItem['status'], string> = {
  pending: 'بانتظار المعالجة',
  processing: 'جارٍ التجهيز',
  completed: 'مكتمل',
  cancelled: 'ملغى',
};
const STATUS_TONE: Record<OrderItem['status'], 'green' | 'amber' | 'red'> = {
  pending: 'amber',
  processing: 'amber',
  completed: 'green',
  cancelled: 'red',
};
const PAY_LABEL: Record<OrderItem['paymentStatus'], string> = {
  unpaid: 'غير مدفوع',
  paid: 'مدفوع',
  refunded: 'مسترجع',
};

export default function MyOrdersScreen({}: Props) {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<OrderItem[]>('/orders/me');
      setOrders(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر تحميل الطلبات');
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
      await apiFetch(`/orders/${id}/cancel`, { method: 'PATCH' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر إلغاء الطلب');
    } finally {
      setCancellingId(null);
    }
  }

  async function handleCancel(id: string) {
    const ok = await confirmAsync('إلغاء الطلب', 'هل تريد إلغاء هذا الطلب؟ سيتم استرجاع الكمية للمخزون.');
    if (ok) await doCancel(id);
  }

  if (loading) return <ScreenLoading />;

  return (
    <View style={styles.flex}>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 14 }}
        ListEmptyComponent={<EmptyState icon="🧾" text="لا يوجد طلبات بعد" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.rowTop}>
              <Text style={styles.store}>{item.store.name}</Text>
              <Badge label={STATUS_LABEL[item.status]} tone={STATUS_TONE[item.status]} />
            </View>
            <Text style={styles.items}>
              {item.items.map((i) => `${i.product.name} ×${i.qty}`).join('، ')}
            </Text>
            <View style={styles.rowBottom}>
              <Text style={styles.pay}>{PAY_LABEL[item.paymentStatus]}</Text>
              <Text style={styles.total}>{item.total} ﷼</Text>
            </View>
            {item.status === 'pending' && item.paymentStatus === 'unpaid' && (
              <Pressable
                style={styles.cancelBtn}
                onPress={() => handleCancel(item.id)}
                disabled={cancellingId === item.id}
              >
                <Text style={styles.cancelBtnText}>
                  {cancellingId === item.id ? 'جارٍ الإلغاء...' : 'إلغاء الطلب'}
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
  items: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, textAlign: 'right', marginBottom: 8 },
  rowBottom: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  pay: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.green },
  total: { fontFamily: fonts.heading, fontSize: 14, color: colors.ink },
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
