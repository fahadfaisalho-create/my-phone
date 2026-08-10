import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { apiFetch, ApiError, getToken, getUser } from '@/lib/api';
import { requireAuth } from '@/lib/authGuard';
import { StoreListItem } from '@/lib/types';
import { colors, fonts, radius } from '@/theme/colors';
import StoreCard from '@/components/StoreCard';
import { EmptyState, ErrorText, Skeleton } from '@/components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const QUICK_LINKS: { icon: string; label: string; screen: keyof RootStackParamList }[] = [
  { icon: '💬', label: 'محادثاتي', screen: 'ChatList' },
  { icon: '📅', label: 'حجوزاتي', screen: 'MyBookings' },
  { icon: '🧾', label: 'طلباتي', screen: 'MyOrders' },
  { icon: '🆘', label: 'الدعم', screen: 'Support' },
];

export default function HomeScreen({ navigation }: Props) {
  const [stores, setStores] = useState<StoreListItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  const refreshSession = useCallback(() => {
    getUser().then((u) => setUserName(u?.name || ''));
    getToken().then((t) => setLoggedIn(!!t));
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', refreshSession);
    refreshSession();
    return unsub;
  }, [navigation, refreshSession]);

  const load = useCallback(async (query?: string) => {
    setError('');
    try {
      const q = query !== undefined ? query : search;
      const data = await apiFetch<StoreListItem[]>(
        `/catalog/stores${q ? `?search=${encodeURIComponent(q)}` : ''}`,
      );
      setStores(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر تحميل المحلات');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleProfilePress() {
    if (!(await requireAuth(navigation, { screen: 'Home' }))) return;
    navigation.navigate('Profile');
  }

  async function handleQuickLink(screen: keyof RootStackParamList) {
    if (!(await requireAuth(navigation, { screen }))) return;
    navigation.navigate(screen as never);
  }

  return (
    <View style={styles.flex}>
      <View style={styles.topbar}>
        <View>
          <Text style={styles.brand}>📱 My Phone</Text>
          <Text style={styles.hello}>{loggedIn && userName ? `مرحباً، ${userName}` : 'مرحباً بك 👋'}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.profileBtn, pressed && { opacity: 0.85 }]}
          onPress={handleProfilePress}
        >
          <Text style={styles.profileBtnText}>👤 {loggedIn ? 'حسابي' : 'دخول'}</Text>
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث عن محل صيانة أو بيع جوالات..."
          placeholderTextColor={colors.muted}
          textAlign="right"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => load(search)}
          returnKeyType="search"
        />
      </View>

      <View style={styles.quickLinks}>
        {QUICK_LINKS.map((q) => (
          <Pressable
            key={q.screen}
            style={({ pressed }) => [styles.quickLink, pressed && styles.quickLinkPressed]}
            onPress={() => handleQuickLink(q.screen)}
          >
            <Text style={styles.quickLinkIcon}>{q.icon}</Text>
            <Text style={styles.quickLinkText}>{q.label}</Text>
          </Pressable>
        ))}
      </View>

      {error ? <ErrorText>{error}</ErrorText> : null}

      <Text style={styles.listTitle}>المحلات المتاحة</Text>

      <FlatList
        data={stores}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            colors={[colors.teal]}
          />
        }
        renderItem={({ item }) => (
          <StoreCard store={item} onPress={() => navigation.navigate('StoreDetail', { storeId: item.id })} />
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletonGrid}>
              {[1, 2, 3, 4].map((n) => (
                <View key={n} style={styles.skeletonCard}>
                  <Skeleton height={108} style={{ borderRadius: 0 }} />
                  <View style={{ padding: 12, gap: 8 }}>
                    <Skeleton height={13} width="70%" />
                    <Skeleton height={11} width="50%" />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              icon={search ? '🔍' : '🏬'}
              text={search ? 'لا يوجد نتائج مطابقة' : 'لا يوجد محلات نشطة بعد'}
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  topbar: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.ink,
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: 22,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  brand: { fontFamily: fonts.headingExtra, fontSize: 18, color: '#fff', textAlign: 'right' },
  hello: { fontFamily: fonts.body, fontSize: 12.5, color: 'rgba(255,255,255,0.75)', textAlign: 'right', marginTop: 3 },
  profileBtn: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.sm,
  },
  profileBtnText: { color: '#fff', fontFamily: fonts.bodyMedium, fontSize: 13 },
  searchWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: -22,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0 6px 16px rgba(16,27,46,0.10)',
  } as any,
  searchIcon: { fontSize: 15, marginLeft: 8 },
  searchInput: {
    flex: 1,
    paddingVertical: 13,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
  },
  quickLinks: {
    flexDirection: 'row-reverse',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  quickLink: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  quickLinkPressed: { backgroundColor: colors.chipBg },
  quickLinkIcon: { fontSize: 18 },
  quickLinkText: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.text },
  listTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 15,
    color: colors.ink,
    textAlign: 'right',
    marginTop: 20,
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  listContent: { paddingHorizontal: 10, paddingBottom: 30, paddingTop: 6 },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  skeletonCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    margin: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
