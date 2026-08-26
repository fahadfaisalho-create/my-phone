import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { apiFetch, ApiError, fileUrl } from '@/lib/api';
import { ChatListItem } from '@/lib/types';
import { colors, fonts } from '@/theme/colors';
import { EmptyState, ErrorText, ScreenLoading } from '@/components/ui';
import { useLocale } from '@/lib/i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatList'>;

export default function ChatListScreen({ navigation }: Props) {
  const { t, textAlign, row } = useLocale();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<ChatListItem[]>('/chats/me');
      setChats(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('chatList.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  if (loading) return <ScreenLoading />;

  return (
    <View style={styles.flex}>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <FlatList
        data={chats}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={<EmptyState icon="💬" text={t('chatList.empty')} />}
        renderItem={({ item }) => {
          const logo = fileUrl(item.store.logoUrl);
          const last = item.messages?.[0];
          return (
            <Pressable
              style={[styles.row, { flexDirection: row }]}
              onPress={() => navigation.navigate('ChatThread', { chatId: item.id, storeName: item.store.name })}
            >
              {logo ? (
                <Image source={{ uri: logo }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarFallbackText}>{item.store.name.trim()[0] || 'م'}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { textAlign }]}>{item.store.name}</Text>
                <Text style={[styles.preview, { textAlign }]} numberOfLines={1}>
                  {last ? (last.senderType === 'consumer' ? t('chatList.youPrefix') : '') + (last.text || '') : t('chatList.noMessagesYet')}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  avatar: { width: 46, height: 46, borderRadius: 12 },
  avatarFallback: { backgroundColor: colors.indigoTint, alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: { fontFamily: fonts.headingExtra, fontSize: 18, color: colors.indigoDeep },
  name: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.text, textAlign: 'right' },
  preview: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'right', marginTop: 3 },
  empty: { textAlign: 'center', color: colors.muted, fontFamily: fonts.body, marginTop: 40 },
});
