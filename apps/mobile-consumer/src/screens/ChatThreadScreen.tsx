import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Socket } from 'socket.io-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { getSocket } from '@/lib/socket';
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
            <Text style={item.senderType === 'consumer' ? styles.bubbleTextMine : styles.bubbleTextTheirs}>
              {item.text}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>ابدأ المحادثة بإرسال رسالة</Text>}
      />
      <View style={styles.inputRow}>
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
});
