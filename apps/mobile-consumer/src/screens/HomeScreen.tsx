import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { apiFetch, ApiError } from '@/lib/api';
import { StoreListItem } from '@/lib/types';
import { colors, fonts, radius } from '@/theme/colors';
import StoreCard from '@/components/StoreCard';
import MobileTopBar from '@/components/MobileTopBar';
import { EmptyState, ErrorText, Skeleton } from '@/components/ui';
import { useLocale } from '@/lib/i18n';
import { useIsWideWeb } from '@/lib/webShell';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type ProviderFilter = 'all' | 'individual' | 'company';

const PROVIDER_FILTERS: { key: ProviderFilter; labelKey: string }[] = [
  { key: 'all', labelKey: 'home.filterAll' },
  { key: 'individual', labelKey: 'home.filterIndividual' },
  { key: 'company', labelKey: 'home.filterCompany' },
];

export default function HomeScreen({ navigation }: Props) {
  const { t, row, textAlign } = useLocale();
  // الهوية (البراند/الحساب/التنقل) يغطيها الشريط الجانبي بعرض الويب الواسع،
  // وعلى الجوال يغطيها الشريط العلوي + القائمة المنسدلة — فما نكررها بالصفحة
  const isWideWeb = useIsWideWeb();
  const [stores, setStores] = useState<StoreListItem[]>([]);
  const [featuredStores, setFeaturedStores] = useState<StoreListItem[]>([]);
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <View style={styles.flex}>
      {!isWideWeb && <MobileTopBar />}

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
  searchWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 14,
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
