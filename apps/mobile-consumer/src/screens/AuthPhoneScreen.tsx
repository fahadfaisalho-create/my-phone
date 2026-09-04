import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { apiFetch, ApiError } from '@/lib/api';
import { colors, fonts, radius } from '@/theme/colors';
import { ErrorText, LinkButton, Note, PrimaryButton } from '@/components/ui';
import TextField from '@/components/TextField';
import { useLocale } from '@/lib/i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'AuthPhone'>;

// خطوة 1: يدخل المستخدم رقم جواله فقط — النظام يتحقق هل الرقم مسجّل مسبقاً
// أو لا، ويوجّهه لشاشة كلمة السر المناسبة (دخول أو إنشاء حساب جديد)
export default function AuthPhoneScreen({ navigation, route }: Props) {
  const returnTo = route.params?.returnTo;
  const { t, textAlign, toggleLocale } = useLocale();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!phone.trim()) {
      setError(t('authPhone.phoneLabel'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch<{ registered: boolean }>('/consumer-auth/check-phone', {
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim() }),
      });
      navigation.navigate('AuthPassword', { phone: phone.trim(), registered: res.registered, returnTo });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('authPhone.genericError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <LinkButton title={t('common.langToggle')} onPress={toggleLocale} />
        <View style={styles.iconBadge}>
          <Text style={styles.iconBadgeText}>📱</Text>
        </View>
        <Text style={[styles.title, { textAlign }]}>{t('authPhone.title')}</Text>
        <Note>{t('authPhone.subtitle')}</Note>
        <TextField
          label={t('authPhone.phoneLabel')}
          placeholder={t('authPhone.phonePlaceholder')}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        {error ? <ErrorText>{error}</ErrorText> : null}
        <PrimaryButton
          title={loading ? t('authPhone.submitting') : t('authPhone.submit')}
          onPress={handleSubmit}
          loading={loading}
        />
        {navigation.canGoBack() && (
          <View style={styles.backLink}>
            <LinkButton title={t('authPhone.continueGuest')} onPress={() => navigation.goBack()} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, padding: 24, paddingTop: 32, justifyContent: 'center' },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  iconBadgeText: { fontSize: 28 },
  title: {
    fontFamily: fonts.headingExtra,
    fontSize: 24,
    color: colors.ink,
    marginBottom: 8,
  },
  backLink: { marginTop: 4 },
});
