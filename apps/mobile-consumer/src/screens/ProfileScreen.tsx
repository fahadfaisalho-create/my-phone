import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { apiFetch, ApiError, clearSession, getUser } from '@/lib/api';
import { colors, fonts } from '@/theme/colors';
import { Card, ErrorText, PrimaryButton, Stars } from '@/components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

interface MyReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  store: { id: string; name: string; logoUrl: string | null };
}

export default function ProfileScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const user = await getUser();
    setName(user?.name || '');
    setPhone(user?.phone || '');
    try {
      const data = await apiFetch<MyReview[]>('/reviews/me');
      setReviews(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر تحميل تقييماتك');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleLogout() {
    await clearSession();
    navigation.reset({ index: 0, routes: [{ name: 'OtpRequest' }] });
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={reviews}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 14 }}
        ListHeaderComponent={
          <>
            <Card style={{ marginBottom: 14 }}>
              <Text style={styles.name}>{name || 'مستخدم'}</Text>
              <Text style={styles.phone}>{phone}</Text>
              <View style={{ marginTop: 14 }}>
                <PrimaryButton title="تسجيل الخروج" onPress={handleLogout} />
              </View>
            </Card>
            <Text style={styles.sectionTitle}>تقييماتي</Text>
            {error ? <ErrorText>{error}</ErrorText> : null}
          </>
        }
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>لم تقيّم أي محل بعد</Text> : null
        }
        renderItem={({ item }) => (
          <View style={styles.reviewCard}>
            <View style={styles.reviewTop}>
              <Text style={styles.storeName}>{item.store.name}</Text>
              <Stars rating={item.rating} size={12} />
            </View>
            {item.comment ? <Text style={styles.comment}>{item.comment}</Text> : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  name: { fontFamily: fonts.heading, fontSize: 17, color: colors.ink, textAlign: 'right' },
  phone: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, textAlign: 'right', marginTop: 4 },
  sectionTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 10,
    textAlign: 'right',
    borderRightWidth: 3,
    borderRightColor: colors.teal,
    paddingRight: 8,
  },
  reviewCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  reviewTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  storeName: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.text },
  comment: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, textAlign: 'right', marginTop: 6 },
  empty: { textAlign: 'center', color: colors.muted, fontFamily: fonts.body, marginTop: 20 },
});
