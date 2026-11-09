import * as ImagePicker from 'expo-image-picker';

import type { PickedImage } from './cover';

export async function pickImages(limit: number): Promise<PickedImage[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: limit,
    quality: 0.7,
  });
  if (result.canceled) return [];
  return result.assets.map((a) => ({ uri: a.uri, mimeType: a.mimeType ?? 'image/jpeg' }));
}
