import { Image, View } from 'react-native';

import { shadow } from '@/theme';

// aneder_logo.jpg is 188x188 with a white background, so it sits in a white rounded tile on the grey page.
export function Logo({ size = 120 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignSelf: 'center',
        borderRadius: size * 0.24,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        ...shadow.card,
      }}>
      <Image
        source={require('../../assets/brand/aneder_logo.jpg')}
        accessibilityLabel="ANEDER Ankara Emlakçılar Derneği"
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
      />
    </View>
  );
}
