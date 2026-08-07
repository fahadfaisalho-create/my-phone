import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { apiFetch, ApiError } from '@/lib/api';
import { colors, fonts } from '@/theme/colors';
import { Card, ErrorText, Note, PrimaryButton } from '@/components/ui';
import TextField from '@/components/TextField';

type Props = NativeStackScreenProps<RootStackParamList, 'OtpRequest'>;

export default function OtpRequestScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!phone.trim()) {
      setError('أدخل رقم الجوال');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch<{ message: string; devOtp?: string }>('/consumer-auth/request-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim() }),
      });
      navigation.navigate('OtpVerify', { phone: phone.trim(), devOtp: res.devOtp });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر الاتصال بالخادم');
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
        <Text style={styles.brand}>منصة صيانة وبيع الجوالات</Text>
        <Card style={{ marginTop: 30 }}>
          <Text style={styles.title}>تسجيل الدخول</Text>
          <Note>سنرسل لك رمز تحقق مكوّن من 6 أرقام عبر رسالة SMS</Note>
          <TextField
            label="رقم الجوال"
            placeholder="05xxxxxxxx"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          {error ? <ErrorText>{error}</ErrorText> : null}
          <PrimaryButton title="إرسال رمز التحقق" onPress={handleSubmit} loading={loading} />
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
    textAlign: 'right',
  },
});
