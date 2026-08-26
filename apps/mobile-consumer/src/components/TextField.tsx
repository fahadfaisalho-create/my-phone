import { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, fonts, radius } from '@/theme/colors';
import { useLocale } from '@/lib/i18n';

export default function TextField({ label, onFocus, onBlur, ...props }: { label: string } & TextInputProps) {
  const { textAlign } = useLocale();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { textAlign }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        style={[styles.input, focused && styles.inputFocused]}
        textAlign={textAlign}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 12.5, color: colors.muted, marginBottom: 5, fontFamily: fonts.bodyMedium },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: colors.fieldBg,
    color: colors.text,
    fontFamily: fonts.body,
  },
  inputFocused: { borderColor: colors.indigo, backgroundColor: colors.card },
});
