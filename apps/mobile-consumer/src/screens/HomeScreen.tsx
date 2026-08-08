import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { apiFetch, ApiError, clearSession, getUser } from '@/lib/api';
import { StoreListItem } from '@/lib/types';
import { colors, fonts } from '@/theme/colors';
import StoreCard from '@/components/StoreCard';
import { ErrorText } from '@/components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [stores, setStores] = useState<StoreListItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    getUser().then((u) => setUserName(u?.name || ''));
  }, []);

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

  async function handleLogout() {
    await clearSession();
    navigation.reset({ index: 0, routes: [{ name: 'OtpRequest' }] });
  }

  return (
    <View style={styles.flex}>
      <View style={styles.topbar}>
        <View>
          <Text style={styles.brand}>منصة صيانة وبيع الجوالات</Text>
          {userName ? <Text style={styles.hello}>مرحباً {userName}</Text> : null}
        </View>
        <Text style={styles.logout} onPress={handleLogout}>
          خروج
        </Text>
      </View>

      <View style={styles.quickLinks}>
        <Pressable style={styles.quickLink} onPress={() => navigation.navigate('ChatList')}>
          <Text style={styles.quickLinkText}>💬 محادثاتي</Text>
        </Pressable>
        <Pressable style={styles.quickLink} onPress={() => navigation.navigate('MyBookings')}>
          <Text style={styles.quickLinkText}>📅 حجوزاتي</Text>
        </Pressable>
        <Pressable style={styles.quickLink} onPress={() => navigation.navigate('MyOrders')}>
          <Text style={styles.quickLinkText}>🧾 طلباتي</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.search}
        placeholder="ابحث عن محل..."
        placeholderTextColor={colors.muted}
        textAlign="right"
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={() => load(search)}
        returnKeyType="search"
      />

      {error ? <ErrorText>{error}</ErrorText> : null}

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
          !loading ? (
            <Text style={styles.empty}>
              {search ? 'لا يوجد نتائج مطابقة' : 'لا يوجد محلات نشطة بعد'}
            </Text>
          ) : null
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
    paddingBottom: 16,
  },
  brand: { fontFamily: fonts.headingSemi, fontSize: 15, color: '#fff', textAlign: 'right' },
  hello: { fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.75)', textAlign: 'right', marginTop: 2 },
  logout: {
    color: '#fff',
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    overflow: 'hidden',
  },
  quickLinks: {
    flexDirection: 'row-reverse',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  quickLink: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  quickLinkText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.text },
  search: {
    margin: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: '#fff',
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
  },
  listContent: { paddingHorizontal: 10, paddingBottom: 30 },
  empty: {
    textAlign: 'center',
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    marginTop: 40,
  },
});
