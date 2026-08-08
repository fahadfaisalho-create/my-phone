'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { apiFetch, ApiError } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Chat, Message } from '@/lib/types';

export default function MessagesTab() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const activeChatIdRef = useRef<string | null>(null);

  async function loadChats() {
    setLoading(true);
    try {
      const data = await apiFetch<Chat[]>('/stores/me/chats');
      setChats(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر تحميل المحادثات');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChats();

    const socket = getSocket();
    socketRef.current = socket;
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onMessage = (msg: Message) => {
      if (msg.chatId === activeChatIdRef.current) {
        setMessages((prev) => [...prev, msg]);
      }
      loadChats();
    };
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message', onMessage);
    if (socket.connected) setConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message', onMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openChat = useCallback((id: string) => {
    setActiveChatId(id);
    activeChatIdRef.current = id;
    setMessages([]);
    socketRef.current?.emit('join', { chatId: id }, (ack: { ok: boolean; messages?: Message[]; message?: string }) => {
      if (ack.ok) setMessages(ack.messages || []);
      else setError(ack.message || 'تعذّر فتح المحادثة');
    });
  }, []);

  function handleSend() {
    if (!activeChatId || !text.trim() || !socketRef.current) return;
    socketRef.current.emit(
      'message',
      { chatId: activeChatId, text: text.trim() },
      (ack: { ok: boolean; message?: string }) => {
        if (!ack.ok) setError(typeof ack.message === 'string' ? ack.message : 'تعذّر إرسال الرسالة');
      },
    );
    setText('');
  }

  if (loading) return <div className="card spinner-wrap">جارٍ التحميل...</div>;

  return (
    <div className="card">
      <h3>
        رسائل العملاء{' '}
        <span style={{ fontSize: 11, color: connected ? 'var(--green)' : 'var(--muted)', fontWeight: 500 }}>
          {connected ? '● متصل فورياً' : '○ غير متصل'}
        </span>
      </h3>
      {error && <div className="err">{error}</div>}
      {chats.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>لا يوجد رسائل بعد</p>
      ) : (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 220px', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {chats.map((c) => (
              <div
                key={c.id}
                className={`chatlist-item ${activeChatId === c.id ? 'on' : ''}`}
                onClick={() => openChat(c.id)}
              >
                <div>
                  <b style={{ fontSize: 13 }}>{c.consumer?.name || 'عميل'}</b>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {c.messages?.[0]?.text?.slice(0, 30) || 'لا رسائل بعد'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ flex: '2 1 320px' }}>
            {!activeChatId ? (
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>اختر محادثة من القائمة</p>
            ) : (
              <>
                <div className="chat-thread">
                  {messages.map((m) => (
                    <div key={m.id} className={`msg ${m.senderType === 'merchant' ? 'merchant' : 'consumer'}`}>
                      {m.text}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <input
                    placeholder="اكتب ردك..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    style={{ marginBottom: 0 }}
                  />
                  <button className="primary" onClick={handleSend} disabled={!text.trim()}>
                    إرسال
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
