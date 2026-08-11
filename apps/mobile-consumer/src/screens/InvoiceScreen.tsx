import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { apiFetch, ApiError } from '@/lib/api';
import { colors, fonts, radius } from '@/theme/colors';
import { Card, ErrorText, PrimaryButton, ScreenLoading } from '@/components/ui';

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
  deliveryAddress: string | null;
  total: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function InvoiceScreen({ route }: Props) {
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
        setError(err instanceof ApiError ? err.message : 'تعذّر تحميل الفاتورة');
      } finally {
        setLoading(false);
      }
    })();
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
        <ErrorText>{error || 'تعذّر تحميل الفاتورة'}</ErrorText>
      </View>
    );
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={{ padding: 16 }}>
      <Card>
        <View style={styles.headRow}>
          <Text style={styles.storeName}>{invoice.store.name}</Text>
          <Text style={styles.invoiceTitle}>فاتورة ضريبية</Text>
        </View>

        <View style={styles.metaBox}>
          <Text style={styles.metaLine}>رقم الفاتورة: {invoice.invoiceNo}</Text>
          {invoice.store.taxNo ? <Text style={styles.metaLine}>الرقم الضريبي: {invoice.store.taxNo}</Text> : null}
          <Text style={styles.metaLine}>السجل التجاري: {invoice.store.commercialRegisterNo}</Text>
          <Text style={styles.metaLine}>تاريخ الشراء: {formatDate(invoice.createdAt)}</Text>
          <Text style={styles.metaLine}>تاريخ الدفع: {formatDate(invoice.issuedAt)}</Text>
          <Text style={styles.metaLine}>العميل: {invoice.consumer.name}</Text>
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
        {invoice.deliveryType === 'delivery' && (
          <>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>
                رسوم التوصيل{invoice.courierProvider ? ` (${COURIER_LABEL[invoice.courierProvider]})` : ''}
              </Text>
              <Text style={styles.sumValue}>{invoice.deliveryFee ?? 0} ﷼</Text>
            </View>
            {invoice.deliveryAddress ? (
              <Text style={styles.address}>📍 {invoice.deliveryAddress}</Text>
            ) : null}
          </>
        )}
        <View style={[styles.sumRow, { marginTop: 6 }]}>
          <Text style={styles.totalLabel}>الإجمالي</Text>
          <Text style={styles.totalValue}>{invoice.total} ﷼</Text>
        </View>

        {Platform.OS === 'web' && (
          <View style={{ marginTop: 16 }}>
            <PrimaryButton title="🖨️ طباعة / حفظ PDF" onPress={handlePrint} />
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
  invoiceTitle: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.muted, marginTop: 2 },
  metaBox: {
    backgroundColor: colors.chipBg,
    borderRadius: radius.sm,
    padding: 12,
    gap: 4,
  },
  metaLine: { fontFamily: fonts.body, fontSize: 12.5, color: colors.text, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  itemRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 8 },
  itemName: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text, textAlign: 'right' },
  itemQty: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'right', marginTop: 2 },
  itemTotal: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink },
  sumRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 4 },
  sumLabel: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted },
  sumValue: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.text },
  address: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted, textAlign: 'right', marginBottom: 4 },
  totalLabel: { fontFamily: fonts.heading, fontSize: 15, color: colors.ink },
  totalValue: { fontFamily: fonts.heading, fontSize: 15, color: colors.ink },
});
