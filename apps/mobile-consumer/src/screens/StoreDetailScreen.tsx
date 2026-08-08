import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { apiFetch, ApiError, fileUrl } from '@/lib/api';
import { DEVICE_LABEL, StoreDetail } from '@/lib/types';
import { colors, fonts } from '@/theme/colors';
import { Badge, Card, ErrorText, PrimaryButton, ScreenLoading, SecondaryButton, Stars } from '@/components/ui';
import { useCart } from '@/lib/CartContext';

type Props = NativeStackScreenProps<RootStackParamList, 'StoreDetail'>;

export default function StoreDetailScreen({ route, navigation }: Props) {
  const { storeId } = route.params;
  const [store, setStore] = useState<StoreDetail | null>(null);
  const [error, setError] = useState('');
  const [chosenRating, setChosenRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [contacting, setContacting] = useState(false);
  const cart = useCart();

  async function load() {
    try {
      const data = await apiFetch<StoreDetail>(`/catalog/stores/${storeId}`);
      setStore(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر تحميل بيانات المحل');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  useEffect(() => {
    navigation.setOptions({ title: store?.name || '' });
  }, [store, navigation]);

  async function submitReview() {
    if (!chosenRating) {
      setReviewError('اختر عدد النجوم أولاً');
      return;
    }
    setReviewError('');
    setSubmitting(true);
    try {
      await apiFetch(`/stores/${storeId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating: chosenRating, comment: comment.trim() || undefined }),
      });
      setComment('');
      await load();
    } catch (err) {
      setReviewError(err instanceof ApiError ? err.message : 'تعذّر إرسال التقييم');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleContact() {
    setContacting(true);
    try {
      const chat = await apiFetch<{ id: string }>('/chats', {
        method: 'POST',
        body: JSON.stringify({ storeId }),
      });
      navigation.navigate('ChatThread', { chatId: chat.id, storeName: store?.name || '' });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر بدء المحادثة');
    } finally {
      setContacting(false);
    }
  }

  if (error) {
    return (
      <View style={styles.center}>
        <ErrorText>{error}</ErrorText>
      </View>
    );
  }
  if (!store) return <ScreenLoading />;

  const logo = fileUrl(store.logoUrl);
  const showCartBar = cart.storeId === storeId && cart.items.length > 0;

  return (
    <View style={styles.flex}>
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: showCartBar ? 90 : 16 }}>
      <Card style={styles.header}>
        <View style={styles.logoWrap}>
          {logo ? (
            <Image source={{ uri: logo }} style={styles.logoImg} />
          ) : (
            <Text style={styles.logoFallback}>{store.name.trim()[0] || 'م'}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.storeName}>{store.name}</Text>
          <Stars rating={store.avgRating} />
          {!store.available && (
            <View style={{ marginTop: 6 }}>
              <Badge label="غير متاح الآن" tone="red" />
            </View>
          )}
        </View>
      </Card>

      {store.available && (
        <SecondaryButton title={contacting ? 'جارٍ الفتح...' : '💬 تواصل مع المحل'} onPress={handleContact} />
      )}
      <View style={{ height: 14 }} />

      <Card>
        <Text style={styles.sectionTitle}>الخدمات</Text>
        {store.services.length === 0 ? (
          <Text style={styles.mutedText}>لا يوجد خدمات</Text>
        ) : (
          <View style={styles.serviceGrid}>
            {store.services.map((sv) => (
              <View style={styles.serviceCard} key={sv.id}>
                <Text style={styles.serviceName}>{sv.name}</Text>
                <Text style={styles.serviceMeta}>{DEVICE_LABEL[sv.deviceSupport]}</Text>
                <Text style={styles.servicePrice}>شغل يد {sv.laborPrice} ﷼</Text>
                {store.available && (
                  <Pressable
                    style={styles.bookBtn}
                    onPress={() =>
                      navigation.navigate('Booking', {
                        storeId,
                        storeName: store.name,
                        serviceId: sv.id,
                        serviceName: sv.name,
                      })
                    }
                  >
                    <Text style={styles.bookBtnText}>احجز موعد</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>المنتجات</Text>
        {store.products.length === 0 ? (
          <Text style={styles.mutedText}>لا يوجد منتجات</Text>
        ) : (
          <View style={styles.productGrid}>
            {store.products.map((p) => {
              const img = fileUrl(p.imageUrl);
              const inCart = cart.storeId === storeId && cart.items.some((i) => i.productId === p.id);
              return (
                <View style={styles.productCard} key={p.id}>
                  <View style={styles.productImgWrap}>
                    {img ? (
                      <Image source={{ uri: img }} style={styles.productImg} />
                    ) : (
                      <Text style={styles.productImgFallback}>لا صورة</Text>
                    )}
                  </View>
                  <Text style={styles.productName} numberOfLines={2}>
                    {p.name}
                  </Text>
                  <Text style={styles.productPrice}>{p.price} ﷼</Text>
                  {store.available && p.quantity > 0 && (
                    <Pressable style={styles.addCartBtn} onPress={() => cart.addItem(storeId, store.name, p)}>
                      <Text style={styles.addCartBtnText}>{inCart ? '✓ في السلة' : '+ أضف للسلة'}</Text>
                    </Pressable>
                  )}
                  {p.quantity <= 0 && <Text style={styles.outOfStock}>نفدت الكمية</Text>}
                </View>
              );
            })}
          </View>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>قيّم هذا المحل</Text>
        <View style={styles.starPicker}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setChosenRating(n)}>
              <Text style={[styles.starPick, n <= chosenRating && styles.starPickOn]}>
                {n <= chosenRating ? '★' : '☆'}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          style={styles.commentInput}
          placeholder="تعليقك (اختياري)"
          placeholderTextColor={colors.muted}
          textAlign="right"
          multiline
          value={comment}
          onChangeText={setComment}
        />
        {reviewError ? <ErrorText>{reviewError}</ErrorText> : null}
        <PrimaryButton title="إرسال التقييم" onPress={submitReview} loading={submitting} />

        <View style={{ marginTop: 14 }}>
          {store.reviews.length === 0 ? (
            <Text style={styles.mutedText}>لا يوجد تقييمات بعد</Text>
          ) : (
            store.reviews.map((r) => (
              <View style={styles.reviewRow} key={r.id}>
                <Stars rating={r.rating} size={12} />
                {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
              </View>
            ))
          )}
        </View>
      </Card>
    </ScrollView>
    {showCartBar && (
      <Pressable
        style={styles.cartBar}
        onPress={() => navigation.navigate('Cart', { storeId, storeName: store.name })}
      >
        <Text style={styles.cartBarText}>
          🛒 {cart.items.reduce((n, i) => n + i.qty, 0)} منتج — {cart.total} ﷼
        </Text>
        <Text style={styles.cartBarAction}>عرض السلة</Text>
      </Pressable>
    )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 20 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14 },
  logoWrap: {
    width: 62,
    height: 62,
    borderRadius: 16,
    backgroundColor: colors.tealBg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImg: { width: '100%', height: '100%' },
  logoFallback: { fontSize: 24, fontFamily: fonts.headingExtra, color: colors.tealDark },
  storeName: { fontFamily: fonts.heading, fontSize: 17, color: colors.ink, textAlign: 'right', marginBottom: 4 },
  sectionTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 12,
    textAlign: 'right',
    borderRightWidth: 3,
    borderRightColor: colors.teal,
    paddingRight: 8,
  },
  mutedText: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, textAlign: 'right' },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  serviceCard: { backgroundColor: colors.chipBg, borderRadius: 12, padding: 12, minWidth: 140, flexGrow: 1 },
  serviceName: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text, textAlign: 'right' },
  serviceMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, textAlign: 'right', marginTop: 4 },
  servicePrice: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink, textAlign: 'right', marginTop: 2 },
  bookBtn: {
    marginTop: 8,
    backgroundColor: colors.teal,
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
  },
  bookBtnText: { color: '#fff', fontFamily: fonts.bodySemi, fontSize: 11.5 },
  addCartBtn: {
    marginHorizontal: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.teal,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  addCartBtnText: { color: colors.tealDark, fontFamily: fonts.bodyMedium, fontSize: 11 },
  outOfStock: { color: colors.red, fontFamily: fonts.body, fontSize: 10.5, textAlign: 'center', marginBottom: 8 },
  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.ink,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  cartBarText: { color: '#fff', fontFamily: fonts.bodySemi, fontSize: 13 },
  cartBarAction: { color: colors.teal, fontFamily: fonts.bodySemi, fontSize: 13 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  productCard: {
    width: '31%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  productImgWrap: {
    aspectRatio: 1,
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImg: { width: '100%', height: '100%' },
  productImgFallback: { fontSize: 10, color: colors.muted, fontFamily: fonts.body },
  productName: { fontSize: 11.5, fontFamily: fonts.bodyMedium, color: colors.text, padding: 6, textAlign: 'right' },
  productPrice: {
    fontFamily: fonts.heading,
    fontSize: 13,
    color: colors.ink,
    paddingHorizontal: 6,
    paddingBottom: 8,
    textAlign: 'right',
  },
  starPicker: { flexDirection: 'row-reverse', gap: 6, marginBottom: 10 },
  starPick: { fontSize: 30, color: colors.star },
  starPickOn: { color: colors.star },
  commentInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    padding: 12,
    minHeight: 60,
    backgroundColor: '#FCFBF8',
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
    marginBottom: 14,
  },
  reviewRow: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 8 },
  reviewComment: { fontFamily: fonts.body, fontSize: 12.5, color: colors.text, textAlign: 'right', marginTop: 4 },
});
