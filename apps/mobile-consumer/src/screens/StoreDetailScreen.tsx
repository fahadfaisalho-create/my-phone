import { useEffect, useRef, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { apiFetch, ApiError, fileUrl } from '@/lib/api';
import { requireAuth } from '@/lib/authGuard';
import { DEVICE_LABEL, DEVICE_LABEL_EN, StoreDetail } from '@/lib/types';
import { colors, fonts, radius } from '@/theme/colors';
import { Badge, Card, ErrorText, PrimaryButton, ScreenLoading, SecondaryButton, Stars } from '@/components/ui';
import { useCart } from '@/lib/CartContext';
import { useLocale } from '@/lib/i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'StoreDetail'>;

export default function StoreDetailScreen({ route, navigation }: Props) {
  const { t, tf, locale, row, textAlign } = useLocale();
  const deviceLabel = locale === 'ar' ? DEVICE_LABEL : DEVICE_LABEL_EN;
  const { storeId, product: highlightProductId, technician: highlightTechnicianId } = route.params;
  const [store, setStore] = useState<StoreDetail | null>(null);
  // منتج/فني وصل عبره رابط مشاركة مباشر من التاجر — نمرّر الشاشة له
  // ونميّزه بصرياً بعد ما يحمّل المحل (مرة واحدة فقط، مو مع كل تحديث)
  const productRefs = useRef<Record<string, View | null>>({});
  const techRefs = useRef<Record<string, View | null>>({});
  const [scrolledToTarget, setScrolledToTarget] = useState(false);
  const [error, setError] = useState('');
  const [chosenRating, setChosenRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [contacting, setContacting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // الفرع الذي اختاره المستهلك للتسوق منه — إلزامي فقط لو المحل عنده أكثر من فرع
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const cart = useCart();

  async function load() {
    try {
      const data = await apiFetch<StoreDetail>(`/catalog/stores/${storeId}`);
      setStore(data);
      // فرع واحد فقط: نختاره تلقائياً بدون إزعاج المستهلك بخطوة اختيار
      if (data.branches.length === 1) setSelectedBranchId(data.branches[0].id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('storeDetail.loadError'));
    }
  }

  useEffect(() => {
    setSelectedBranchId(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  useEffect(() => {
    navigation.setOptions({ title: store?.name || '' });
  }, [store, navigation]);

  useEffect(() => {
    if (!store || scrolledToTarget || (!highlightProductId && !highlightTechnicianId)) return;
    const targetRef = highlightProductId
      ? productRefs.current[highlightProductId]
      : highlightTechnicianId
        ? techRefs.current[highlightTechnicianId]
        : null;
    if (!targetRef) return;
    // نستنى تكة إضافية حتى تخلص التخطيطات (layout) من كل العناصر فوقه —
    // react-native-web يمرّر عقدة DOM الحقيقية كمرجع الـ View، فنستخدم
    // scrollIntoView مباشرة (أوثق من measureLayout غير المستقر على الويب)
    const timer = setTimeout(() => {
      const node = targetRef as unknown as { scrollIntoView?: (opts?: ScrollIntoViewOptions) => void };
      node.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      setScrolledToTarget(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [store, highlightProductId, highlightTechnicianId, scrolledToTarget]);

  async function submitReview() {
    if (!(await requireAuth(navigation, { screen: 'StoreDetail', params: { storeId } }))) return;
    if (!chosenRating) {
      setReviewError(t('storeDetail.ratingRequired'));
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
      setChosenRating(0);
      await load();
    } catch (err) {
      setReviewError(err instanceof ApiError ? err.message : t('storeDetail.reviewError'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleContact() {
    if (!(await requireAuth(navigation, { screen: 'StoreDetail', params: { storeId } }))) return;
    setContacting(true);
    try {
      const chat = await apiFetch<{ id: string }>('/chats', {
        method: 'POST',
        body: JSON.stringify({ storeId }),
      });
      navigation.navigate('ChatThread', { chatId: chat.id, storeName: store?.name || '' });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('storeDetail.chatError'));
    } finally {
      setContacting(false);
    }
  }

  async function handleBook(serviceId: string, serviceName: string) {
    if (!store) return;
    if (!(await requireAuth(navigation, { screen: 'StoreDetail', params: { storeId } }))) return;
    navigation.navigate('Booking', { storeId, storeName: store.name, serviceId, serviceName });
  }

  async function handleAddToCart(product: StoreDetail['products'][number]) {
    if (!store) return;
    if (!(await requireAuth(navigation, { screen: 'StoreDetail', params: { storeId } }))) return;
    const branch = store.branches.find((b) => b.id === selectedBranchId) || null;
    cart.addItem(storeId, store.name, product, selectedBranchId, branch?.name ?? null);
  }

  function openInMaps(query: string) {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    Linking.openURL(url).catch(() => undefined);
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>😕</Text>
        <ErrorText>{error}</ErrorText>
      </View>
    );
  }
  if (!store) return <ScreenLoading />;

  const logo = fileUrl(store.logoUrl);
  const showCartBar = cart.storeId === storeId && cart.items.length > 0;
  // لازم يختار المستهلك فرعه أولاً لو المحل عنده أكثر من فرع، قبل ما يشوف المنتجات
  const needsBranchChoice = store.branches.length > 1 && !selectedBranchId;
  // منتج مرتبط بفرع محدد يظهر فقط لمن اختار نفس الفرع، والمنتج المشترك يظهر دائماً
  const branchProducts = needsBranchChoice
    ? []
    : store.products.filter((p) => !p.branchId || p.branchId === selectedBranchId);
  const categories = Array.from(
    new Set(branchProducts.map((p) => p.category?.trim()).filter((c): c is string => !!c)),
  );
  const visibleProducts = selectedCategory
    ? branchProducts.filter((p) => (p.category?.trim() || null) === selectedCategory)
    : branchProducts;

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={{ paddingBottom: showCartBar ? 96 : 20 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroLogoWrap}>
            {logo ? (
              <Image source={{ uri: logo }} style={styles.logoImg} />
            ) : (
              <Text style={styles.logoFallback}>{store.name.trim()[0] || 'م'}</Text>
            )}
          </View>
          <Text style={styles.storeName}>{store.name}</Text>
          {store.providerType === 'individual' && (
            <View style={styles.individualRow}>
              <Text style={styles.individualText}>{t('storeDetail.individual')}</Text>
              {store.idVerified && <Text style={styles.individualText}>{t('storeDetail.idVerified')}</Text>}
            </View>
          )}
          <View style={{ marginTop: 4 }}>
            <Stars rating={store.avgRating} reviewsCount={store.reviewsCount} />
          </View>
          {!store.available && (
            <View style={{ marginTop: 8 }}>
              <Badge label={t('storeDetail.unavailable')} tone="red" />
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {store.available && (
            <SecondaryButton
              title={contacting ? t('storeDetail.contactingStore') : t('storeDetail.contactStore')}
              onPress={handleContact}
            />
          )}
          <View style={{ height: 14 }} />

          {store.branches.length > 1 && (
            <Card>
              <Text style={styles.sectionTitle}>{t('storeDetail.chooseBranchHeading')}</Text>
              <Text style={[styles.mutedText, { textAlign }]}>{t('storeDetail.chooseBranchNote')}</Text>
              <View style={[styles.branchPickRow, { flexDirection: row }]}>
                {store.branches.map((b) => (
                  <Pressable
                    key={b.id}
                    style={[styles.branchPickChip, selectedBranchId === b.id && styles.branchPickChipOn]}
                    onPress={() => setSelectedBranchId(b.id)}
                  >
                    <Text
                      style={[
                        styles.branchPickChipText,
                        selectedBranchId === b.id && styles.branchPickChipTextOn,
                      ]}
                    >
                      {selectedBranchId === b.id ? '✓ ' : ''}
                      {b.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Card>
          )}

          {store.branches.length > 0 && (
            <Card>
              <Text style={styles.sectionTitle}>{t('storeDetail.branchesHeading')}</Text>
              {store.branches.map((b) => (
                <View style={[styles.branchRow, { flexDirection: row }]} key={b.id}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.branchName, { textAlign }]}>📍 {b.name}</Text>
                    {b.address ? (
                      <Text style={[styles.branchAddress, { textAlign }]}>{b.address}</Text>
                    ) : (
                      <Text style={[styles.branchAddressMuted, { textAlign }]}>{t('storeDetail.noBranchAddress')}</Text>
                    )}
                  </View>
                  {b.address && (
                    <Pressable
                      style={styles.mapsBtn}
                      onPress={() => openInMaps(`${store.name} ${b.address}`)}
                    >
                      <Text style={styles.mapsBtnText}>{t('storeDetail.openInMaps')}</Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </Card>
          )}

          {store.technicians.length > 0 && (
            <Card>
              <Text style={styles.sectionTitle}>{t('storeDetail.teamHeading')}</Text>
              {store.technicians.map((tech) => {
                const photo = fileUrl(tech.photoUrl);
                return (
                  <View
                    ref={(el) => {
                      techRefs.current[tech.id] = el;
                    }}
                    style={[
                      styles.techRow,
                      { flexDirection: row },
                      highlightTechnicianId === tech.id && styles.highlighted,
                    ]}
                    key={tech.id}
                  >
                    <View style={styles.techPhotoWrap}>
                      {photo ? (
                        <Image source={{ uri: photo }} style={styles.techPhoto} />
                      ) : (
                        <Text style={styles.techPhotoFallback}>👤</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.techName, { textAlign }]}>{tech.name}</Text>
                      <Text style={[styles.techMeta, { textAlign }]}>
                        {tech.nationality}
                        {tech.experienceYears != null ? tf('storeDetail.experienceYears', String(tech.experienceYears)) : ''}
                      </Text>
                      {tech.freelanceLicenseNo && (
                        <Pressable
                          disabled={!tech.freelanceLicenseFileUrl}
                          onPress={() => {
                            const url = fileUrl(tech.freelanceLicenseFileUrl);
                            if (url) Linking.openURL(url).catch(() => undefined);
                          }}
                        >
                          <Text style={[styles.techLicense, { textAlign }]}>
                            {tf('storeDetail.freelanceLicense', tech.freelanceLicenseNo)}
                            {tech.freelanceLicenseFileUrl ? t('storeDetail.viewFile') : ''}
                          </Text>
                        </Pressable>
                      )}
                      {tech.certificates.length > 0 && (
                        <View style={[styles.techCerts, { flexDirection: row }]}>
                          {tech.certificates.map((c) => (
                            <Pressable
                              key={c.id}
                              disabled={!c.fileUrl}
                              onPress={() => {
                                const url = fileUrl(c.fileUrl);
                                if (url) Linking.openURL(url).catch(() => undefined);
                              }}
                              style={styles.certChip}
                            >
                              <Text style={styles.certChipText}>🎓 {c.title}</Text>
                            </Pressable>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </Card>
          )}

          <Card>
            <Text style={styles.sectionTitle}>{t('storeDetail.servicesHeading')}</Text>
            {store.services.length === 0 ? (
              <Text style={[styles.mutedText, { textAlign }]}>{t('storeDetail.noServicesYet')}</Text>
            ) : (
              <View style={styles.serviceGrid}>
                {store.services.map((sv) => (
                  <View style={styles.serviceCard} key={sv.id}>
                    <Text style={[styles.serviceName, { textAlign }]}>{sv.name}</Text>
                    <Text style={[styles.serviceMeta, { textAlign }]}>{deviceLabel[sv.deviceSupport]}</Text>
                    <Text style={[styles.servicePrice, { textAlign }]}>{tf('storeDetail.laborPrice', sv.laborPrice)}</Text>
                    {store.available && (
                      <Pressable style={styles.bookBtn} onPress={() => handleBook(sv.id, sv.name)}>
                        <Text style={styles.bookBtnText}>{t('storeDetail.bookAppointment')}</Text>
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>
            )}
          </Card>

          {store.providerType !== 'individual' && (
          <Card>
            <Text style={styles.sectionTitle}>{t('storeDetail.productsHeading')}</Text>
            {store.products.length === 0 ? (
              <Text style={[styles.mutedText, { textAlign }]}>{t('storeDetail.noProductsYet')}</Text>
            ) : needsBranchChoice ? (
              <Text style={[styles.mutedText, { textAlign }]}>{t('storeDetail.chooseBranchAbove')}</Text>
            ) : branchProducts.length === 0 ? (
              <Text style={[styles.mutedText, { textAlign }]}>{t('storeDetail.noProductsInBranch')}</Text>
            ) : (
              <>
                {categories.length > 1 && (
                  <View style={[styles.categoryRow, { flexDirection: row }]}>
                    <Pressable
                      style={[styles.categoryChip, !selectedCategory && styles.categoryChipOn]}
                      onPress={() => setSelectedCategory(null)}
                    >
                      <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextOn]}>
                        {t('storeDetail.all')}
                      </Text>
                    </Pressable>
                    {categories.map((c) => (
                      <Pressable
                        key={c}
                        style={[styles.categoryChip, selectedCategory === c && styles.categoryChipOn]}
                        onPress={() => setSelectedCategory(c)}
                      >
                        <Text style={[styles.categoryChipText, selectedCategory === c && styles.categoryChipTextOn]}>
                          {c}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                <View style={styles.productGrid}>
                  {visibleProducts.map((p) => {
                    const img = fileUrl(p.imageUrl);
                    const inCart = cart.storeId === storeId && cart.items.some((i) => i.productId === p.id);
                    return (
                      <View
                        ref={(el) => {
                          productRefs.current[p.id] = el;
                        }}
                        style={[styles.productCard, highlightProductId === p.id && styles.highlighted]}
                        key={p.id}
                      >
                        <View style={styles.productImgWrap}>
                          {img ? (
                            <Image source={{ uri: img }} style={styles.productImg} />
                          ) : (
                            <Text style={styles.productImgFallback}>📦</Text>
                          )}
                        </View>
                        <Text style={[styles.productName, { textAlign }]} numberOfLines={2}>
                          {p.name}
                        </Text>
                        <Text style={[styles.productPrice, { textAlign }]}>{p.price} ﷼</Text>
                        {store.available && p.quantity > 0 && (
                          <Pressable
                            style={[styles.addCartBtn, inCart && styles.addCartBtnOn]}
                            onPress={() => handleAddToCart(p)}
                          >
                            <Text style={[styles.addCartBtnText, inCart && styles.addCartBtnTextOn]}>
                              {inCart ? t('storeDetail.inCart') : t('storeDetail.addToCart')}
                            </Text>
                          </Pressable>
                        )}
                        {p.quantity <= 0 && <Text style={styles.outOfStock}>{t('storeDetail.outOfStock')}</Text>}
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </Card>
          )}

          <Card>
            <Text style={styles.sectionTitle}>{t('storeDetail.rateStore')}</Text>
            <View style={[styles.starPicker, { flexDirection: row }]}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setChosenRating(n)} hitSlop={6}>
                  <Text style={[styles.starPick, n <= chosenRating && styles.starPickOn]}>
                    {n <= chosenRating ? '★' : '☆'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={styles.commentInput}
              placeholder={t('storeDetail.commentPlaceholder')}
              placeholderTextColor={colors.muted}
              textAlign={textAlign}
              multiline
              value={comment}
              onChangeText={setComment}
            />
            {reviewError ? <ErrorText>{reviewError}</ErrorText> : null}
            <PrimaryButton title={t('storeDetail.submitReview')} onPress={submitReview} loading={submitting} />

            <View style={{ marginTop: 14 }}>
              {store.reviews.length === 0 ? (
                <Text style={[styles.mutedText, { textAlign }]}>{t('storeDetail.noReviewsYet')}</Text>
              ) : (
                store.reviews.map((r) => (
                  <View style={styles.reviewRow} key={r.id}>
                    <Stars rating={r.rating} size={12} />
                    {r.comment ? <Text style={[styles.reviewComment, { textAlign }]}>{r.comment}</Text> : null}
                  </View>
                ))
              )}
            </View>
          </Card>
        </View>
      </ScrollView>
      {showCartBar && (
        <Pressable
          style={({ pressed }) => [styles.cartBar, { flexDirection: row }, pressed && { opacity: 0.9 }]}
          onPress={() => navigation.navigate('Cart', { storeId, storeName: store.name })}
        >
          <Text style={styles.cartBarText}>
            {tf('storeDetail.cartBar', String(cart.items.reduce((n, i) => n + i.qty, 0)), String(cart.total))}
          </Text>
          <Text style={styles.cartBarAction}>{t('storeDetail.viewCart')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 20 },
  errorIcon: { fontSize: 40, marginBottom: 8 },
  hero: {
    backgroundColor: colors.ink,
    alignItems: 'center',
    paddingTop: 22,
    paddingBottom: 26,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 16,
  },
  heroLogoWrap: {
    width: 76,
    height: 76,
    borderRadius: radius.lg,
    backgroundColor: colors.indigoTint,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: 10,
  },
  logoImg: { width: '100%', height: '100%' },
  logoFallback: { fontSize: 28, fontFamily: fonts.headingExtra, color: colors.indigoDeep },
  storeName: { fontFamily: fonts.heading, fontSize: 18, color: '#fff', textAlign: 'center' },
  individualRow: { flexDirection: 'row', gap: 5, marginTop: 4 },
  individualText: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: 'rgba(255,255,255,0.85)' },
  sectionTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 12,
    textAlign: 'right',
    borderRightWidth: 3,
    borderRightColor: colors.indigo,
    paddingRight: 8,
  },
  mutedText: { color: colors.muted, fontFamily: fonts.body, fontSize: 13 },
  branchPickRow: { flexWrap: 'wrap', gap: 8, marginTop: 10 },
  branchPickChip: {
    borderWidth: 1,
    borderColor: colors.indigo,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: colors.card,
  },
  branchPickChipOn: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  branchPickChipText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.indigoDeep },
  branchPickChipTextOn: { color: '#fff' },
  branchRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  branchName: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.text },
  branchAddress: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 3 },
  branchAddressMuted: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 3,
    fontStyle: 'italic',
  },
  mapsBtn: {
    borderWidth: 1,
    borderColor: colors.indigo,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  mapsBtnText: { color: colors.indigoDeep, fontFamily: fonts.bodyMedium, fontSize: 11.5 },
  techRow: {
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  techPhotoWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  techPhoto: { width: '100%', height: '100%' },
  techPhotoFallback: { fontSize: 20 },
  techName: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.text },
  techMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  techLicense: { fontFamily: fonts.body, fontSize: 11.5, color: colors.indigoDeep, marginTop: 4 },
  techCerts: { flexWrap: 'wrap', gap: 6, marginTop: 6 },
  certChip: {
    backgroundColor: colors.indigoTint,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  certChipText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.indigoDeep },
  categoryRow: { flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  categoryChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: colors.card,
  },
  categoryChipOn: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  categoryChipText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.text },
  categoryChipTextOn: { color: '#fff' },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  serviceCard: {
    backgroundColor: colors.chipBg,
    borderRadius: radius.md,
    padding: 12,
    minWidth: 140,
    flexGrow: 1,
  },
  serviceName: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
  serviceMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 4 },
  servicePrice: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink, marginTop: 2 },
  bookBtn: {
    marginTop: 8,
    backgroundColor: colors.indigo,
    borderRadius: radius.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  bookBtnText: { color: '#fff', fontFamily: fonts.bodySemi, fontSize: 11.5 },
  addCartBtn: {
    marginHorizontal: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.indigo,
    borderRadius: radius.sm,
    paddingVertical: 7,
    alignItems: 'center',
  },
  addCartBtnOn: { backgroundColor: colors.indigoTint },
  addCartBtnText: { color: colors.indigoDeep, fontFamily: fonts.bodyMedium, fontSize: 11 },
  addCartBtnTextOn: { color: colors.indigoDeep },
  outOfStock: { color: colors.red, fontFamily: fonts.body, fontSize: 10.5, textAlign: 'center', marginBottom: 8 },
  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.ink,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  cartBarText: { color: '#fff', fontFamily: fonts.bodySemi, fontSize: 13 },
  cartBarAction: { color: colors.indigo, fontFamily: fonts.bodySemi, fontSize: 13 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  productCard: {
    width: '31%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
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
  productImgFallback: { fontSize: 24, opacity: 0.4 },
  productName: { fontSize: 11.5, fontFamily: fonts.bodyMedium, color: colors.text, padding: 6 },
  productPrice: {
    fontFamily: fonts.heading,
    fontSize: 13,
    color: colors.ink,
    paddingHorizontal: 6,
    paddingBottom: 8,
  },
  starPicker: { gap: 6, marginBottom: 10 },
  starPick: { fontSize: 30, color: colors.star },
  starPickOn: { color: colors.star },
  commentInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 12,
    minHeight: 60,
    backgroundColor: colors.fieldBg,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
    marginBottom: 14,
  },
  reviewRow: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 8 },
  reviewComment: { fontFamily: fonts.body, fontSize: 12.5, color: colors.text, marginTop: 4 },
  // العنصر المقصود من رابط مشاركة مباشر (منتج أو فني) — يتميّز بصرياً بعد
  // ما تنتقل الصفحة له تلقائياً
  highlighted: {
    borderWidth: 2,
    borderColor: colors.indigo,
    borderRadius: radius.sm,
    backgroundColor: colors.indigoTint,
    paddingHorizontal: 8,
  },
});
