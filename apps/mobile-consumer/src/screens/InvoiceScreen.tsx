import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { apiFetch, ApiError } from '@/lib/api';
import { colors, fonts, radius } from '@/theme/colors';
import { Card, ErrorText, PrimaryButton, ScreenLoading } from '@/components/ui';
import { useLocale } from '@/lib/i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Invoice'>;
type CourierProvider = 'aramex' | 'fedex';

const COURIER_LABEL: Record<CourierProvider, string> = {
  aramex: 'أرامكس',
  fedex: 'فيدكس',
};

interface InvoiceData {
  invoiceNo: string;
  issuedAt: string;
  createdAt: string;
  store: { name: string; taxNo: string | null; commercialRegisterNo: string };
  consumer: { name: string; phone: string | null };
  items: { name: string; qty: number; price: number; lineTotal: number }[];
  subtotal: number;
  deliveryType: 'pickup' | 'delivery';
  deliveryFee: number | null;
  courierProvider: CourierProvider | null;
  deliveryMethod: 'courier' | 'store_agent' | null;
  deliveryAddress: string | null;
  discountAmount: number | null;
  total: number;
  vatRate: number | null;
  taxableAmount: number | null;
  vatAmount: number | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
}

export default function InvoiceScreen({ route }: Props) {
  const { t } = useLocale();
  const { orderId } = route.params;
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<InvoiceData>(`/orders/${orderId}/invoice`);
        setInvoice(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t('invoice.loadError'));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  function handlePrint() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
    }
  }

  if (loading) return <ScreenLoading />;

  if (error || !invoice) {
    return (
      <View style={styles.center}>
        <ErrorText>{error || t('invoice.loadError')}</ErrorText>
      </View>
    );
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={{ padding: 16 }}>
      <Card>
        <View style={styles.headRow}>
          <Text style={styles.storeName}>{invoice.store.name}</Text>
          <Text style={styles.invoiceTitleAr}>{invoice.vatRate ? 'فاتورة ضريبية مبسطة' : 'فاتورة مبسطة'}</Text>
          <Text style={styles.invoiceTitleEn}>{invoice.vatRate ? 'Simplified Tax Invoice' : 'Simplified Invoice'}</Text>
        </View>

        <Text style={styles.sectionLabel}>تفاصيل الفاتورة</Text>
        <View style={styles.metaBox}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>رقم الفاتورة</Text>
            <Text style={styles.metaValue}>{invoice.invoiceNo}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>تاريخ الإصدار</Text>
            <Text style={styles.metaValue}>{formatDate(invoice.issuedAt)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>وقت الإصدار</Text>
            <Text style={styles.metaValue}>{formatTime(invoice.issuedAt)}</Text>
          </View>
          {invoice.store.taxNo ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>الرقم الضريبي للمتجر</Text>
              <Text style={styles.metaValue}>{invoice.store.taxNo}</Text>
            </View>
          ) : null}
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>السجل التجاري للمتجر</Text>
            <Text style={styles.metaValue}>{invoice.store.commercialRegisterNo}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>بيانات العميل</Text>
        <View style={styles.metaBox}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>اسم العميل</Text>
            <Text style={styles.metaValue}>{invoice.consumer.name}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {invoice.items.map((it, idx) => (
          <View style={styles.itemRow} key={idx}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{it.name}</Text>
              <Text style={styles.itemQty}>
                {it.qty} × {it.price} ﷼
              </Text>
            </View>
            <Text style={styles.itemTotal}>{it.lineTotal} ﷼</Text>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.sumRow}>
          <Text style={styles.sumLabel}>المنتجات</Text>
          <Text style={styles.sumValue}>{invoice.subtotal} ﷼</Text>
        </View>
        {invoice.discountAmount ? (
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>خصم الكوبون</Text>
            <Text style={styles.sumValue}>- {invoice.discountAmount} ﷼</Text>
          </View>
        ) : null}
        {invoice.deliveryType === 'delivery' && (
          <>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>
                رسوم التوصيل
                {invoice.courierProvider ? ` (${COURIER_LABEL[invoice.courierProvider]})` : ''}
                {invoice.deliveryMethod === 'store_agent' ? ' (مندوب المحل)' : ''}
              </Text>
              <Text style={styles.sumValue}>{invoice.deliveryFee ?? 0} ﷼</Text>
            </View>
            {invoice.deliveryAddress ? (
              <Text style={styles.address}>📍 {invoice.deliveryAddress}</Text>
            ) : null}
          </>
        )}

        <View style={styles.divider} />

        <View style={styles.totalsBox}>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>الإجمالي (قبل الخصم)</Text>
            <Text style={styles.sumValue}>
              {(invoice.subtotal + (invoice.deliveryFee ?? 0)).toFixed(2)} ﷼
            </Text>
          </View>
          {invoice.discountAmount ? (
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>إجمالي الخصم</Text>
              <Text style={styles.sumValue}>{invoice.discountAmount.toFixed(2)} ﷼</Text>
            </View>
          ) : null}
          {invoice.vatRate !== null ? (
            <>
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>المبلغ الخاضع للضريبة</Text>
                <Text style={styles.sumValue}>{invoice.taxableAmount?.toFixed(2)} ﷼</Text>
              </View>
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>ضريبة القيمة المضافة ({invoice.vatRate}%)</Text>
                <Text style={styles.sumValue}>{invoice.vatAmount?.toFixed(2)} ﷼</Text>
              </View>
            </>
          ) : null}
          <View style={[styles.sumRow, { marginTop: 6 }]}>
            <Text style={styles.totalLabel}>المبلغ الإجمالي</Text>
            <Text style={styles.totalValue}>{invoice.total} ﷼</Text>
          </View>
        </View>

        <View style={styles.qrBox}>
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrPlaceholderIcon}>▦</Text>
          </View>
          <Text style={styles.qrNote}>
            سيُفعَّل رمز الفاتورة الإلكترونية عند الربط مع منظومة الفوترة الإلكترونية (زاتكا)
          </Text>
        </View>

        {Platform.OS === 'web' && (
          <View style={{ marginTop: 16 }}>
            <PrimaryButton title={t('invoice.print')} onPress={handlePrint} />
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 20 },
  headRow: { alignItems: 'center', marginBottom: 14 },
  storeName: { fontFamily: fonts.heading, fontSize: 17, color: colors.ink, textAlign: 'center' },
  invoiceTitleAr: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text, marginTop: 4 },
  invoiceTitleEn: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.muted, marginTop: 1 },
  sectionLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'right',
    marginTop: 10,
    marginBottom: 4,
  },
  metaBox: {
    backgroundColor: colors.chipBg,
    borderRadius: radius.sm,
    padding: 12,
    gap: 6,
  },
  metaRow: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  metaLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'right' },
  metaValue: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.text, textAlign: 'left' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  itemRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 8 },
  itemName: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text, textAlign: 'right' },
  itemQty: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'right', marginTop: 2 },
  itemTotal: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink },
  sumRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 4 },
  sumLabel: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted },
  sumValue: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.text },
  address: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted, textAlign: 'right', marginBottom: 4 },
  totalsBox: {
    backgroundColor: colors.chipBg,
    borderRadius: radius.sm,
    padding: 12,
  },
  totalLabel: { fontFamily: fonts.heading, fontSize: 15, color: colors.ink },
  totalValue: { fontFamily: fonts.heading, fontSize: 15, color: colors.ink },
  qrBox: { alignItems: 'center', marginTop: 18 },
  qrPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholderIcon: { fontSize: 34, color: colors.border },
  qrNote: {
    fontFamily: fonts.body,
    fontSize: 10.5,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 240,
  },
});
