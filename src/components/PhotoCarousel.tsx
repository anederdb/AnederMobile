import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, View } from 'react-native';

import { colors, radius, space } from '@/theme';

/** Full-width 16:9 photos, swipe left and right, with page dots. */
export function PhotoCarousel({ urls, label }: { urls: string[]; label: string }) {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  if (urls.length === 0) return null;
  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ gap: space.sm }}>
      {width > 0 ? (
        <FlatList
          data={urls}
          keyExtractor={(u) => u}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            <Image
              source={{ uri: item }}
              accessibilityLabel={label}
              contentFit="cover"
              style={{ width, aspectRatio: 16 / 9, borderRadius: radius.lg, backgroundColor: colors.border }}
            />
          )}
        />
      ) : null}
      {urls.length > 1 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
          {urls.map((u, i) => (
            <View
              key={u}
              style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i === index ? colors.primary : colors.border }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
