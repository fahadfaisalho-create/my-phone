import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import { navigationRef } from '@/lib/webShell';
import { requireAuth } from '@/lib/authGuard';
import { apiFetch, clearSession, getToken, getUser } from '@/lib/api';
import { getNotificationsSocket, disconnectNotificationsSocket } from '@/lib/socket';
import type { RootStackParamList } from '@/navigation/types';
import { colors, fonts, radius } from '@/theme/colors';
import { useLocale } from '@/lib/i18n';

// نفس بنية الشريط الجانبي المستخدمة بلوحتي التاجر والإدمن بالضبط (نفس
// الألوان/الخطوط — الهوية أصلاً موحّدة بين التطبيقات الثلاثة) لكن بمكوّنات
// React Native عادية بدل CSS، لأن هذا تطبيق Expo/React Native وليس Next.js.
// يُستخدم بحالتين: ثابتاً بجانب المحتوى على عرض الويب الواسع، أو داخل قائمة
// منسدلة على الجوال (نفس المحتوى بالضبط) — و onNavigate تقفل المنسدلة بعد
// أي إجراء ينقل المستخدم لمكان ثاني
type NavKey = keyof RootStackParamList;

interface NavItem {
  key: NavKey;
  labelKey: string;
  requiresAuth: boolean;
}

const GROUPS: { labelKey: string; items: NavItem[] }[] = [
  {
    labelKey: 'sidebar.groupBrowse',
    items: [{ key: 'Home', labelKey: 'sidebar.home', requiresAuth: false }],
  },
  {
    labelKey: 'sidebar.groupAccount',
    items: [
      { key: 'ChatList', labelKey: 'sidebar.chats', requiresAuth: true },
      { key: 'MyBookings', labelKey: 'sidebar.bookings', requiresAuth: true },
      { key: 'MyOrders', labelKey: 'sidebar.orders', requiresAuth: true },
      { key: 'Notifications', labelKey: 'sidebar.notifications', requiresAuth: true },
      { key: 'Support', labelKey: 'sidebar.support', requiresAuth: true },
    ],
  },
];

interface Props {
  variant?: 'fixed' | 'drawer';
  onNavigate?: () => void;
}

export default function WebSidebar({ variant = 'fixed', onNavigate }: Props = {}) {
  const { t, row, textAlign, toggleLocale } = useLocale();
  const [activeKey, setActiveKey] = useState<string | undefined>(undefined);
  const [userName, setUserName] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  async function refreshSession() {
    const user = await getUser();
    setUserName(user?.name || '');
    setLoggedIn(!!user);
  }

  async function refreshUnreadCount() {
    const token = await getToken();
    if (!token) {
      setUnreadCount(0);
      return;
    }
    try {
      const count = await apiFetch<number>('/notifications/me/unread-count');
      setUnreadCount(count);
    } catch {
      // فشل تحميل العدّاد — يبقى بلا رقم بدل ما يعطّل باقي الشريط
    }
  }

  // اتصال بسوكيت الإشعارات طالما فيه جلسة دخول — يزيد العدّاد فوراً بلا إعادة تحميل
  useEffect(() => {
    if (!loggedIn) return;
    let socketRef: Awaited<ReturnType<typeof getNotificationsSocket>> | null = null;
    let cancelled = false;
    getNotificationsSocket().then((socket) => {
      if (cancelled) return;
      socketRef = socket;
      socket.on('new', () => setUnreadCount((c) => c + 1));
    });
    return () => {
      cancelled = true;
      socketRef?.off('new');
      disconnectNotificationsSocket();
    };
  }, [loggedIn]);

  useEffect(() => {
    refreshSession();
    refreshUnreadCount();
    // navigationRef يصير جاهزاً فقط بعد ما يُركَّب NavigationContainer الشقيق
    // له بشجرة العناصر — نستنى جاهزيته بفحص دوري قصير قبل تعليق المستمع
    let unsub: (() => void) | undefined;
    const poll = setInterval(() => {
      if (navigationRef.isReady()) {
        clearInterval(poll);
        setActiveKey(navigationRef.getCurrentRoute()?.name);
        unsub = navigationRef.addListener('state', () => {
          setActiveKey(navigationRef.getCurrentRoute()?.name);
          refreshSession();
          refreshUnreadCount();
        });
      }
    }, 150);
    return () => {
      clearInterval(poll);
      unsub?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePress(item: NavItem) {
    if (!navigationRef.isReady()) return;
    if (item.requiresAuth) {
      const ok = await requireAuth(navigationRef as unknown as NavigationProp<RootStackParamList>, {
        screen: item.key,
      });
      // حتى لو تحوّل لصفحة الدخول بدل الوجهة المطلوبة، المستخدم انتقل فعلاً
      // من مكانه — نقفل المنسدلة بالحالتين
      onNavigate?.();
      if (!ok) return;
    }
    navigationRef.navigate(item.key as never);
    onNavigate?.();
  }

  async function handleLogout() {
    await clearSession();
    setUnreadCount(0);
    navigationRef.resetRoot({ index: 0, routes: [{ name: 'AuthPhone' }] });
    onNavigate?.();
  }

  function handleLoginPress() {
    if (!navigationRef.isReady()) return;
    navigationRef.navigate('AuthPhone', { returnTo: { screen: 'Home' } });
    onNavigate?.();
  }

  return (
    <View style={[styles.sidebar, variant === 'drawer' && styles.sidebarDrawer]}>
      <View style={styles.brand}>
        <Text style={[styles.brandName, { textAlign }]}>My Phone</Text>
        <Text style={[styles.brandSub, { textAlign }]}>{t('sidebar.roleLabel')}</Text>
      </View>

      <View style={styles.nav}>
        {GROUPS.map((group) => (
          <View key={group.labelKey}>
            <Text style={[styles.sectionLabel, { textAlign }]}>{t(group.labelKey)}</Text>
            {group.items.map((item) => {
              const active = activeKey === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => handlePress(item)}
                  style={({ pressed }) => [
                    styles.item,
                    { flexDirection: row, justifyContent: 'space-between' },
                    active && styles.itemActive,
                    pressed && !active && styles.itemHover,
                  ]}
                >
                  <Text style={[styles.itemLabel, active && styles.itemLabelActive, { textAlign }]}>
                    {t(item.labelKey)}
                  </Text>
                  {item.key === 'Notifications' && unreadCount > 0 && (
                    <View style={styles.badgeCount}>
                      <Text style={styles.badgeCountText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <Pressable
        onPress={toggleLocale}
        style={({ pressed }) => [styles.langBtn, { flexDirection: row }, pressed && styles.itemHover]}
      >
        <Text style={[styles.itemLabel, { textAlign }]}>{t('common.langToggle')}</Text>
      </Pressable>

      {loggedIn ? (
        <View style={[styles.profile, { flexDirection: row }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName.trim()[0] || 'م'}</Text>
          </View>
          <View style={styles.info}>
            <Text style={[styles.infoName, { textAlign }]} numberOfLines={1}>
              {userName}
            </Text>
            <Text style={[styles.infoRole, { textAlign }]}>{t('sidebar.roleLabel')}</Text>
          </View>
          <Pressable onPress={handleLogout} hitSlop={8}>
            <Text style={styles.logoutIcon}>⏻</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={handleLoginPress}
          style={({ pressed }) => [styles.loginBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.loginBtnText}>{t('sidebar.login')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 248,
    flexShrink: 0,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRightWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
    // @ts-expect-error web-only
    height: '100vh',
    // @ts-expect-error web-only
    position: 'sticky',
    top: 0,
    overflowY: 'auto',
  },
  // داخل المنسدلة يملأ اللوح كامل ارتفاعها بدل التثبيت على ارتفاع النافذة
  sidebarDrawer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderRightWidth: 0,
    paddingTop: 26,
  },
  brand: { paddingHorizontal: 4, marginBottom: 22 },
  brandName: { fontFamily: fonts.heading, fontWeight: '700', fontSize: 14, color: colors.ink },
  brandSub: { fontSize: 11, color: colors.muted, marginTop: 1 },
  nav: { gap: 2, marginBottom: 8 },
  sectionLabel: { fontSize: 11, color: colors.muted, fontWeight: '600', paddingHorizontal: 10, marginTop: 14, marginBottom: 4 },
  item: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
  },
  itemHover: { backgroundColor: colors.bg },
  itemActive: { backgroundColor: colors.indigoTint },
  itemLabel: { fontSize: 13.5, fontWeight: '500', color: colors.text, fontFamily: fonts.body },
  itemLabelActive: { color: colors.indigoDeep, fontWeight: '700' },
  badgeCount: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 999,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCountText: { color: '#fff', fontSize: 10.5, fontWeight: '700', fontFamily: fonts.bodySemi },
  langBtn: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    marginTop: 8,
  },
  profile: {
    marginTop: 'auto',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 13, fontFamily: fonts.heading },
  info: { flex: 1, minWidth: 0 },
  infoName: { fontSize: 12.5, fontWeight: '600', color: colors.ink },
  infoRole: { fontSize: 11, color: colors.muted, marginTop: 1 },
  logoutIcon: { fontSize: 15, color: colors.muted },
  loginBtn: {
    marginTop: 'auto',
    backgroundColor: colors.indigo,
    borderRadius: radius.pill,
    paddingVertical: 11,
    alignItems: 'center',
  },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 13.5, fontFamily: fonts.bodySemi },
});
