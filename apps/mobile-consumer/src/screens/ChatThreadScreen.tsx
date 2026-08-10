import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { Socket } from 'socket.io-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { getSocket } from '@/lib/socket';
import { apiFetch, ApiError, fileUrl } from '@/lib/api';
import { ChatMessage } from '@/lib/types';
import { colors, fonts } from '@/theme/colors';
import { ErrorText, PrimaryButton, ScreenLoading } from '@/components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatThread'>;

export default function ChatThreadScreen({ route, navigation }: Props) {
  const { chatId, storeName } = route.params;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    navigation.setOptions({ title: storeName });
  }, [storeName, navigation]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const socket = await getSocket();
      socketRef.current = socket;

      function onConnect() {
        setConnected(true);
        socket.emit('join', { chatId }, (ack: { ok: boolean; messages?: ChatMessage[]; message?: string }) => {
          if (!mounted) return;
          if (ack.ok) {
            setMessages(ack.messages || []);
          } else {
            setError(ack.message || 'تعذّر فتح المحادثة');
          }
          setLoading(false);
        });
      }
      function onMessage(msg: ChatMessage) {
        if (msg.chatId !== chatId) return;
        setMessages((prev) => [...prev, msg]);
      }
      function onDisconnect() {
        setConnected(false);
      }

      socket.on('connect', onConnect);
      socket.on('message', onMessage);
      socket.on('disconnect', onDisconnect);
      if (socket.connected) onConnect();

      return () => {
        socket.off('connect', onConnect);
        socket.off('message', onMessage);
        socket.off('disconnect', onDisconnect);
      };
    })();
    return () => {
      mounted = false;
    };
  }, [chatId]);

  const handleSend = useCallback(() => {
    const value = text.trim();
    if (!value || !socketRef.current) return;
    socketRef.current.emit('message', { chatId, text: value }, (ack: { ok: boolean; message?: string }) => {
      if (!ack.ok) setError(typeof ack.message === 'string' ? ack.message : 'تعذّر إرسال الرسالة');
    });
    setText('');
  }, [chatId, text]);

  const handleAttach = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      setError('نحتاج إذن الوصول للصور لإرفاق صورة');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0] as ImagePicker.ImagePickerAsset & { file?: File };

    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      if (asset.file) {
        // ويب (Expo Web): الملف الفعلي متوفر جاهز
        form.append('chatImage', asset.file);
      } else {
        // جوال (iOS/Android): نبني كائن الملف من الـ uri
        form.append('chatImage', {
          uri: asset.uri,
          name: asset.fileName || 'chat-image.jpg',
          type: asset.mimeType || 'image/jpeg',
        } as unknown as Blob);
      }
      const res = await apiFetch<{ imageUrl: string }>(`/chats/${chatId}/upload-image`, {
        method: 'POST',
        body: form,
      });
      if (!socketRef.current) throw new Error('غير متصل');
      socketRef.current.emit(
        'message',
        { chatId, imageUrl: res.imageUrl },
        (ack: { ok: boolean; message?: string }) => {
          if (!ack.ok) setError(typeof ack.message === 'string' ? ack.message : 'تعذّر إرسال الصورة');
        },
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر رفع الصورة');
    } finally {
      setUploading(false);
    }
  }, [chatId]);

  if (loading) return <ScreenLoading />;

  return (
    <View style={styles.flex}>
      {!connected && <Text style={styles.offline}>جارٍ الاتصال...</Text>}
      {error ? <ErrorText>{error}</ErrorText> : null}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 14 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.senderType === 'consumer' ? styles.bubbleMine : styles.bubbleTheirs]}>
            {item.imageUrl ? (
              <Image source={{ uri: fileUrl(item.imageUrl) || undefined }} style={styles.bubbleImage} resizeMode="cover" />
            ) : null}
            {item.text ? (
              <Text style={item.senderType === 'consumer' ? styles.bubbleTextMine : styles.bubbleTextTheirs}>
                {item.text}
              </Text>
            ) : null}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>ابدأ المحادثة بإرسال رسالة</Text>}
      />
      <View style={styles.inputRow}>
        <Pressable style={styles.attachBtn} onPress={handleAttach} disabled={uploading}>
          <Text style={styles.attachBtnText}>{uploading ? '...' : '📎'}</Text>
        </Pressable>
        <TextInput
          style={styles.input}
          placeholder="اكتب رسالتك..."
          placeholderTextColor={colors.muted}
          textAlign="right"
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleSend}
        />
        <PrimaryButton title="إرسال" onPress={handleSend} disabled={!text.trim()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  offline: { textAlign: 'center', color: colors.amber, fontFamily: fonts.body, fontSize: 12, paddingVertical: 4 },
  bubble: { maxWidth: '78%', borderRadius: 14, paddingHorizontal: 13, paddingVertical: 9, marginBottom: 8 },
  bubbleMine: { backgroundColor: colors.ink, alignSelf: 'flex-start', borderBottomLeftRadius: 3 },
  bubbleTheirs: { backgroundColor: colors.chipBg, alignSelf: 'flex-end', borderBottomRightRadius: 3 },
  bubbleTextMine: { color: '#fff', fontFamily: fonts.body, fontSize: 13.5, textAlign: 'right' },
  bubbleTextTheirs: { color: colors.text, fontFamily: fonts.body, fontSize: 13.5, textAlign: 'right' },
  bubbleImage: { width: 180, height: 180, borderRadius: 10, marginBottom: 4 },
  empty: { textAlign: 'center', color: colors.muted, fontFamily: fonts.body, marginTop: 30 },
  inputRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FCFBF8',
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
  },
  attachBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCFBF8',
  },
  attachBtnText: { fontSize: 18 },
});
