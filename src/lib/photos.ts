import * as ImagePicker from 'expo-image-picker';

import type { PickedImage } from './cover';

/** One square-cropped photo (cropping UI is native only; on web the picked image is used as is). */
export async function pickAvatar(): Promise<PickedImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (result.canceled) return null;
  const a = result.assets[0];
  return { uri: a.uri, mimeType: a.mimeType ?? 'image/jpeg' };
}

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
