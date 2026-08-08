import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { apiFetch, ApiError } from '@/lib/api';
import { colors, fonts } from '@/theme/colors';
import { Card, ErrorText, PrimaryButton, SecondaryButton } from '@/components/ui';
import { useCart } from '@/lib/CartContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

interface OrderResponse {
  id: string;
  total: string;
  paymentStatus: string;
}

export default function CartScreen({ route, navigation }: Props) {
  const { storeId } = route.params;
  const cart = useCart();
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  async function handlePlaceOrder() {
    setError('');
    setPlacing(true);
    try {
      const res = await apiFetch<OrderResponse>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          storeId,
          items: cart.items.map((i) => ({ productId: i.productId, qty: i.qty })),
        }),
      });
      setOrder(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر إنشاء الطلب');
    } finally {
      setPlacing(false);
    }
  }

  async function handleConfirmPayment() {
    if (!order) return;
    setPaying(true);
    setError('');
    try {
      await apiFetch(`/orders/${order.id}/confirm-payment`, { method: 'POST' });
      setPaid(true);
      cart.clear();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر تأكيد الدفع');
    } finally {
      setPaying(false);
    }
  }

  if (paid) {
    return (
      <View style={styles.center}>
        <Card style={{ width: '100%' }}>
          <Text style={styles.successTitle}>تم الدفع بنجاح ✅</Text>
          <Text style={styles.mutedText}>سيقوم المحل بتجهيز طلبك. يمكنك متابعته من "طلباتي".</Text>
          <PrimaryButton title="طلباتي" onPress={() => navigation.replace('MyOrders')} />
        </Card>
      </View>
    );
  }

  if (order) {
    return (
      <View style={styles.center}>
        <Card style={{ width: '100%' }}>
          <Text style={styles.successTitle}>تم إنشاء الطلب</Text>
          <Text style={styles.mutedText}>الإجمالي: {order.total} ﷼</Text>
          <Text style={styles.note}>
            بوابة الدفع الفعلية غير مربوطة بعد — هذا الزر يحاكي نجاح الدفع فوراً (مثل تفعيل اشتراك المحل).
          </Text>
          {error ? <ErrorText>{error}</ErrorText> : null}
          <PrimaryButton title="تأكيد الدفع" onPress={handleConfirmPayment} loading={paying} />
        </Card>
      </View>
    );
  }

  if (cart.items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.mutedText}>السلة فارغة</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={cart.items}
        keyExtractor={(i) => i.productId}
        contentContainerStyle={{ padding: 14 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.qty}>الكمية: {item.qty}</Text>
            </View>
            <Text style={styles.price}>{item.price * item.qty} ﷼</Text>
            <SecondaryButton title="حذف" onPress={() => cart.removeItem(item.productId)} />
          </View>
        )}
      />
      <View style={styles.footer}>
        <Text style={styles.total}>الإجمالي: {cart.total} ﷼</Text>
        {error ? <ErrorText>{error}</ErrorText> : null}
        <PrimaryButton title="إتمام الطلب" onPress={handlePlaceOrder} loading={placing} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 20 },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  name: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.text, textAlign: 'right' },
  qty: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'right', marginTop: 2 },
  price: { fontFamily: fonts.heading, fontSize: 13, color: colors.ink },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  total: { fontFamily: fonts.heading, fontSize: 16, color: colors.ink, textAlign: 'right', marginBottom: 12 },
  mutedText: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, textAlign: 'center', marginBottom: 12 },
  successTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.ink, textAlign: 'center', marginBottom: 8 },
  note: { fontFamily: fonts.body, fontSize: 12, color: colors.inkAlt, textAlign: 'right', marginVertical: 10 },
});
