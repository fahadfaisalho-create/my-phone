import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { apiFetch, ApiError, getToken, getUser } from '@/lib/api';
import { requireAuth } from '@/lib/authGuard';
import { StoreListItem } from '@/lib/types';
import { colors, fonts, radius } from '@/theme/colors';
import StoreCard from '@/components/StoreCard';
import { EmptyState, ErrorText, Skeleton } from '@/components/ui';
import { useLocale } from '@/lib/i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const QUICK_LINKS: { icon: string; labelKey: string; screen: keyof RootStackParamList }[] = [
  { icon: '💬', labelKey: 'home.chats', screen: 'ChatList' },
  { icon: '📅', labelKey: 'home.bookings', screen: 'MyBookings' },
  { icon: '🧾', labelKey: 'home.orders', screen: 'MyOrders' },
  { icon: '🆘', labelKey: 'home.support', screen: 'Support' },
];

type ProviderFilter = 'all' | 'individual' | 'company';

const PROVIDER_FILTERS: { key: ProviderFilter; labelKey: string }[] = [
  { key: 'all', labelKey: 'home.filterAll' },
  { key: 'individual', labelKey: 'home.filterIndividual' },
  { key: 'company', labelKey: 'home.filterCompany' },
];

export default function HomeScreen({ navigation }: Props) {
  const { t, tf, row, textAlign, toggleLocale } = useLocale();
  const [stores, setStores] = useState<StoreListItem[]>([]);
  const [featuredStores, setFeaturedStores] = useState<StoreListItem[]>([]);
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>('all');
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
      setError(err instanceof ApiError ? err.message : t('home.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    load();
    apiFetch<StoreListItem[]>('/catalog/featured-stores')
      .then(setFeaturedStores)
      .catch(() => setFeaturedStores([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredStores =
    providerFilter === 'all' ? stores : stores.filter((s) => s.providerType === providerFilter);

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
      <View style={[styles.topbar, { flexDirection: row }]}>
        <View>
          <Text style={[styles.brand, { textAlign }]}>{t('home.brand')}</Text>
          <Text style={[styles.hello, { textAlign }]}>
            {loggedIn && userName ? tf('home.helloName', userName) : t('home.hello')}
          </Text>
        </View>
        <View style={{ flexDirection: row, gap: 8 }}>
          <Pressable style={({ pressed }) => [styles.langBtn, pressed && { opacity: 0.85 }]} onPress={toggleLocale}>
            <Text style={styles.profileBtnText}>🌐</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.profileBtn, pressed && { opacity: 0.85 }]}
            onPress={handleProfilePress}
          >
            <Text style={styles.profileBtnText}>👤 {loggedIn ? t('home.account') : t('home.login')}</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.searchWrap, { flexDirection: row }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { textAlign }]}
          placeholder={t('home.searchPlaceholder')}
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => load(search)}
          returnKeyType="search"
        />
      </View>

      <View style={[styles.quickLinks, { flexDirection: row }]}>
        {QUICK_LINKS.map((q) => (
          <Pressable
            key={q.screen}
            style={({ pressed }) => [styles.quickLink, pressed && styles.quickLinkPressed]}
            onPress={() => handleQuickLink(q.screen)}
          >
            <View style={styles.quickLinkIconWrap}>
              <Text style={styles.quickLinkIcon}>{q.icon}</Text>
            </View>
            <Text style={styles.quickLinkText}>{t(q.labelKey)}</Text>
          </Pressable>
        ))}
      </View>

      {error ? <ErrorText>{error}</ErrorText> : null}

      {featuredStores.length > 0 && (
        <View style={styles.featuredSection}>
          <Text style={[styles.featuredTitle, { textAlign }]}>{t('home.featuredAds')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.featuredScroll, { flexDirection: row }]}
          >
            {featuredStores.map((item) => (
              <View key={item.id} style={styles.featuredCard}>
                <StoreCard store={item} onPress={() => navigation.navigate('StoreDetail', { storeId: item.id })} />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={[styles.filterRow, { flexDirection: row }]}>
        {PROVIDER_FILTERS.map((f) => (
          <Pressable
            key={f.key}
            style={[styles.filterChip, providerFilter === f.key && styles.filterChipOn]}
            onPress={() => setProviderFilter(f.key)}
          >
            <Text style={[styles.filterChipText, providerFilter === f.key && styles.filterChipTextOn]}>
              {t(f.labelKey)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.listTitle, { textAlign }]}>{t('home.availableStores')}</Text>

      <FlatList
        data={filteredStores}
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
            colors={[colors.indigo]}
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
              text={search ? t('home.noResults') : t('home.noFilterMatch')}
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
  langBtn: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  quickLinkIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.indigoTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLinkIcon: { fontSize: 16 },
  quickLinkText: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.text },
  featuredSection: { marginTop: 18 },
  featuredTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 15,
    color: colors.ink,
    textAlign: 'right',
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  featuredScroll: { flexDirection: 'row-reverse', paddingHorizontal: 10 },
  featuredCard: { width: 150 },
  filterRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 18,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  filterChipText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.text },
  filterChipTextOn: { color: '#fff' },
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
