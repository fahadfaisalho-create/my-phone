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
type DeliveryMethod = 'courier' | 'store_agent';

const DELIVERY_LABEL: Record<DeliveryType, string> = {
  pickup: '🏬 استلام من الفرع',
  delivery: '🚚 توصيل',
};

const COURIER_LABEL: Record<CourierProvider, string> = {
  aramex: '📦 أرامكس',
  fedex: '📦 فيدكس',
};

const DELIVERY_METHOD_LABEL: Record<DeliveryMethod, string> = {
  courier: '📦 شركة شحن',
  store_agent: '🛵 توصيل من المحل',
};

interface OrderResponse {
  id: string;
  total: string;
  paymentStatus: string;
}

interface StoreDeliveryInfo {
  supportsDelivery: boolean;
  deliveryFee: string | null;
  supportsAgentDelivery: boolean;
  agentDeliveryFee: string | null;
  agentZoneLat: number | null;
  agentZoneLng: number | null;
  agentZoneRadiusKm: number | null;
}

// حساب المسافة بين نقطتين جغرافيتين (كم) — صيغة Haversine، نفس المستخدمة بالباك إند
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function CartScreen({ route, navigation }: Props) {
  const { storeId } = route.params;
  const cart = useCart();
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  const [storeInfo, setStoreInfo] = useState<StoreDeliveryInfo | null>(null);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('pickup');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('courier');
  const [courierProvider, setCourierProvider] = useState<CourierProvider>('aramex');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const store = await apiFetch<StoreDeliveryInfo>(`/catalog/stores/${storeId}`);
        setStoreInfo(store);
        // لو التوصيل المدعوم نوع واحد فقط، نختاره تلقائياً بدون إزعاج المستهلك بخطوة اختيار
        if (!store.supportsDelivery && store.supportsAgentDelivery) setDeliveryMethod('store_agent');
      } catch {
        // تجاهل — لو فشل التحميل نبقى بخيار "استلام من الفرع" الافتراضي
      }
    })();
  }, [storeId]);

  const supportsDelivery = storeInfo?.supportsDelivery ?? false;
  const supportsAgentDelivery = storeInfo?.supportsAgentDelivery ?? false;
  const bothDeliveryMethods = supportsDelivery && supportsAgentDelivery;

  // أهلية توصيل مناديب المحل: يتحقق فقط بعد ما المستهلك يحدد موقعه
  const agentEligibility =
    deliveryType === 'delivery' &&
    deliveryMethod === 'store_agent' &&
    coords &&
    storeInfo?.agentZoneLat != null &&
    storeInfo?.agentZoneLng != null &&
    storeInfo?.agentZoneRadiusKm != null
      ? distanceKm(coords.lat, coords.lng, storeInfo.agentZoneLat, storeInfo.agentZoneLng) <= storeInfo.agentZoneRadiusKm
      : null;

  const feeAmount =
    deliveryType === 'delivery'
      ? Number((deliveryMethod === 'store_agent' ? storeInfo?.agentDeliveryFee : storeInfo?.deliveryFee) || 0)
      : 0;
  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const grandTotal = cart.total - discountAmount + feeAmount;

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setCouponChecking(true);
    setCouponError('');
    try {
      const res = await apiFetch<{ code: string; discountAmount: number }>('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code: couponCode.trim(), storeId, amount: cart.total }),
      });
      setAppliedCoupon(res);
      setCouponCode('');
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err instanceof ApiError ? err.message : 'تعذّر التحقق من الكود');
    } finally {
      setCouponChecking(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponError('');
  }

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
    if (deliveryType === 'delivery') {
      if (deliveryMethod === 'store_agent') {
        if (!coords) {
          setError('حدد موقعك أولاً للتحقق من أهليتك لتوصيل المحل');
          return;
        }
        if (agentEligibility === false) {
          setError('موقعك خارج نطاق توصيل هذا المحل — جرّب طريقة استلام أخرى');
          return;
        }
      } else if (!address.trim()) {
        setError('اكتب عنوان التوصيل');
        return;
      }
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
          ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
          deliveryType,
          ...(deliveryType === 'delivery'
            ? {
                deliveryMethod,
                deliveryAddress: address.trim() || undefined,
                ...(deliveryMethod === 'courier' ? { courierProvider } : {}),
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
          supportsDelivery || supportsAgentDelivery ? (
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
                  {bothDeliveryMethods && (
                    <>
                      <Text style={styles.label}>طريقة التوصيل</Text>
                      <View style={styles.chipsRow}>
                        {(['courier', 'store_agent'] as DeliveryMethod[]).map((m) => (
                          <Pressable
                            key={m}
                            style={[styles.chip, deliveryMethod === m && styles.chipOn]}
                            onPress={() => {
                              setDeliveryMethod(m);
                              setCoords(null);
                            }}
                          >
                            <Text style={[styles.chipText, deliveryMethod === m && styles.chipTextOn]}>
                              {DELIVERY_METHOD_LABEL[m]}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </>
                  )}

                  {deliveryMethod === 'store_agent' ? (
                    <>
                      {storeInfo?.agentDeliveryFee ? (
                        <Text style={styles.priceNote}>+ رسوم توصيل {storeInfo.agentDeliveryFee} ﷼</Text>
                      ) : null}
                      <Text style={styles.note2}>
                        يوصّل هذا المحل بنفسه عبر مندوبه ضمن نطاق تغطية محدد — حدد موقعك للتحقق من توفر الخدمة في
                        منطقتك.
                      </Text>

                      <Pressable
                        style={({ pressed }) => [styles.locateBtn, pressed && styles.btnPressed]}
                        onPress={handleUseLocation}
                        disabled={locating}
                      >
                        {locating ? (
                          <ActivityIndicator color={colors.teal} size="small" />
                        ) : (
                          <Text style={styles.locateBtnText}>📍 تحديد موقعي (إلزامي)</Text>
                        )}
                      </Pressable>
                      {locateError ? <ErrorText>{locateError}</ErrorText> : null}

                      {coords && !locating && agentEligibility === true && (
                        <Text style={styles.eligibleText}>
                          ✅ أنت ضمن نطاق التوصيل — سيصلك الطلب خلال 24 ساعة
                        </Text>
                      )}
                      {coords && !locating && agentEligibility === false && (
                        <Text style={styles.ineligibleText}>
                          ❌ للأسف موقعك خارج نطاق توصيل هذا المحل — جرّب طريقة استلام أخرى
                        </Text>
                      )}
                    </>
                  ) : (
                    <>
                      {storeInfo?.deliveryFee ? (
                        <Text style={styles.priceNote}>+ رسوم توصيل {storeInfo.deliveryFee} ﷼</Text>
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
        {appliedCoupon ? (
          <View style={styles.couponAppliedRow}>
            <Text style={styles.couponAppliedText}>
              🏷️ {appliedCoupon.code} — خصم {appliedCoupon.discountAmount} ﷼
            </Text>
            <Pressable onPress={handleRemoveCoupon} hitSlop={6}>
              <Text style={styles.couponRemoveText}>إزالة</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.couponRow}>
            <TextInput
              style={styles.couponInput}
              placeholder="كود الخصم (اختياري)"
              placeholderTextColor={colors.muted}
              textAlign="right"
              autoCapitalize="characters"
              value={couponCode}
              onChangeText={setCouponCode}
            />
            <Pressable
              style={({ pressed }) => [styles.couponBtn, pressed && styles.btnPressed]}
              onPress={handleApplyCoupon}
              disabled={couponChecking || !couponCode.trim()}
            >
              {couponChecking ? (
                <ActivityIndicator color={colors.teal} size="small" />
              ) : (
                <Text style={styles.couponBtnText}>تطبيق</Text>
              )}
            </Pressable>
          </View>
        )}
        {couponError ? <ErrorText>{couponError}</ErrorText> : null}

        {(feeAmount > 0 || discountAmount > 0) && (
          <Text style={styles.subtotal}>
            المنتجات: {cart.total} ﷼
            {discountAmount > 0 ? ` − خصم ${discountAmount} ﷼` : ''}
            {feeAmount > 0 ? ` + توصيل ${feeAmount} ﷼` : ''}
          </Text>
        )}
        <Text style={styles.total}>الإجمالي: {grandTotal} ﷼</Text>
        {error ? <ErrorText>{error}</ErrorText> : null}
        <PrimaryButton
          title="إتمام الطلب"
          onPress={handlePlaceOrder}
          loading={placing}
          disabled={deliveryType === 'delivery' && deliveryMethod === 'store_agent' && agentEligibility !== true}
        />
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
  couponRow: { flexDirection: 'row-reverse', gap: 8, marginBottom: 10 },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FCFBF8',
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text,
  },
  couponBtn: {
    borderWidth: 1,
    borderColor: colors.teal,
    borderRadius: radius.sm,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponBtnText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.tealDark },
  couponAppliedRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.greenBg,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  couponAppliedText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.green },
  couponRemoveText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.red, textDecorationLine: 'underline' },
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
  eligibleText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12.5,
    color: colors.green,
    textAlign: 'right',
    backgroundColor: colors.greenBg,
    padding: 10,
    borderRadius: radius.sm,
    marginBottom: 8,
  },
  ineligibleText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12.5,
    color: colors.red,
    textAlign: 'right',
    backgroundColor: colors.redBg,
    padding: 10,
    borderRadius: radius.sm,
    marginBottom: 8,
  },
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
