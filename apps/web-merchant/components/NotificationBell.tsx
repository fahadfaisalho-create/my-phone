'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { getNotificationsSocket } from '@/lib/socket';
import { useLocale } from '@/lib/i18n';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  data?: { orderId?: string; bookingId?: string } | null;
}

// جرس إشعارات (طلب/حجز جديد، تغيّر حالة) — يجلب القائمة عند التحميل، ثم يبقى
// متصلاً بسوكيت مخصص يستقبل أي إشعار جديد فوراً بدون إعادة تحميل الصفحة
export default function NotificationBell({ onNavigate }: { onNavigate: (tab: 'orders' | 'bookings') => void }) {
  const { t, locale } = useLocale();
  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US';
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([
        apiFetch<NotificationItem[]>('/notifications/me'),
        apiFetch<number>('/notifications/me/unread-count'),
      ]);
      setItems(list);
      setUnread(count);
    } catch {
      // فشل التحميل — الجرس يبقى بلا عدّاد بدل ما يعطّل باقي اللوحة
    }
  }, []);

  useEffect(() => {
    load();
    const socket = getNotificationsSocket();
    const onNew = (n: NotificationItem) => {
      setItems((prev) => [n, ...prev].slice(0, 30));
      setUnread((c) => c + 1);
    };
    socket.on('new', onNew);
    return () => {
      socket.off('new', onNew);
    };
  }, [load]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function handleItemClick(n: NotificationItem) {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((c) => Math.max(0, c - 1));
      apiFetch(`/notifications/${n.id}/read`, { method: 'PATCH' }).catch(() => undefined);
    }
    setOpen(false);
    if (n.data?.orderId) onNavigate('orders');
    else if (n.data?.bookingId) onNavigate('bookings');
  }

  async function handleMarkAllRead() {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnread(0);
    apiFetch('/notifications/me/read-all', { method: 'PATCH' }).catch(() => undefined);
  }

  return (
    <div className="notif-bell-wrap" ref={wrapRef}>
      <button
        type="button"
        className="notif-bell-btn"
        aria-label={t('notifications.title')}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9Z" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unread > 0 && <span className="notif-bell-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-head">
            <span>{t('notifications.title')}</span>
            {unread > 0 && (
              <button type="button" className="link" onClick={handleMarkAllRead}>
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>
          <div className="notif-dropdown-list">
            {items.length === 0 && <div className="notif-empty">{t('notifications.empty')}</div>}
            {items.map((n) => (
              <button
                type="button"
                key={n.id}
                className={`notif-item ${n.read ? '' : 'unread'}`}
                onClick={() => handleItemClick(n)}
              >
                <div className="notif-item-title">{n.title}</div>
                <div className="notif-item-body">{n.body}</div>
                <div className="notif-item-time">{new Date(n.createdAt).toLocaleString(dateLocale)}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
