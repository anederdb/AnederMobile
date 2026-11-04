import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, space, touch, type } from '@/theme';

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: space.xs }}>
      <Text style={type.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.placeholder}
        autoCapitalize="none"
        {...props}
        style={[styles.input, props.style]}
      />
    </View>
  );
}

export function Button({
  title,
  onPress,
  disabled,
  variant = 'primary',
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && variant === 'primary' && { backgroundColor: colors.primaryPressed },
        pressed && variant !== 'primary' && { opacity: 0.7 },
        disabled && { opacity: 0.45 },
      ]}>
      <Text style={[styles.buttonText, textColor[variant]]}>{title}</Text>
    </Pressable>
  );
}

export function ErrorText({ children }: { children: string }) {
  return (
    <Text accessibilityRole="alert" style={[type.caption, { color: colors.danger, fontSize: 14 }]}>
      {children}
    </Text>
  );
}

const textColor = {
  primary: { color: colors.onPrimary },
  secondary: { color: colors.ink },
  danger: { color: colors.danger },
};

const styles = StyleSheet.create({
  input: {
    minHeight: touch.minHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.background,
  },
  button: {
    minHeight: touch.minHeight,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surface },
  danger: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.danger },
  buttonText: { fontSize: 16, fontWeight: '600' },
});
