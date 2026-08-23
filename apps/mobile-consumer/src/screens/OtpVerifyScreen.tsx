import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { apiFetch, ApiError, ConsumerUser, setSession } from '@/lib/api';
import { colors, fonts } from '@/theme/colors';
import { Card, ErrorText, LinkButton, Note, PrimaryButton } from '@/components/ui';
import TextField from '@/components/TextField';
import { useLocale } from '@/lib/i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'OtpVerify'>;

interface VerifyResponse {
  accessToken: string;
  user: ConsumerUser;
}

export default function OtpVerifyScreen({ route, navigation }: Props) {
  const { t, tf, textAlign } = useLocale();
  const { phone, devOtp, returnTo } = route.params;
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (code.trim().length !== 6) {
      setError(t('otpVerify.codeRequired'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch<VerifyResponse>('/consumer-auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, code: code.trim(), name: name.trim() || undefined }),
      });
      await setSession(res.accessToken, res.user);
      if (returnTo) {
        navigation.reset({
          index: 1,
          routes: [{ name: 'Home' }, { name: returnTo.screen, params: returnTo.params } as never],
        });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('otpVerify.genericError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card>
          <Text style={[styles.title, { textAlign }]}>{t('otpVerify.title')}</Text>
          <Text style={[styles.subtitle, { textAlign }]}>{tf('otpVerify.subtitle', phone)}</Text>
          {devOtp ? <Note>{tf('otpVerify.devMode', devOtp)}</Note> : null}
          <TextField
            label={t('otpVerify.codeLabel')}
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
          />
          <TextField
            label={t('otpVerify.nameLabel')}
            placeholder={t('otpVerify.optional')}
            value={name}
            onChangeText={setName}
          />
          {error ? <ErrorText>{error}</ErrorText> : null}
          <PrimaryButton title={t('otpVerify.confirm')} onPress={handleSubmit} loading={loading} />
          <LinkButton title={t('otpVerify.back')} onPress={() => navigation.goBack()} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.ink, marginBottom: 6 },
  subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginBottom: 14 },
});
