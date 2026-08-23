import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { apiFetch, ApiError } from '@/lib/api';
import { colors, fonts } from '@/theme/colors';
import { Badge, Card, EmptyState, ErrorText, PrimaryButton } from '@/components/ui';
import TextField from '@/components/TextField';
import { useLocale } from '@/lib/i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Support'>;

type TicketStatus = 'open' | 'in_progress' | 'closed';

interface Ticket {
  id: string;
  subject: string;
  status: TicketStatus;
  createdAt: string;
}

const STATUS_TONE: Record<TicketStatus, 'green' | 'amber'> = {
  open: 'amber',
  in_progress: 'amber',
  closed: 'green',
};

export default function SupportScreen({}: Props) {
  const { t, locale, textAlign, row } = useLocale();
  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US';
  const STATUS_LABEL: Record<TicketStatus, string> = {
    open: t('support.statusOpen'),
    in_progress: t('support.statusInProgress'),
    closed: t('support.statusClosed'),
  };
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await apiFetch<Ticket[]>('/support-tickets/me');
      setTickets(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('support.loadError'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit() {
    if (!subject.trim()) return;
    setSaving(true);
    setError('');
    try {
      await apiFetch('/support-tickets', {
        method: 'POST',
        body: JSON.stringify({ subject: subject.trim() }),
      });
      setSubject('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('support.submitError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={tickets}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: 14 }}
        ListHeaderComponent={
          <Card>
            <Text style={[styles.title, { textAlign }]}>{t('support.newTicket')}</Text>
            <TextField
              label={t('support.subjectLabel')}
              placeholder={t('support.subjectPlaceholder')}
              value={subject}
              onChangeText={setSubject}
            />
            {error ? <ErrorText>{error}</ErrorText> : null}
            <PrimaryButton title={t('support.send')} onPress={handleSubmit} loading={saving} />
          </Card>
        }
        ListEmptyComponent={
          !loading ? <EmptyState icon="🆘" text={t('support.empty')} /> : null
        }
        renderItem={({ item }) => (
          <View style={[styles.row, { flexDirection: row }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.subject, { textAlign }]}>{item.subject}</Text>
              <Text style={[styles.date, { textAlign }]}>{new Date(item.createdAt).toLocaleDateString(dateLocale)}</Text>
            </View>
            <Badge label={STATUS_LABEL[item.status]} tone={STATUS_TONE[item.status]} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  title: { fontFamily: fonts.headingSemi, fontSize: 15, color: colors.ink, textAlign: 'right', marginBottom: 12 },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  subject: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.text, textAlign: 'right' },
  date: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted, textAlign: 'right', marginTop: 3 },
  empty: { textAlign: 'center', color: colors.muted, fontFamily: fonts.body, marginTop: 20 },
});
