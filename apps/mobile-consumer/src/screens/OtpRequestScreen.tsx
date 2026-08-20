import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { apiFetch, ApiError } from '@/lib/api';
import { colors, fonts } from '@/theme/colors';
import { Card, ErrorText, LinkButton, Note, PrimaryButton } from '@/components/ui';
import TextField from '@/components/TextField';
import { useLocale } from '@/lib/i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'OtpRequest'>;

export default function OtpRequestScreen({ navigation, route }: Props) {
  const returnTo = route.params?.returnTo;
  const { t, textAlign, toggleLocale } = useLocale();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!phone.trim()) {
      setError(t('otpRequest.phoneLabel'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch<{ message: string; devOtp?: string }>('/consumer-auth/request-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim() }),
      });
      navigation.navigate('OtpVerify', { phone: phone.trim(), devOtp: res.devOtp, returnTo });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('otpRequest.genericError'));
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
        <Text style={styles.brand}>📱 My Phone</Text>
        <LinkButton title={`🌐 ${t('common.langToggle')}`} onPress={toggleLocale} />
        <Card style={{ marginTop: 14 }}>
          <Text style={[styles.title, { textAlign }]}>{t('otpRequest.title')}</Text>
          <Note>{t('otpRequest.subtitle')}</Note>
          <TextField
            label={t('otpRequest.phoneLabel')}
            placeholder={t('otpRequest.phonePlaceholder')}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          {error ? <ErrorText>{error}</ErrorText> : null}
          <PrimaryButton
            title={loading ? t('otpRequest.submitting') : t('otpRequest.submit')}
            onPress={handleSubmit}
            loading={loading}
          />
          {navigation.canGoBack() && (
            <LinkButton title={t('otpRequest.continueGuest')} onPress={() => navigation.goBack()} />
          )}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  brand: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.ink,
    textAlign: 'center',
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 16,
  },
});
