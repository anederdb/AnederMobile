import { Image } from 'react-native';

// aneder_logo.jpg is 188x188 with a white background, so keep it on white surfaces.
export function Logo({ size = 120 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/brand/aneder_logo.jpg')}
      accessibilityLabel="ANEDER Ankara Emlakçılar Derneği"
      style={{ width: size, height: size, alignSelf: 'center' }}
      resizeMode="contain"
    />
  );
}
