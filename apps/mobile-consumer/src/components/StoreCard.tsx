import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/theme/colors';
import { cardShadow } from '@/theme/shadow';
import { fileUrl } from '@/lib/api';
import { StoreListItem } from '@/lib/types';
import { Stars } from './ui';

export default function StoreCard({ store, onPress }: { store: StoreListItem; onPress: () => void }) {
  const logo = fileUrl(store.logoUrl);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.cover}>
        {logo ? (
          <Image source={{ uri: logo }} style={styles.coverImg} resizeMode="cover" />
        ) : (
          <Text style={styles.coverFallback}>{store.name.trim()[0] || 'م'}</Text>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {store.name}
        </Text>
        <View style={{ marginVertical: 4 }}>
          <Stars rating={store.avgRating} size={12} />
        </View>
        <Text style={styles.meta}>
          {store.servicesCount} خدمة · {store.productsCount} منتج
        </Text>
        {!store.available && (
          <Text style={styles.unavailable}>غير متاح الآن</Text>
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
    borderRadius: 16,
    overflow: 'hidden',
    margin: 6,
    ...cardShadow,
  },
  pressed: { opacity: 0.85 },
  cover: {
    height: 96,
    backgroundColor: colors.tealBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImg: { width: '100%', height: '100%' },
  coverFallback: { fontSize: 30, fontFamily: fonts.headingExtra, color: colors.tealDark },
  body: { padding: 12 },
  name: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text, textAlign: 'right' },
  meta: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, textAlign: 'right' },
  unavailable: {
    marginTop: 4,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.red,
    textAlign: 'right',
  },
});
