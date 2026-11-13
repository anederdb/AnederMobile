import { Ionicons } from '@expo/vector-icons';
import { Children, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { t } from '@/i18n/tr';
import { colors, radius, shadow, space, touch, type } from '@/theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function Field({ label, onFocus, onBlur, ...props }: TextInputProps & { label: string }) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true); // only used by password fields
  const secure = !!props.secureTextEntry;
  return (
    <View style={{ gap: space.xs }}>
      <Text style={type.label}>{label}</Text>
      <View>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
          {...props}
          secureTextEntry={secure ? hidden : undefined}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, focused && styles.inputFocused, secure && { paddingRight: 52 }, props.style]}
        />
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? t.auth.showPassword : t.auth.hidePassword}
            onPress={() => setHidden((h) => !h)}
            style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 48, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={22} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function Button({
  title,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  icon,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  /** Shows a spinner and ignores taps (async submits). */
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: ReactNode;
}) {
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && variant === 'primary' && { backgroundColor: colors.primaryPressed },
        pressed && variant !== 'primary' && { opacity: 0.75 },
        pressed && { transform: [{ scale: 0.985 }] },
        disabled && { opacity: 0.45 },
      ]}>
      {loading ? <ActivityIndicator color={variant === 'primary' ? colors.onPrimary : colors.ink} /> : icon}
      <Text style={[styles.buttonText, textColor[variant]]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 44,
        paddingHorizontal: space.md,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primary : colors.surface,
        justifyContent: 'center',
        opacity: pressed ? 0.8 : 1,
      })}>
      <Text style={{ color: selected ? colors.onPrimary : colors.ink, fontWeight: '600', fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={() => onChange(!checked)}
        hitSlop={10}
        style={{
          width: 28,
          height: 28,
          borderRadius: radius.sm,
          borderWidth: 2,
          borderColor: checked ? colors.primary : colors.border,
          backgroundColor: checked ? colors.primary : colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {checked ? <Ionicons name="checkmark" size={18} color={colors.onPrimary} /> : null}
      </Pressable>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

export function ErrorText({ children }: { children: string }) {
  return (
    <View style={styles.errorBox} accessibilityRole="alert">
      <Ionicons name="alert-circle" size={18} color={colors.danger} />
      <Text style={[type.caption, { color: colors.danger, fontSize: 14, flex: 1 }]}>{children}</Text>
    </View>
  );
}

/** White rounded surface with the app's one shadow; tappable when `onPress` is given. */
export function Card({
  children,
  onPress,
  style,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  if (!onPress) return <View style={[styles.card, style]}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}>
      {children}
    </Pressable>
  );
}

/** Small pill: brand (red), success (green), info (blue) or neutral. Always carries text, never color alone. */
export function Badge({ label, tone = 'brand' }: { label: string; tone?: 'brand' | 'success' | 'info' | 'neutral' }) {
  const tones = {
    brand: { bg: colors.primaryTint, fg: colors.primary },
    success: { bg: colors.successTint, fg: colors.success },
    info: { bg: colors.infoTint, fg: colors.info },
    neutral: { bg: colors.surfaceMuted, fg: colors.inkSoft },
  }[tone];
  return (
    <View style={{ alignSelf: 'flex-start', backgroundColor: tones.bg, borderRadius: radius.pill, paddingHorizontal: space.sm + 2, paddingVertical: 3 }}>
      <Text style={[type.label, { color: tones.fg }]}>{label}</Text>
    </View>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: space.sm }}>
      <Text accessibilityRole="header" style={type.title}>
        {title}
      </Text>
      {action && onAction ? (
        <Pressable accessibilityRole="link" onPress={onAction} hitSlop={12}>
          <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** A tappable settings-style row: icon chip, title, optional subtitle, chevron. Use inside <ListGroup>. */
export function ListRow({
  icon,
  title,
  subtitle,
  onPress,
  tone,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  tone?: 'danger';
}) {
  const fg = tone === 'danger' ? colors.danger : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
        backgroundColor: pressed ? colors.background : colors.surface,
      })}>
      <View style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={20} color={fg} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[type.heading, tone === 'danger' && { color: colors.danger }]}>{title}</Text>
        {subtitle ? <Text style={type.caption}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
    </Pressable>
  );
}

/** Card that stacks <ListRow>s with hairline dividers. */
export function ListGroup({ children }: { children: ReactNode }) {
  const rows = Children.toArray(children);
  return (
    <View style={[styles.card, { padding: 0, overflow: 'hidden', gap: 0 }]}>
      {rows.map((row, i) => (
        <View key={i} style={i > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border } : undefined}>
          {row}
        </View>
      ))}
    </View>
  );
}

/** A labelled on/off switch with a short description underneath (settings). */
export function SwitchRow({
  label,
  description,
  value,
  onValueChange,
  disabled,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.xs }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={type.heading}>{label}</Text>
        {description ? <Text style={type.caption}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        accessibilityLabel={label}
        trackColor={{ true: colors.primary, false: colors.border }}
      />
    </View>
  );
}

/** One line of detail: small icon + text (dates, places, specs). */
export function InfoRow({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm + 2 }}>
      <View style={{ width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={[type.body, { flex: 1 }]}>{text}</Text>
    </View>
  );
}

/** Friendly empty state: icon, message, optional hint. */
export function EmptyState({ icon, title, hint }: { icon: IconName; title: string; hint?: string }) {
  return (
    <View style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.xl, paddingHorizontal: space.lg }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={26} color={colors.muted} />
      </View>
      <Text style={[type.heading, { textAlign: 'center' }]}>{title}</Text>
      {hint ? <Text style={[type.caption, { textAlign: 'center' }]}>{hint}</Text> : null}
    </View>
  );
}

/** Pulsing placeholder block while content loads (static when the system asks for reduced motion). */
export function Skeleton({ height = 72, style }: { height?: number; style?: StyleProp<ViewStyle> }) {
  const pulse = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced || cancelled) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
        ]),
      );
      loop.start();
    });
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [pulse]);
  return <Animated.View accessibilityElementsHidden style={[{ height, borderRadius: radius.lg, backgroundColor: colors.surfaceMuted, opacity: pulse }, style]} />;
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
    backgroundColor: colors.surface,
  },
  inputFocused: { borderColor: colors.primary, borderWidth: 2, paddingHorizontal: space.md - 1 },
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surfaceMuted },
  danger: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.danger },
  buttonText: { fontSize: 16, fontWeight: '600' },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: space.md, gap: space.xs, ...shadow.card },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm, backgroundColor: colors.primaryTint, borderRadius: radius.md, padding: space.sm + 2 },
});
