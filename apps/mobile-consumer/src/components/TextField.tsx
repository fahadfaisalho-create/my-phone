import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, fonts } from '@/theme/colors';
import { useLocale } from '@/lib/i18n';

export default function TextField({ label, ...props }: { label: string } & TextInputProps) {
  const { textAlign } = useLocale();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { textAlign }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        style={styles.input}
        textAlign={textAlign}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 12.5, color: colors.muted, marginBottom: 5, fontFamily: fonts.bodyMedium },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    backgroundColor: '#FCFBF8',
    color: colors.text,
    fontFamily: fonts.body,
  },
});
