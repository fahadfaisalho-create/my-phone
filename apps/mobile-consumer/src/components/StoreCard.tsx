import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '@/theme/colors';
import { cardShadow } from '@/theme/shadow';
import { fileUrl } from '@/lib/api';
import { StoreListItem } from '@/lib/types';
import { useLocale } from '@/lib/i18n';

export default function StoreCard({ store, onPress }: { store: StoreListItem; onPress: () => void }) {
  const { t, tf, textAlign } = useLocale();
  const logo = fileUrl(store.logoUrl);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.cover}>
        {logo ? (
          <Image source={{ uri: logo }} style={styles.coverImg} resizeMode="cover" />
        ) : (
          <Text style={styles.coverFallback}>{store.name.trim()[0] || 'م'}</Text>
        )}
        {store.avgRating !== null && (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingBadgeText}>★ {store.avgRating.toFixed(1)}</Text>
          </View>
        )}
        {store.providerType === 'individual' && (
          <View style={styles.individualBadge}>
            <Text style={styles.individualBadgeText}>{t('storeCard.individual')}</Text>
          </View>
        )}
        {!store.available && (
          <View style={styles.unavailableBadge}>
            <Text style={styles.unavailableBadgeText}>{t('storeCard.unavailable')}</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={[styles.name, { textAlign }]} numberOfLines={1}>
          {store.name}
        </Text>
        <Text style={[styles.meta, { textAlign }]}>
          {store.providerType === 'individual'
            ? tf('storeCard.serviceCountOnly', String(store.servicesCount))
            : tf('storeCard.serviceAndProductCount', String(store.servicesCount), String(store.productsCount))}
        </Text>
        {store.avgRating !== null && (
          <Text style={[styles.reviewsMeta, { textAlign }]}>{tf('storeCard.reviewCount', String(store.reviewsCount))}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
    margin: 6,
    ...cardShadow,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  cover: {
    height: 108,
    backgroundColor: colors.tealBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImg: { width: '100%', height: '100%' },
  coverFallback: { fontSize: 32, fontFamily: fonts.headingExtra, color: colors.tealDark },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(16,27,46,0.78)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ratingBadgeText: { color: colors.star, fontFamily: fonts.bodySemi, fontSize: 11 },
  individualBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(16,27,46,0.78)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  individualBadgeText: { color: '#fff', fontFamily: fonts.bodySemi, fontSize: 10 },
  unavailableBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(163,45,45,0.88)',
    paddingVertical: 4,
  },
  unavailableBadgeText: {
    color: '#fff',
    fontFamily: fonts.bodyMedium,
    fontSize: 10.5,
    textAlign: 'center',
  },
  body: { padding: 12 },
  name: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.text, textAlign: 'right', marginBottom: 4 },
  meta: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, textAlign: 'right' },
  reviewsMeta: { fontFamily: fonts.body, fontSize: 10.5, color: colors.muted, textAlign: 'right', marginTop: 2 },
});
