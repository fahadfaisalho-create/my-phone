import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { apiFetch, ApiError, ConsumerUser, setSession } from '@/lib/api';
import { colors, fonts, radius } from '@/theme/colors';
import { ErrorText, LinkButton, Note, PrimaryButton } from '@/components/ui';
import TextField from '@/components/TextField';
import { useLocale } from '@/lib/i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'AuthPassword'>;

interface SessionResponse {
  accessToken: string;
  user: ConsumerUser;
}

// خطوة 2: لو الرقم مسجّل (registered) تُعرض خانة كلمة السر فقط لتسجيل
// الدخول، ولو رقم جديد تُعرض خانتا كلمة السر + الاسم لإنشاء الحساب فوراً
export default function AuthPasswordScreen({ route, navigation }: Props) {
  const { t, textAlign } = useLocale();
  const { phone, registered, returnTo } = route.params;
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!password.trim()) {
      setError(t('authPassword.passwordRequired'));
      return;
    }
    if (!registered && !name.trim()) {
      setError(t('authPassword.nameRequired'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      const path = registered ? '/consumer-auth/login' : '/consumer-auth/register';
      const body = registered
        ? { phone, password }
        : { phone, password, name: name.trim() };
      const res = await apiFetch<SessionResponse>(path, {
        method: 'POST',
        body: JSON.stringify(body),
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
      setError(err instanceof ApiError ? err.message : t('authPassword.genericError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.iconBadge}>
          <Text style={styles.iconBadgeText}>{registered ? '🔐' : '📝'}</Text>
        </View>
        <Text style={[styles.title, { textAlign }]}>
          {registered ? t('authPassword.loginTitle') : t('authPassword.signupTitle')}
        </Text>
        <Text style={[styles.subtitle, { textAlign }]}>{phone}</Text>
        {!registered && (
          <TextField
            label={t('authPassword.nameLabel')}
            placeholder={t('authPassword.namePlaceholder')}
            value={name}
            onChangeText={setName}
          />
        )}
        <TextField
          label={t('authPassword.passwordLabel')}
          placeholder={t('authPassword.passwordPlaceholder')}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <ErrorText>{error}</ErrorText> : null}
        <PrimaryButton
          title={registered ? t('authPassword.loginSubmit') : t('authPassword.signupSubmit')}
          onPress={handleSubmit}
          loading={loading}
        />
        <View style={styles.backLink}>
          <LinkButton title={t('authPassword.back')} onPress={() => navigation.goBack()} />
        </View>
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
    marginBottom: 20,
  },
  iconBadgeText: { fontSize: 28 },
  title: { fontFamily: fonts.headingExtra, fontSize: 22, color: colors.ink, marginBottom: 6 },
  subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginBottom: 14 },
  backLink: { marginTop: 4 },
});
