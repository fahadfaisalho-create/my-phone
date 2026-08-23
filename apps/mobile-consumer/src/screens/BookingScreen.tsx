import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { apiFetch, ApiError } from '@/lib/api';
import { requireAuth } from '@/lib/authGuard';
import { StoreBranch, VisitType } from '@/lib/types';
import { colors, fonts, radius } from '@/theme/colors';
import { Card, ErrorText, PrimaryButton, ScreenLoading } from '@/components/ui';
import { useLocale } from '@/lib/i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Booking'>;

const TIME_SLOTS = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];

function dateLabel(offsetDays: number, dateLocale: string) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return { date: d, label: d.toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric', month: 'short' }) };
}

export default function BookingScreen({ route, navigation }: Props) {
  const { t, tf, locale, row, textAlign } = useLocale();
  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US';
  const VISIT_LABEL: Record<VisitType, string> = {
    in_store: t('booking.visitInStore'),
    home_visit: t('booking.visitHomeVisit'),
  };

  const { storeId, serviceId, serviceName } = route.params;
  const [branches, setBranches] = useState<StoreBranch[]>([]);
  const [laborPrice, setLaborPrice] = useState<string | null>(null);
  const [supportsInStore, setSupportsInStore] = useState(true);
  const [supportsHomeVisit, setSupportsHomeVisit] = useState(false);
  const [homeVisitFee, setHomeVisitFee] = useState<string | null>(null);
  const [visitType, setVisitType] = useState<VisitType>('in_store');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');
  const [loading, setLoading] = useState(true);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [dayOffset, setDayOffset] = useState<number | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const days = [0, 1, 2, 3].map((n) => ({ offset: n, ...dateLabel(n, dateLocale) }));

  useEffect(() => {
    (async () => {
      try {
        const store = await apiFetch<{
          branches: StoreBranch[];
          services: {
            id: string;
            laborPrice: string;
            supportsInStore: boolean;
            supportsHomeVisit: boolean;
            homeVisitFee: string | null;
          }[];
        }>(`/catalog/stores/${storeId}`);
        setBranches(store.branches);
        if (store.branches.length === 1) setBranchId(store.branches[0].id);
        const svc = store.services.find((s) => s.id === serviceId);
        if (svc) {
          setLaborPrice(svc.laborPrice);
          setSupportsInStore(svc.supportsInStore);
          setSupportsHomeVisit(svc.supportsHomeVisit);
          setHomeVisitFee(svc.homeVisitFee);
          setVisitType(svc.supportsInStore ? 'in_store' : 'home_visit');
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t('booking.loadError'));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  // يجيب موقع الجهاز فعليًا (GPS) بدل الاعتماد على كتابة العنوان يدويًا — لدقة أعلى بالزيارة المنزلية
  async function handleUseLocation() {
    setLocateError('');
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocateError(t('booking.locationPermission'));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = pos.coords;
      setCoords({ lat: latitude, lng: longitude });
      try {
        const results = await Location.reverseGeocodeAsync({ latitude, longitude });
        const r = results[0];
        const formatted = r ? [r.city, r.district ?? r.subregion, r.street, r.name].filter(Boolean).join('، ') : '';
        setAddress(formatted || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      } catch {
        setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      }
    } catch {
      setLocateError(t('booking.locationError'));
    } finally {
      setLocating(false);
    }
  }

  async function handleSubmit() {
    if (!(await requireAuth(navigation, { screen: 'StoreDetail', params: { storeId } }))) return;
    if (!branchId || dayOffset === null || !time) {
      setError(t('booking.selectBranchDateTime'));
      return;
    }
    if (visitType === 'home_visit' && !address.trim()) {
      setError(t('booking.addressRequired'));
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const d = new Date();
      d.setDate(d.getDate() + dayOffset);
      const [h, m] = time.split(':').map(Number);
      d.setHours(h, m, 0, 0);
      await apiFetch('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          storeId,
          serviceId,
          branchId,
          scheduledAt: d.toISOString(),
          visitType,
          ...(visitType === 'home_visit'
            ? {
                customerAddress: address.trim(),
                ...(coords ? { customerLat: coords.lat, customerLng: coords.lng } : {}),
              }
            : {}),
        }),
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('booking.submitError'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <ScreenLoading />;

  if (success) {
    return (
      <View style={styles.center}>
        <Card style={{ width: '100%' }}>
          <Text style={styles.successTitle}>{t('booking.successTitle')}</Text>
          <Text style={[styles.mutedText, { textAlign }]}>{t('booking.successNote')}</Text>
          <PrimaryButton title={t('booking.myBookings')} onPress={() => navigation.replace('MyBookings')} />
        </Card>
      </View>
    );
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={{ padding: 16 }}>
      <Card>
        <Text style={[styles.title, { textAlign }]}>{tf('booking.bookingTitle', serviceName)}</Text>
        {laborPrice ? <Text style={[styles.priceNote, { textAlign }]}>{tf('booking.laborPrice', laborPrice)}</Text> : null}

        {supportsInStore && supportsHomeVisit && (
          <>
            <Text style={[styles.label, { textAlign }]}>{t('booking.bookingType')}</Text>
            <View style={[styles.chipsRow, { flexDirection: row }]}>
              {(['in_store', 'home_visit'] as VisitType[]).map((v) => (
                <Pressable
                  key={v}
                  style={[styles.chip, visitType === v && styles.chipOn]}
                  onPress={() => setVisitType(v)}
                >
                  <Text style={[styles.chipText, visitType === v && styles.chipTextOn]}>{VISIT_LABEL[v]}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {visitType === 'home_visit' && (
          <>
            {homeVisitFee ? (
              <Text style={[styles.priceNote, { textAlign }]}>{tf('booking.homeVisitFee', homeVisitFee)}</Text>
            ) : null}
            <Text style={[styles.label, { textAlign }]}>{t('booking.visitAddress')}</Text>

            <Pressable
              style={({ pressed }) => [styles.locateBtn, pressed && styles.btnPressed]}
              onPress={handleUseLocation}
              disabled={locating}
            >
              {locating ? (
                <ActivityIndicator color={colors.teal} size="small" />
              ) : (
                <Text style={styles.locateBtnText}>{t('booking.useCurrentLocation')}</Text>
              )}
            </Pressable>
            {coords && !locating && <Text style={[styles.locatedNote, { textAlign }]}>{t('booking.locationConfirmed')}</Text>}
            {locateError ? <ErrorText>{locateError}</ErrorText> : null}

            <TextInput
              style={styles.addressInput}
              placeholder={t('booking.addressPlaceholder')}
              placeholderTextColor={colors.muted}
              textAlign={textAlign}
              multiline
              value={address}
              onChangeText={(val) => {
                setAddress(val);
                setCoords(null);
              }}
            />
          </>
        )}

        <Text style={[styles.label, { textAlign }]}>{t('booking.branch')}</Text>
        <View style={[styles.chipsRow, { flexDirection: row }]}>
          {branches.map((b) => (
            <Pressable
              key={b.id}
              style={[styles.chip, branchId === b.id && styles.chipOn]}
              onPress={() => setBranchId(b.id)}
            >
              <Text style={[styles.chipText, branchId === b.id && styles.chipTextOn]}>{b.name}</Text>
            </Pressable>
          ))}
          {branches.length === 0 && <Text style={[styles.mutedText, { textAlign }]}>{t('booking.noBranches')}</Text>}
        </View>

        <Text style={[styles.label, { textAlign }]}>{t('booking.date')}</Text>
        <View style={[styles.chipsRow, { flexDirection: row }]}>
          {days.map((d) => (
            <Pressable
              key={d.offset}
              style={[styles.chip, dayOffset === d.offset && styles.chipOn]}
              onPress={() => setDayOffset(d.offset)}
            >
              <Text style={[styles.chipText, dayOffset === d.offset && styles.chipTextOn]}>{d.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { textAlign }]}>{t('booking.time')}</Text>
        <View style={[styles.chipsRow, { flexDirection: row }]}>
          {TIME_SLOTS.map((slot) => (
            <Pressable key={slot} style={[styles.chip, time === slot && styles.chipOn]} onPress={() => setTime(slot)}>
              <Text style={[styles.chipText, time === slot && styles.chipTextOn]}>{slot}</Text>
            </Pressable>
          ))}
        </View>

        {error ? <ErrorText>{error}</ErrorText> : null}
        <PrimaryButton title={t('booking.confirmBooking')} onPress={handleSubmit} loading={submitting} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 20 },
  title: { fontFamily: fonts.heading, fontSize: 16, color: colors.ink, marginBottom: 4 },
  priceNote: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginBottom: 16 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.muted, marginBottom: 8 },
  chipsRow: { flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    backgroundColor: colors.chipBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipOn: { backgroundColor: colors.teal, borderColor: colors.teal },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.text },
  chipTextOn: { color: '#fff' },
  mutedText: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, marginBottom: 14 },
  locateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tealBg,
    borderWidth: 1,
    borderColor: '#BFE6DF',
    borderRadius: radius.sm,
    paddingVertical: 11,
    marginBottom: 8,
  },
  locateBtnText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.tealDark },
  btnPressed: { opacity: 0.8 },
  locatedNote: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.green,
    marginBottom: 8,
  },
  addressInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    padding: 12,
    minHeight: 60,
    backgroundColor: '#FCFBF8',
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
    marginBottom: 16,
  },
  successTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.ink, textAlign: 'center', marginBottom: 8 },
});
