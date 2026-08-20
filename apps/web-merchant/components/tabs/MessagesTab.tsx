'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { apiFetch, ApiError, fileUrl } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Chat, Message } from '@/lib/types';
import { useLocale } from '@/lib/i18n';

export default function MessagesTab() {
  const { t } = useLocale();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [uploading, setUploading] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadChats() {
    setLoading(true);
    try {
      const data = await apiFetch<Chat[]>('/stores/me/chats');
      setChats(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('messages.loadError'));
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

  const openChat = useCallback(
    (id: string) => {
      setActiveChatId(id);
      activeChatIdRef.current = id;
      setMessages([]);
      socketRef.current?.emit('join', { chatId: id }, (ack: { ok: boolean; messages?: Message[]; message?: string }) => {
        if (ack.ok) setMessages(ack.messages || []);
        else setError(ack.message || t('messages.openChatError'));
      });
    },
    [t],
  );

  function handleSend() {
    if (!activeChatId || !text.trim() || !socketRef.current) return;
    socketRef.current.emit(
      'message',
      { chatId: activeChatId, text: text.trim() },
      (ack: { ok: boolean; message?: string }) => {
        if (!ack.ok) setError(typeof ack.message === 'string' ? ack.message : t('messages.sendMessageError'));
      },
    );
    setText('');
  }

  async function handleAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !activeChatId || !socketRef.current) return;
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('chatImage', file);
      const res = await apiFetch<{ imageUrl: string }>(`/chats/${activeChatId}/upload-image`, {
        method: 'POST',
        body: form,
      });
      socketRef.current.emit(
        'message',
        { chatId: activeChatId, imageUrl: res.imageUrl },
        (ack: { ok: boolean; message?: string }) => {
          if (!ack.ok) setError(typeof ack.message === 'string' ? ack.message : t('messages.sendImageError'));
        },
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('messages.uploadError'));
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <div className="card spinner-wrap">{t('common.loading')}</div>;

  return (
    <div className="card">
      <h3>
        {t('messages.heading')}{' '}
        <span style={{ fontSize: 11, color: connected ? 'var(--green)' : 'var(--muted)', fontWeight: 500 }}>
          {connected ? t('messages.connected') : t('messages.disconnected')}
        </span>
      </h3>
      {error && <div className="err">{error}</div>}
      {chats.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('messages.empty')}</p>
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
                  <b style={{ fontSize: 13 }}>{c.consumer?.name || t('messages.defaultCustomer')}</b>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {c.messages?.[0]?.text?.slice(0, 30) || t('messages.noMessagesYet')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ flex: '2 1 320px' }}>
            {!activeChatId ? (
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('messages.selectChat')}</p>
            ) : (
              <>
                <div className="chat-thread">
                  {messages.map((m) => (
                    <div key={m.id} className={`msg ${m.senderType === 'merchant' ? 'merchant' : 'consumer'}`}>
                      {m.imageUrl && (
                        <img
                          src={fileUrl(m.imageUrl) || ''}
                          alt={t('messages.imageAlt')}
                          style={{ maxWidth: 180, borderRadius: 8, display: 'block', marginBottom: m.text ? 6 : 0 }}
                        />
                      )}
                      {m.text}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleAttach} />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{ padding: '0 12px' }}
                  >
                    {uploading ? '...' : '📎'}
                  </button>
                  <input
                    placeholder={t('messages.typeReply')}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    style={{ marginBottom: 0 }}
                  />
                  <button className="primary" onClick={handleSend} disabled={!text.trim()}>
                    {t('messages.send')}
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
