import * as ImagePicker from 'expo-image-picker';

import { supabase } from './supabase';

export type PickedImage = { uri: string; mimeType: string };

export async function pickImage(): Promise<PickedImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [16, 9],
    quality: 0.7,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' };
}

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Uploads to the public `covers` bucket (admin-only write) and returns the public URL. */
export async function uploadCover(image: PickedImage): Promise<string> {
  // Raw bytes, not a Blob: Blob uploads can silently store empty files on React Native.
  const bytes = await (await fetch(image.uri)).arrayBuffer();
  if (bytes.byteLength === 0) throw new Error('empty image');
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${EXT[image.mimeType] ?? 'jpg'}`;
  const { error } = await supabase.storage.from('covers').upload(path, bytes, { contentType: image.mimeType });
  if (error) throw error;
  return supabase.storage.from('covers').getPublicUrl(path).data.publicUrl;
}
