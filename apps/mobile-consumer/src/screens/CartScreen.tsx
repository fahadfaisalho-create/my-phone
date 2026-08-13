import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { apiFetch, ApiError } from '@/lib/api';
import { requireAuth } from '@/lib/authGuard';
import { colors, fonts, radius } from '@/theme/colors';
import { Card, ErrorText, PrimaryButton, SecondaryButton } from '@/components/ui';
import { useCart } from '@/lib/CartContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;
type DeliveryType = 'pickup' | 'delivery';
type CourierProvider = 'aramex' | 'fedex';

const DELIVERY_LABEL: Record<DeliveryType, string> = {
  pickup: '🏬 استلام من الفرع',
  delivery: '🚚 توصيل',
};

const COURIER_LABEL: Record<CourierProvider, string> = {
  aramex: '📦 أرامكس',
  fedex: '📦 فيدكس',
};

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

  const [supportsDelivery, setSupportsDelivery] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState<string | null>(null);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('pickup');
  const [courierProvider, setCourierProvider] = useState<CourierProvider>('aramex');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const store = await apiFetch<{ supportsDelivery: boolean; deliveryFee: string | null }>(
          `/catalog/stores/${storeId}`,
        );
        setSupportsDelivery(store.supportsDelivery);
        setDeliveryFee(store.deliveryFee);
      } catch {
        // تجاهل — لو فشل التحميل نبقى بخيار "استلام من الفرع" الافتراضي
      }
    })();
  }, [storeId]);

  const feeAmount = deliveryType === 'delivery' ? Number(deliveryFee || 0) : 0;
  const grandTotal = cart.total + feeAmount;

  // يجيب موقع الجهاز فعليًا (GPS) بدل الاعتماد على كتابة العنوان يدويًا — لدقة أعلى بالتوصيل
  async function handleUseLocation() {
    setLocateError('');
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocateError('يجب السماح بالوصول لموقعك من إعدادات الجهاز لاستخدام هذه الميزة');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = pos.coords;
      setCoords({ lat: latitude, lng: longitude });
      try {
        const results = await Location.reverseGeocodeAsync({ latitude, longitude });
        const r = results[0];
        const formatted = r ? [r.city, r.district ?? r.subregion, r.street, r.name].filter(Boolean).join('، ') : '';
        setAddress(formatted || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      } catch {
        setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      }
    } catch {
      setLocateError('تعذّر تحديد موقعك، تأكد من تفعيل خدمة الموقع بالجهاز');
    } finally {
      setLocating(false);
    }
  }

  async function handlePlaceOrder() {
    if (!(await requireAuth(navigation, { screen: 'Cart', params: { storeId, storeName: route.params.storeName } }))) return;
    if (deliveryType === 'delivery' && !address.trim()) {
      setError('اكتب عنوان التوصيل');
      return;
    }
    setError('');
    setPlacing(true);
    try {
      const res = await apiFetch<OrderResponse>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          storeId,
          items: cart.items.map((i) => ({ productId: i.productId, qty: i.qty })),
          ...(cart.branchId ? { branchId: cart.branchId } : {}),
          deliveryType,
          ...(deliveryType === 'delivery'
            ? {
                deliveryAddress: address.trim(),
                courierProvider,
                ...(coords ? { deliveryLat: coords.lat, deliveryLng: coords.lng } : {}),
              }
            : {}),
        }),
      });
      setOrder(res);
      cart.clear();
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
          <Text style={styles.mutedText}>سيقوم المحل بتجهيز طلبك. يمكنك متابعته من &quot;طلباتي&quot;.</Text>
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
          <PrimaryButton title="ادفع الآن" onPress={handleConfirmPayment} loading={paying} />
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
      {cart.branchName && (
        <View style={styles.branchBanner}>
          <Text style={styles.branchBannerText}>🏬 تتسوق من فرع: {cart.branchName}</Text>
        </View>
      )}
      <FlatList
        data={cart.items}
        keyExtractor={(i) => i.productId}
        contentContainerStyle={{ padding: 14 }}
        ListHeaderComponent={
          supportsDelivery ? (
            <View style={{ marginBottom: 4 }}>
              <Text style={styles.label}>طريقة الاستلام</Text>
              <View style={styles.chipsRow}>
                {(['pickup', 'delivery'] as DeliveryType[]).map((v) => (
                  <Pressable
                    key={v}
                    style={[styles.chip, deliveryType === v && styles.chipOn]}
                    onPress={() => setDeliveryType(v)}
                  >
                    <Text style={[styles.chipText, deliveryType === v && styles.chipTextOn]}>
                      {DELIVERY_LABEL[v]}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {deliveryType === 'delivery' && (
                <>
                  {deliveryFee ? (
                    <Text style={styles.priceNote}>+ رسوم توصيل {deliveryFee} ﷼</Text>
                  ) : null}
                  <Text style={styles.note2}>
                    التوصيل حالياً يدوي — المحل يتواصل معك لترتيب موعد التسليم مع شركة الشحن.
                  </Text>

                  <Text style={styles.label}>شركة الشحن</Text>
                  <View style={styles.chipsRow}>
                    {(['aramex', 'fedex'] as CourierProvider[]).map((c) => (
                      <Pressable
                        key={c}
                        style={[styles.chip, courierProvider === c && styles.chipOn]}
                        onPress={() => setCourierProvider(c)}
                      >
                        <Text style={[styles.chipText, courierProvider === c && styles.chipTextOn]}>
                          {COURIER_LABEL[c]}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={styles.label}>عنوان التوصيل</Text>

                  <Pressable
                    style={({ pressed }) => [styles.locateBtn, pressed && styles.btnPressed]}
                    onPress={handleUseLocation}
                    disabled={locating}
                  >
                    {locating ? (
                      <ActivityIndicator color={colors.teal} size="small" />
                    ) : (
                      <Text style={styles.locateBtnText}>📍 استخدام موقعي الحالي</Text>
                    )}
                  </Pressable>
                  {coords && !locating && <Text style={styles.locatedNote}>✓ تم تحديد موقعك بدقة GPS</Text>}
                  {locateError ? <ErrorText>{locateError}</ErrorText> : null}

                  <TextInput
                    style={styles.addressInput}
                    placeholder="أو اكتب عنوانك بالتفصيل (الحي، الشارع، رقم المبنى...)"
                    placeholderTextColor={colors.muted}
                    textAlign="right"
                    multiline
                    value={address}
                    onChangeText={(t) => {
                      setAddress(t);
                      setCoords(null);
                    }}
                  />
                </>
              )}
            </View>
          ) : null
        }
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
        {feeAmount > 0 && (
          <Text style={styles.subtotal}>
            المنتجات: {cart.total} ﷼ + توصيل {feeAmount} ﷼
          </Text>
        )}
        <Text style={styles.total}>الإجمالي: {grandTotal} ﷼</Text>
        {error ? <ErrorText>{error}</ErrorText> : null}
        <PrimaryButton title="إتمام الطلب" onPress={handlePlaceOrder} loading={placing} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 20 },
  branchBanner: { backgroundColor: colors.tealBg, paddingVertical: 8, paddingHorizontal: 14 },
  branchBannerText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.tealDark, textAlign: 'right' },
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
  subtotal: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'right', marginBottom: 4 },
  total: { fontFamily: fonts.heading, fontSize: 16, color: colors.ink, textAlign: 'right', marginBottom: 12 },
  mutedText: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, textAlign: 'center', marginBottom: 12 },
  successTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.ink, textAlign: 'center', marginBottom: 8 },
  note: { fontFamily: fonts.body, fontSize: 12, color: colors.inkAlt, textAlign: 'right', marginVertical: 10 },
  note2: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted, textAlign: 'right', marginBottom: 10 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.muted, textAlign: 'right', marginBottom: 8 },
  priceNote: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'right', marginBottom: 4 },
  chipsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
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
  locateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tealBg,
    borderWidth: 1,
    borderColor: '#BFE6DF',
    borderRadius: radius.sm,
    paddingVertical: 11,
    marginBottom: 8,
  },
  locateBtnText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.tealDark },
  btnPressed: { opacity: 0.8 },
  locatedNote: { fontFamily: fonts.body, fontSize: 12, color: colors.green, textAlign: 'right', marginBottom: 8 },
  addressInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    padding: 12,
    minHeight: 60,
    backgroundColor: '#FCFBF8',
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
});
