import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { apiFetch, ApiError, ConsumerUser, setSession } from '@/lib/api';
import { colors, fonts } from '@/theme/colors';
import { Card, ErrorText, LinkButton, Note, PrimaryButton } from '@/components/ui';
import TextField from '@/components/TextField';

type Props = NativeStackScreenProps<RootStackParamList, 'OtpVerify'>;

interface VerifyResponse {
  accessToken: string;
  user: ConsumerUser;
}

export default function OtpVerifyScreen({ route, navigation }: Props) {
  const { phone, devOtp } = route.params;
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (code.trim().length !== 6) {
      setError('رمز التحقق مكوّن من 6 أرقام');
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
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر التحقق من الرمز');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card>
          <Text style={styles.title}>تأكيد رقم الجوال</Text>
          <Text style={styles.subtitle}>أدخلنا رمز التحقق المرسل إلى {phone}</Text>
          {devOtp ? <Note>وضع تجريبي بدون بوابة SMS — رمز التحقق: {devOtp}</Note> : null}
          <TextField
            label="رمز التحقق"
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
          />
          <TextField
            label="اسمك (لأول مرة فقط)"
            placeholder="اختياري"
            value={name}
            onChangeText={setName}
          />
          {error ? <ErrorText>{error}</ErrorText> : null}
          <PrimaryButton title="تأكيد" onPress={handleSubmit} loading={loading} />
          <LinkButton title="رجوع" onPress={() => navigation.goBack()} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.ink, marginBottom: 6, textAlign: 'right' },
  subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginBottom: 14, textAlign: 'right' },
});
