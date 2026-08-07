'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { Chat, Message } from '@/lib/types';

export default function MessagesTab() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

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
  }, []);

  async function openChat(id: string) {
    setActiveChatId(id);
    try {
      const data = await apiFetch<Message[]>(`/chats/${id}/messages`);
      setMessages(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر تحميل الرسائل');
    }
  }

  async function handleSend() {
    if (!activeChatId || !text.trim()) return;
    setSending(true);
    try {
      const msg = await apiFetch<Message>(`/chats/${activeChatId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text: text.trim() }),
      });
      setMessages((prev) => [...prev, msg]);
      setText('');
      loadChats();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر إرسال الرسالة');
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="card spinner-wrap">جارٍ التحميل...</div>;

  return (
    <div className="card">
      <h3>رسائل العملاء</h3>
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
                  <button className="primary" onClick={handleSend} disabled={sending || !text.trim()}>
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
