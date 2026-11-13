import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Text, View } from 'react-native';

import { t } from '@/i18n/tr';
import { colors, radius, shadow, space, type } from '@/theme';

const PIECES = 26;
const PALETTE = [colors.primary, colors.success, colors.info, '#F4A261', '#E9C46A'];

type Piece = { x: number; size: number; drift: number; spin: number; delay: number; color: string; progress: Animated.Value };

/** Birthday greeting for the home screen: a tinted card with a short, one-time confetti burst. */
export function BirthdayCard({ name }: { name: string }) {
  const [animate, setAnimate] = useState(false);
  const pieces = useRef<Piece[]>(
    Array.from({ length: PIECES }, (_, i) => ({
      x: (i / PIECES) * 100 + Math.random() * 3,
      size: 6 + Math.random() * 6,
      drift: (Math.random() - 0.5) * 60,
      spin: 180 + Math.random() * 360,
      delay: Math.random() * 500,
      color: PALETTE[i % PALETTE.length],
      progress: new Animated.Value(0),
    })),
  ).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced || cancelled) return;
      setAnimate(true);
      Animated.parallel(
        pieces.map((p) => Animated.timing(p.progress, { toValue: 1, duration: 2200, delay: p.delay, easing: Easing.out(Easing.quad), useNativeDriver: true })),
      ).start();
    });
    return () => {
      cancelled = true;
    };
  }, [pieces]);

  return (
    <View style={{ backgroundColor: colors.primaryTint, borderRadius: radius.xl, padding: space.md, overflow: 'hidden', ...shadow.card }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="gift" size={28} color={colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text accessibilityRole="header" style={[type.title, { color: colors.primary }]}>
            {t.birthday.title} {name}!
          </Text>
          <Text style={type.body}>{t.birthday.message}</Text>
        </View>
      </View>
      {animate ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {pieces.map((p, i) => (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                top: -12,
                left: `${p.x}%`,
                width: p.size,
                height: p.size * 0.6,
                borderRadius: 1,
                backgroundColor: p.color,
                opacity: p.progress.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] }),
                transform: [
                  { translateY: p.progress.interpolate({ inputRange: [0, 1], outputRange: [0, 150] }) },
                  { translateX: p.progress.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
                  { rotate: p.progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
                ],
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
